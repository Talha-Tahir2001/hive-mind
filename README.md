# HiveMind — Agent Hive with Shared Persistent Memory

HiveMind is a multi-agent system where **Coder**, **Reviewer**, and **Deployer** agents collaborate on software
tasks through a **shared persistent memory** backed by CockroachDB. Every decision is remembered, audited, and
semantically searchable — so the hive gets smarter with every run.

```
┌────────────────────────────────────────────────────────────────────┐
│                            Dashboard (Next.js)                     │
│  Run pipeline · Track live agent activity · Search memories        │
│  Inject issues · Export memory sets                                 │
└───────────────┬──────────────────────────────┬─────────────────────┘
                │                              │
        POST /api/pipeline             semantic search / export
                │                              │
┌───────────────▼─────────────────────────────────────────────────────┐
│                        Orchestrator (lib/agents)                    │
│   runPipeline → step transport → executeAgent                        │
│   (local process  OR  AWS Lambda agent-executor)                    │
└───────────────┬──────────────────────────────┬─────────────────────┘
                │                              │
        read / write memories          issue injection (human)
                │                              │
┌───────────────▼──────────────────────────────▼──────────────────────┐
│                 CockroachDB — Shared Persistent Memory              │
│   agents · runs · run_steps · memories · memory_reads               │
│   pgvector VECTOR(1536) + DISTRIBUTED VECTOR INDEX                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

- **Three-agent pipeline** — Coder writes code and findings → Reviewer critiques or approves (up to 2 fix loops)
  → Deployer produces a deployment plan. Run IDs carry lineage end-to-end.
- **Shared persistent memory** — every memory is stored with a 1536-dim embedding. Agents pull relevant context
  via **semantic search** (`<=>` vector distance), recent activity, and their own run's output.
- **Distributed vector indexing** — the vector index is created with CockroachDB's distributed index framework so
  semantic search scales beyond a single node.
- **Live pipeline UI** — start runs in the browser, watch each agent's `reading → thinking → writing → done` cycle,
  and see what each agent read and wrote.
- **Issue injection** — humans feed the hive from the UI or `POST /api/pipeline/inject`. Injected issues are
  embedded and surface to every agent in the next run (they are *not* filtered by run exclusion).
- **Audit trail** — `memory_reads` records which agent read which memory, when, and with what similarity score.
- **Distributed execution (optional)** — the agent executor bundles into a **single-file AWS Lambda**; set
  `AGENT_EXECUTOR_LAMBDA` and every pipeline step runs serverless against the same shared memory.

## Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Next.js 16 (App Router), React 19, shadcn/ui, Tailwind v4, Clerk auth |
| Database  | CockroachDB (Postgres wire) with `pgvector` |
| LLM       | OpenAI-compatible API (AI/ML API) — chat + embeddings, with timeout/retry hardening |
| Serverless| AWS Lambda (`@aws-sdk/client-lambda`) + esbuild bundle |
| Tooling   | TypeScript, tsx, esbuild, archiver |

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A CockroachDB cluster (Cloud free tier works) with the **vector extension** available
- An AI/ML API key (or any OpenAI-compatible endpoint)
- Clerk app credentials for dashboard auth

### 2. Configure environment

Copy the required values into `.env`:

```
# Database (CockroachDB)
CRDB_CONNECTION_STRING=postgresql://user:pass@host:26257/defaultdb?sslmode=require

# LLM (AI/ML API — OpenAI compatible)
AIML_API_KEY=...
AIML_CHAT_MODEL=anthropic/claude-3.5-sonnet
AIML_EMBED_MODEL=text-embedding-3-small

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Optional: route pipeline steps through AWS Lambda
# AGENT_EXECUTOR_LAMBDA=hivemind-agent-executor
```

### 3. Set up the database

```bash
npm run db:setup     # apply schema + seed the three agents
npm run db:embed     # backfill embeddings for existing memories
npm run db:vector    # create the distributed vector index
```

> **Embeddings before index:** the schema creates `memories`, seeds the agents, and (re)creates the vector
> index idempotently. Backfill embeddings *before* running `db:vector` so the index covers existing rows.

### 4. Run the app

```bash
npm run dev
```

Then sign in, open **Pipeline**, give the hive a task (e.g. *"Build a simple health check endpoint"*), and run it.

### 5. Verify the pipeline end-to-end (no browser needed)

```bash
npm run pipeline:test    # runs the full pipeline and prints the run + memories
```

## How a Run Works

1. `runPipeline` creates a `runs` row and executes the **Coder**.
2. Each `executeAgent` step:
   - sees the agent, creates a `run_steps` row,
   - **reads**: embeds the task, semantically searches past memories (`threshold 0.3`, `limit 5`,
     excluding its own run — but *not* human-injected issues), pulls the last 15 memories and its run's output,
     and logs every read to `memory_reads`,
   - **thinks**: sends a compact prompt (system prompt + context) through the hardened LLM client,
   - **parses** the JSON memory array and **writes** each memory with a fresh embedding and lineage link.
3. The **Reviewer** runs; if it returns a `critique`, the **Coder** fixes, up to 2 loops, then a final review.
4. On approval the **Deployer** writes a deployment plan, and the run is marked `completed`.

## Distributed Execution (AWS Lambda)

The whole agent step (`lib/agents/executor`) is pure Node — no Next.js. It bundles into a single-file Lambda:

```bash
npm run lambda:test-local   # bundle + run the handler locally against the real DB + LLM (no AWS needed)
npm run deploy:lambda       # bundle, zip, create/update the function in AWS
```

- `deploy:lambda` reads `CRDB_*` and `AIML_*` secrets from `.env` and injects them as function env vars.
  Set `AGENT_EXECUTOR_ROLE_ARN` (or `LAMBDA_EXECUTION_ROLE_ARN`) on first create.
- Route steps through it by setting `AGENT_EXECUTOR_LAMBDA=<function name>` in the app. Without it,
  the transport (`lib/agents/transport.ts`) executes steps in-process.

## Project Structure

```
app/
  api/pipeline/            run + run status + issue injection endpoints
  api/memories/            list, export, semantic search
  dashboard/               pipeline, memories, agents, settings (Clerk-protected)
components/dashboard/      pipeline-runner, memory-feed, semantic-search, issue-injector, ...
lib/
  agents/                  executor, orchestrator, transport, prompts, parser
  memory/                  queries, types
  llm/                     hardened OpenAI-compatible client (timeout + retry)
  db/                      schema/seed/vector-index/embed-backfill runners
  aws/                     lambda + bedrock + s3 clients
lambda/agent-executor/     the Lambda handler entry point
scripts/                   build-lambda, deploy-lambda, test-lambda-local
sql/                       01-schema.sql, 02-seed.sql, 03-vector-index.sql
```

## API

| Endpoint                    | Method | Purpose |
|-----------------------------|--------|---------|
| `/api/pipeline`             | GET    | recent runs |
| `/api/pipeline`             | POST   | start a pipeline run |
| `/api/pipeline/run`         | GET    | latest run + live step status |
| `/api/pipeline/:runId`      | GET    | run detail incl. steps and memories |
| `/api/pipeline/inject`      | POST   | inject an issue into shared memory |
| `/api/memories`             | GET    | list memories (filter by type/run/search) |
| `/api/memories/search`      | GET    | semantic search over memories |
| `/api/memories/export`      | GET    | export a memory set as JSON |

## Scripts

| Script                | Description |
|-----------------------|-------------|
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck`  | ESLint + `tsc --noEmit` |
| `db:setup`            | schema + seed + vector index |
| `db:embed`            | backfill embeddings |
| `db:vector`           | create the distributed vector index |
| `pipeline:test`       | run the pipeline from the CLI and print results |
| `lambda:build`        | esbuild the agent executor |
| `lambda:test-local`   | bundle + run the Lambda handler locally |
| `deploy:lambda`       | deploy the function to AWS |

## License

MIT
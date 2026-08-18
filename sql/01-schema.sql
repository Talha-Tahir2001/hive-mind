-- ============================================
-- HiveMind — CockroachDB Schema
-- Agent Hive Mind with Shared Persistent Memory
-- ============================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- AGENTS
-- The three hive agents: Coder, Reviewer, Deployer
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING NOT NULL UNIQUE,
    type STRING NOT NULL,            -- 'coder', 'reviewer', 'deployer'
    description STRING NOT NULL,
    system_prompt TEXT NOT NULL,
    status STRING DEFAULT 'idle',    -- 'idle','thinking','reading','writing','done','error'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RUNS
-- Pipeline executions (Coder → Reviewer → Deployer)
-- ============================================
CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type STRING NOT NULL,     -- 'pipeline', 'issue_injection'
    trigger_input TEXT,                -- task description or issue text
    status STRING DEFAULT 'pending',  -- 'pending','running','completed','failed'
    review_loop_count INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RUN STEPS
-- Individual agent executions within a run
-- ============================================
CREATE TABLE IF NOT EXISTS run_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id),
    step_order INT NOT NULL,
    status STRING DEFAULT 'pending',  -- 'pending','thinking','reading','writing','done','error'
    input_summary TEXT,                -- what the agent read (human-readable)
    output_summary TEXT,               -- what the agent produced (human-readable)
    duration_ms INT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEMORIES
-- The shared brain — all agent outputs live here
-- ============================================
CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),     -- NULL for human-injected issues
    run_id UUID REFERENCES runs(id),
    memory_type STRING NOT NULL,             -- 'finding','critique','fix','approval','plan','issue','context'
    title STRING NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),                  -- pgvector: embedding of title + content
    metadata JSONB DEFAULT '{}',             -- flexible: code_snippet, file_path, severity, etc.
    parent_memory_id UUID REFERENCES memories(id),  -- lineage: what triggered this
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEMORY READS
-- Audit trail: who read what, when, why
-- ============================================
CREATE TABLE IF NOT EXISTS memory_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    read_by_agent_id UUID NOT NULL REFERENCES agents(id),
    run_id UUID NOT NULL REFERENCES runs(id),
    similarity_score FLOAT,                  -- for vector search hits
    read_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Memory lookups
CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories (agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_run ON memories (run_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_created ON memories (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_parent ON memories (parent_memory_id);
CREATE INDEX IF NOT EXISTS idx_memories_type_created ON memories (memory_type, created_at DESC);

-- Vector index for semantic search
-- Note: CockroachDB's distributed vector indexing handles this
-- The IVFFlat index is created after we have data (needs row count for lists param)
-- We'll create it in a migration after seeding

-- Memory reads lookups
CREATE INDEX IF NOT EXISTS idx_memory_reads_memory ON memory_reads (memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_reads_agent ON memory_reads (read_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_reads_run ON memory_reads (run_id);

-- Run lookups
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs (status);
CREATE INDEX IF NOT EXISTS idx_runs_created ON runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_run_steps_run ON run_steps (run_id);
CREATE INDEX IF NOT EXISTS idx_run_steps_run_order ON run_steps (run_id, step_order);

-- ============================================
-- SEED AGENTS
-- ============================================
INSERT INTO agents (name, type, description, system_prompt) VALUES
(
    'Coder',
    'coder',
    'Writes code and documents findings based on task descriptions and shared memory from the hive.',
    E'You are the Coder agent in a hive mind system. You write code and document technical findings.

BEFORE you write any code, you MUST:
1. Read shared memories from other agents (Reviewer feedback, past issues, coding standards)
2. Search for similar past implementations in memory
3. Consider any injected issues that need fixing

WHEN you write code, you MUST:
- Document your findings as structured memories
- Reference any memories that influenced your decisions
- Note any assumptions you''re making

OUTPUT FORMAT — respond with a JSON array of memories to write:
[
  {
    "memory_type": "finding|fix|context",
    "title": "Short summary",
    "content": "Detailed markdown content with code snippets",
    "metadata": { "code_snippet": "...", "file_path": "...", "language": "typescript" },
    "parent_memory_id": "uuid-of-memory-that-triggered-this (or null)"
  }
]

Be thorough. Write 1-3 memories per execution. Include code in markdown code blocks.'
),
(
    'Reviewer',
    'reviewer',
    'Reviews code written by Coder, identifies issues, and approves or requests changes based on shared standards.',
    E'You are the Reviewer agent in a hive mind system. You review code and identify issues.

BEFORE you review, you MUST:
1. Read the Coder''s latest memories from the current run
2. Search for similar past code and review outcomes in shared memory
3. Check coding standards and patterns from previous reviews

WHEN you review, you MUST:
- Check for security vulnerabilities, missing error handling, missing tests
- Check for consistency with patterns you''ve seen in past reviews
- If the Coder addressed a previous critique, verify the fix

DECISION:
- If issues found → write critique memories (memory_type: "critique")
- If code is good → write an approval memory (memory_type: "approval")

OUTPUT FORMAT — respond with a JSON array of memories to write:
[
  {
    "memory_type": "critique|approval",
    "title": "Short summary",
    "content": "Detailed markdown content explaining the issue or approval",
    "metadata": { "severity": "high|medium|low", "file_path": "...", "line_range": "..." },
    "parent_memory_id": "uuid-of-coder-memory-being-reviewed"
  }
]

Be precise. If approving, explain why. If critiquing, be specific about what needs to change.'
),
(
    'Deployer',
    'deployer',
    'Creates deployment plans for approved code, leveraging shared deployment history and infrastructure context.',
    E'You are the Deployer agent in a hive mind system. You create deployment plans.

BEFORE you plan, you MUST:
1. Read the Reviewer''s approval from the current run
2. Read the Coder''s findings/code from the current run
3. Search for similar past deployment plans in shared memory
4. Check for past deployment issues or infrastructure constraints

WHEN you create a deployment plan, you MUST:
- Specify the target environment and region
- List required environment variables and secrets
- Include rollback procedures
- Reference past deployment patterns that worked

OUTPUT FORMAT — respond with a JSON array of memories to write:
[
  {
    "memory_type": "plan",
    "title": "Short summary",
    "content": "Detailed markdown deployment plan with steps",
    "metadata": { "target_env": "production", "region": "us-east-1", "service_name": "..." },
    "parent_memory_id": "uuid-of-approval-memory"
  }
]

Be practical. Include specific commands, env vars, and health check URLs.'
) ON CONFLICT (name) DO NOTHING;
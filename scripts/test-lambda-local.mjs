// ============================================
// HiveMind — Local test of the Agent Executor
//
//   npm run lambda:test-local [task]
//
// Bundles the Lambda handler and invokes it in
// this process, exactly as AWS would. Uses the
// latest completed run so the write lands in a
// real pipeline context. No AWS credentials needed.
// ============================================

import { pathToFileURL } from "node:url";
import "dotenv/config";
import pg from "pg";
import { buildBundle, BUNDLE_FILE } from "./build-lambda.mjs";

const TASK =
  process.argv[2] ??
  "Write a minimal Node.js Express health-check endpoint as a finding memory. Respond only in the required JSON memory format.";

async function getLatestRunId() {
  const pool = new pg.Pool({ connectionString: process.env.CRDB_CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
  const result = await pool.query(`SELECT id, status, trigger_input FROM runs ORDER BY created_at DESC LIMIT 1`);
  const run = result.rows[0];
  await pool.end();
  if (!run) throw new Error("No runs in database — run `npm run pipeline:test` first");
  return run;
}

async function main() {
  const run = await getLatestRunId();
  console.log(`Using latest run: ${run.id} (${run.status})`);

  await buildBundle();

  console.log("▶ Invoking bundled handler locally...");
  const { handler } = await import(pathToFileURL(BUNDLE_FILE).href);

  const result = await handler({
    agentType: "coder",
    runId: run.id,
    stepOrder: 9000,
    task: TASK,
  });

  console.log("\n=== RESULT ===");
  console.log("ok:", result.ok);
  console.log("step:", JSON.stringify(result.step, null, 2));
  for (const m of result.memories ?? []) {
    console.log(`memory: [${m.memoryType}] ${m.title}`);
  }

  if (!result.ok) {
    console.error("error:", result.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Lambda test failed:", error);
  process.exit(1);
});
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./client";

async function applySchema() {
  console.log("📦 Applying HiveMind schema to CockroachDB...\n");

  const sql = readFileSync(join(process.cwd(), "sql/01-schema.sql"), "utf-8");

  try {
    await pool.query(sql);
    console.log("✅ Schema applied successfully");
    console.log("   - agents table");
    console.log("   - runs table");
    console.log("   - run_steps table");
    console.log("   - memories table");
    console.log("   - memory_reads table");
    console.log("   - indexes created");
    console.log("   - seed agents inserted (Coder, Reviewer, Deployer)\n");
  } catch (error) {
    console.error("❌ Schema application failed:");
    console.error(error);
    process.exit(1);
  }

  await pool.end();
}

applySchema();
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./client";

function extractStatements(sql: string): string[] {
  // Remove leading/trailing line comments (-- ...) so they never interfere
  // with statement splitting, then split on ";".
  const cleaned = sql
    .split("\n")
    .map((line) => (line.trim().startsWith("--") ? "" : line))
    .join("\n");

  return cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function applyVectorIndex() {
  console.log("🔍 Creating distributed vector index...\n");

  const sql = readFileSync(
    join(process.cwd(), "sql/03-vector-index.sql"),
    "utf-8"
  );

  const statements = extractStatements(sql);

  // Use a single client so session settings (SET sql_safe_updates = false)
  // persist across statements.
  const client = await pool.connect();

  try {
    for (const stmt of statements) {
      const label = stmt.split("\n")[0].slice(0, 70);
      try {
        await client.query(stmt);
        console.log(`✅ ${label}`);
      } catch (error) {
        console.error(`❌ Failed: ${label}`);
        console.error(
          "   ",
          error instanceof Error ? error.message : String(error)
        );
      }
    }
    console.log("\n✅ Vector index setup complete");
  } finally {
    client.release();
    await pool.end();
  }
}

applyVectorIndex();
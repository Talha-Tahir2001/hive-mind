import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./client";

async function seed() {
  console.log("🌱 Seeding HiveMind data...\n");

  const existing = await pool.query(
    `SELECT count(*)::int AS n FROM runs WHERE id = 'a0000000-0000-0000-0000-000000000001'`
  );

  if ((existing.rows[0] as { n: number }).n > 0) {
    console.log("✅ Seed data already applied — skipping");
    await pool.end();
    return;
  }

  const sql = readFileSync(join(process.cwd(), "sql/02-seed.sql"), "utf-8");

  try {
    await pool.query(sql);
    console.log("✅ Seed data applied successfully");
    console.log("   - 3 pipeline runs");
    console.log("   - 16 memories with full lineage");
    console.log("   - Memory reads (cross-agent + cross-run)\n");
  } catch (error) {
    console.error("❌ Seed data failed:");
    console.error(error);
    process.exit(1);
  }

  await pool.end();
}

seed();
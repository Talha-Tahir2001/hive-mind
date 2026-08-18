import "dotenv/config";
import { Pool, type PoolConfig } from "pg";

// Singleton pattern for Next.js development hot reload
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

function getPoolConfig(): PoolConfig {
  const connectionString = process.env.CRDB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("CRDB_CONNECTION_STRING is not set");
  }

  return {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // CockroachDB Cloud requires SSL
    ssl: {
      rejectUnauthorized: false, // Accept CockroachDB Cloud CA cert
    },
  };
}

export const pool = globalForDb.pool ?? new Pool(getPoolConfig());

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

// Helper: query with typed rows
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === "development") {
    console.log(`[DB] ${text.split("\n")[0]} — ${duration}ms — ${result.rowCount} rows`);
  }

  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
}

// Helper: single row
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] ?? null;
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await queryOne<{ version: string }>("SELECT version() as version");
    console.log(`[DB] Connected to: ${result?.version}`);
    return true;
  } catch (error) {
    console.error("[DB] Connection failed:", error);
    return false;
  }
}
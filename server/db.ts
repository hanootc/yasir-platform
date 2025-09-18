import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, SQL } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, {
  schema,
  logger: {
    logQuery: (query, params) => {
      console.log('SQL Query:', query);
      console.log('SQL Params:', params);
    }
  }
});

// Helper to execute raw SQL built with drizzle's sql tag across Node-Postgres
export async function exec(q: SQL) {
  const { sql: text, params } = q.toQuery();
  return pool.query(text, params as any[]);
}
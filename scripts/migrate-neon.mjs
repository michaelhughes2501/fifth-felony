import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run Neon migrations.");

const migrationsDir = resolve(process.cwd(), "neon/migrations");
const pool = new Pool({ connectionString, max: 1 });
let client;

try {
  client = await pool.connect();
  await client.query("SELECT pg_advisory_lock(hashtext('reentry-support-platform-migrations'))");
  await client.query(`CREATE TABLE IF NOT EXISTS app_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const existing = await client.query("SELECT 1 FROM app_migrations WHERE name = $1", [name]);
    if (existing.rowCount) {
      console.log(`Already applied: ${name}`);
      continue;
    }

    const sql = await readFile(resolve(migrationsDir, name), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO app_migrations(name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`Applied: ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${name} failed. Review Neon schema state before retrying.`, { cause: error });
    }
  }
} finally {
  if (client) {
    await client.query("SELECT pg_advisory_unlock(hashtext('reentry-support-platform-migrations'))").catch(() => {});
    client.release();
  }
  await pool.end();
}

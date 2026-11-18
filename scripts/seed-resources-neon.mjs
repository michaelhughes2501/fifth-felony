import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed Neon resources.");

const pool = new Pool({ connectionString, max: 1 });
try {
  const sql = await readFile(resolve(process.cwd(), "neon/seed.sql"), "utf8");
  await pool.query(sql);
  console.log("Neon resource seed complete.");
} finally {
  await pool.end();
}

import { neon } from "@neondatabase/serverless";

let cachedUrl: string | undefined;
let client: ReturnType<typeof neon> | undefined;

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to connect to Neon.");
  if (connectionString !== cachedUrl) {
    cachedUrl = connectionString;
    client = neon(connectionString);
  }
  return client!;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  return await getClient().query(text, params) as T[];
}

export async function queryOne<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await query<T>(text, params))[0] ?? null;
}

export async function checkDatabase(): Promise<void> {
  await queryOne<{ ok: number }>("SELECT 1 AS ok");
}

export function isDatabaseConfigured(): boolean {
  const value = process.env.DATABASE_URL;
  if (!value || /placeholder|your[-_]database|ep-example/i.test(value)) return false;
  try {
    const url = new URL(value);
    return ["postgres:", "postgresql:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export const DATABASE_NOT_CONFIGURED = "Neon is not configured. Set DATABASE_URL to a PostgreSQL connection string.";

export async function ensureProfile(userId: string, fullName?: string | null): Promise<void> {
  await query(
    "INSERT INTO profiles(id,full_name) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET full_name=COALESCE(profiles.full_name,EXCLUDED.full_name)",
    [userId, fullName ?? null],
  );
}

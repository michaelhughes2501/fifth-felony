import { z } from 'zod';

const isDev = process.env.NODE_ENV !== 'production';
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'Neon DATABASE_URL is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase Auth URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase Auth anon key is required'),
  OPENAI_API_KEY: isDev
    ? z.string().min(1, 'OpenAI API key is required')
    : z.string().min(1, 'OpenAI API key is required').startsWith('sk-', 'Invalid OpenAI API key format'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnvironment(): EnvConfig | null {
  try { return envSchema.parse(process.env); }
  catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      if (process.env.NODE_ENV === 'production') throw new Error(`Invalid or missing environment variables: ${issues}`);
      console.warn(`[validate-env] Missing/invalid env vars (app will run in limited mode): ${issues}`);
      return null;
    }
    throw error;
  }
}

export function validateApiKeys(): boolean {
  const { OPENAI_API_KEY, DATABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = process.env;
  const problems: string[] = [];
  if (!DATABASE_URL) problems.push('Missing DATABASE_URL');
  if (!OPENAI_API_KEY?.startsWith('sk-')) problems.push('OPENAI_API_KEY must start with sk-');
  if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) problems.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (problems.length === 0) return true;
  if (process.env.NODE_ENV === 'production') throw new Error(problems.join('; '));
  console.warn('[validate-env] API key issues (real integrations will be unavailable):', problems.join('; '));
  return false;
}

import { z } from 'zod';

// In production every key must be a real value.
// In development/test, placeholder values are allowed so the app boots
// for UI work without live API credentials.
const isDev = process.env.NODE_ENV !== 'production';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  // In development, any non-empty string is accepted; production requires the sk- prefix.
  OPENAI_API_KEY: isDev
    ? z.string().min(1, 'OpenAI API key is required')
    : z.string().min(1, 'OpenAI API key is required').startsWith('sk-', 'Invalid OpenAI API key format'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables.
 * In production: throws on any invalid/missing var.
 * In development: logs warnings but does NOT throw, so the app boots
 * with placeholder keys for UI-only work.
 */
export function validateEnvironment(): EnvConfig | null {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Invalid or missing environment variables: ${issues}`);
      }
      // Development: warn only - real API calls will fail gracefully at runtime.
      console.warn(`[validate-env] Missing/invalid env vars (app will run in limited mode): ${issues}`);
      return null;
    }
    throw error;
  }
}

/**
 * Checks that API keys look like real values.
 * Returns false (does NOT throw) when running with placeholder keys in dev.
 */
export function validateApiKeys(): boolean {
  const { OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const isProduction = process.env.NODE_ENV === 'production';

  const problems: string[] = [];

  if (!OPENAI_API_KEY?.startsWith('sk-')) problems.push('OPENAI_API_KEY must start with sk-');
  if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) problems.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) problems.push('Missing SUPABASE_SERVICE_ROLE_KEY');

  if (problems.length === 0) return true;

  if (isProduction) throw new Error(problems.join('; '));

  // Development: warn, do not crash.
  console.warn('[validate-env] API key issues (real integrations will be unavailable):', problems.join('; '));
  return false;
}

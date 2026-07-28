const REQUIRED_ENV_KEYS = ['MONGODB_URI', 'TENANT_BASE_DOMAIN'] as const;

export function validateEnv(
  env: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_KEYS.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing or empty required environment variables: ${missing.join(', ')}`,
    );
  }

  return env;
}

export type CerebrasConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function getCerebrasConfig(env: NodeJS.ProcessEnv = process.env): CerebrasConfig {
  const apiKey = env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY is required. Add it to .env.local before running live analysis.');
  }

  return {
    apiKey,
    baseUrl: env.CEREBRAS_BASE_URL ?? 'https://api.cerebras.ai/v1',
    model: env.CEREBRAS_MODEL ?? 'gemma-4-31b',
  };
}

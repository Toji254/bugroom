import { getCerebrasConfig } from '@/lib/env';

export async function GET() {
  try {
    const config = getCerebrasConfig();

    return Response.json({
      ok: true,
      service: 'BugRoom health',
      status: 'ready',
      model: config.model,
      provider: 'cerebras',
      hasApiKey: Boolean(config.apiKey),
      baseUrl: config.baseUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown configuration error';

    return Response.json(
      {
        ok: false,
        service: 'BugRoom health',
        status: 'misconfigured',
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

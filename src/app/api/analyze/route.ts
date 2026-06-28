import { callCerebrasAnalysis } from '@/lib/cerebras';
import { getCerebrasConfig } from '@/lib/env';
import { isProbablyTooLargeDataUri, isSupportedImageDataUri } from '@/lib/image';
import { buildIncidentReport } from '@/lib/report';
import type { AnalysisRequest, AnalysisResult } from '@/lib/types';

export async function GET() {
  return Response.json({
    ok: true,
    service: 'BugRoom analysis API',
    model: process.env.CEREBRAS_MODEL ?? 'gemma-4-31b',
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<AnalysisRequest>;

    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (body.imageDataUri) {
      if (!isSupportedImageDataUri(body.imageDataUri)) {
        return Response.json(
          { error: 'imageDataUri must be a base64 PNG, JPEG, or WebP data URI. Hosted image URLs are not supported by this hackathon API.' },
          { status: 400 },
        );
      }
      if (isProbablyTooLargeDataUri(body.imageDataUri)) {
        return Response.json(
          { error: 'Image is too large for a reliable demo request. Use a smaller screenshot or compress it first.' },
          { status: 413 },
        );
      }
    }

    const config = getCerebrasConfig();
    const analysis = await callCerebrasAnalysis({
      ...config,
      prompt: body.prompt.trim(),
      imageDataUri: body.imageDataUri,
    });

    const result: AnalysisResult = {
      ...analysis,
      reportMarkdown: buildIncidentReport(analysis),
    };

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';
    return Response.json({ error: message }, { status: 500 });
  }
}

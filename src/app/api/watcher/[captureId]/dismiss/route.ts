import { dismissWatcherCapture } from '@/lib/watcher-actions';

export async function POST(_: Request, context: { params: Promise<{ captureId: string }> }) {
  try {
    const { captureId } = await context.params;
    const capture = dismissWatcherCapture(captureId);
    return Response.json({ ok: true, capture });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not dismiss capture';
    return Response.json({ error: message }, { status: 400 });
  }
}

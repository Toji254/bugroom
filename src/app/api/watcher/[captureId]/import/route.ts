import { importWatcherCapture } from '@/lib/watcher-actions';

export async function POST(_: Request, context: { params: Promise<{ captureId: string }> }) {
  try {
    const { captureId } = await context.params;
    const imported = importWatcherCapture(captureId);
    return Response.json(imported);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not import capture';
    return Response.json({ error: message }, { status: 400 });
  }
}

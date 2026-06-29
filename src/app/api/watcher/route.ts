import { getWatcherMeta, listWatcherCaptures } from '@/lib/watcher-store';

export async function GET() {
  return Response.json({
    ok: true,
    watcher: getWatcherMeta(),
    captures: listWatcherCaptures(),
  });
}

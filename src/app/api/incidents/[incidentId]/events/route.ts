import { getIncident, subscribeToIncident } from '@/lib/swarm-store';

export async function GET(_: Request, context: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await context.params;
  const incident = getIncident(incidentId);

  if (!incident) {
    return new Response('Incident not found', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(incident)}\n\n`));

      const unsubscribe = subscribeToIncident(incidentId, (nextIncident) => {
        controller.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(nextIncident)}\n\n`));
      });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 15000);

      if (!unsubscribe) {
        clearInterval(keepAlive);
        controller.close();
        return;
      }

      return () => {
        clearInterval(keepAlive);
        unsubscribe();
      };
    },
    cancel() {
      // noop, cleanup handled in start return when supported by runtime
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

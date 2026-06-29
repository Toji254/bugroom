import { getIncident } from '@/lib/swarm-store';

export async function GET(_: Request, context: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await context.params;
  const incident = getIncident(incidentId);
  if (!incident) {
    return Response.json({ error: 'Incident not found' }, { status: 404 });
  }
  return Response.json({ incident });
}

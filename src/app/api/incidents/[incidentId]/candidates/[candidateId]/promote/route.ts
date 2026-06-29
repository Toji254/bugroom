import { appendEvent, getIncident, promotePlaybookCandidate } from '@/lib/swarm-store';
import type { SwarmEvent } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function POST(_: Request, context: { params: Promise<{ incidentId: string; candidateId: string }> }) {
  const { incidentId, candidateId } = await context.params;
  const incident = promotePlaybookCandidate(incidentId, candidateId);
  if (!incident) {
    return Response.json({ error: 'Candidate not found' }, { status: 404 });
  }

  const event: SwarmEvent = {
    id: randomUUID(),
    incidentId,
    type: 'candidate_promoted',
    title: 'Playbook promoted',
    message: 'A subagent artifact graduated into the room’s reusable tactics library.',
    level: 'success',
    createdAt: new Date().toISOString(),
  };
  appendEvent(incidentId, event);

  return Response.json({ incident: getIncident(incidentId) });
}

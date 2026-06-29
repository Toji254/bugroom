import { randomUUID } from 'crypto';
import { isProbablyTooLargeDataUri, isSupportedImageDataUri } from '@/lib/image';
import { launchIncidentOrchestration } from '@/lib/swarm-orchestrator';
import { getIncident, saveIncident } from '@/lib/swarm-store';
import { DEFAULT_INCIDENT_SETTINGS, type CreateIncidentRequest, type Incident } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<CreateIncidentRequest>;

    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }
    if (!body.imageDataUri || typeof body.imageDataUri !== 'string') {
      return Response.json({ error: 'imageDataUri is required for incident orchestration' }, { status: 400 });
    }
    if (!isSupportedImageDataUri(body.imageDataUri)) {
      return Response.json(
        { error: 'imageDataUri must be a base64 PNG, JPEG, or WebP data URI.' },
        { status: 400 },
      );
    }
    if (isProbablyTooLargeDataUri(body.imageDataUri)) {
      return Response.json(
        { error: 'Image is too large for a reliable demo request. Use a smaller screenshot or compress it first.' },
        { status: 413 },
      );
    }

    const incident: Incident = {
      id: randomUUID(),
      prompt: body.prompt.trim(),
      imageDataUri: body.imageDataUri,
      screenshotLabel: body.screenshotLabel?.trim() || 'Live screenshot',
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        ...DEFAULT_INCIDENT_SETTINGS,
        ...body.settings,
      },
      runs: [],
      events: [],
      playbookCandidates: [],
      appliedPlaybooks: [],
      result: null,
      error: null,
    };

    saveIncident(incident);
    launchIncidentOrchestration(incident.id);

    return Response.json({ incident: getIncident(incident.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create incident';
    return Response.json({ error: message }, { status: 500 });
  }
}

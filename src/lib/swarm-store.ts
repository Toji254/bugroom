import { EventEmitter } from 'events';
import type { Incident, IncidentStatus, AgentRun, SwarmEvent, PlaybookCandidate, PromotedPlaybook } from './types';

type IncidentRecord = Incident & {
  emitter: EventEmitter;
  runner?: Promise<void>;
};

type SwarmStore = {
  incidents: Map<string, IncidentRecord>;
  promotedPlaybooks: PromotedPlaybook[];
};

declare global {
  var __bugroomSwarmStore: SwarmStore | undefined;
}

const store = globalThis.__bugroomSwarmStore ?? {
  incidents: new Map<string, IncidentRecord>(),
  promotedPlaybooks: [],
};

globalThis.__bugroomSwarmStore = store;

function toPublicIncident(record: IncidentRecord): Incident {
  return {
    id: record.id,
    prompt: record.prompt,
    imageDataUri: record.imageDataUri,
    screenshotLabel: record.screenshotLabel,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    settings: record.settings,
    runs: [...record.runs],
    events: [...record.events],
    playbookCandidates: [...record.playbookCandidates],
    appliedPlaybooks: [...record.appliedPlaybooks],
    result: record.result,
    error: record.error,
  };
}

function broadcast(record: IncidentRecord) {
  record.updatedAt = new Date().toISOString();
  record.emitter.emit('snapshot', toPublicIncident(record));
}

export function saveIncident(incident: Incident) {
  const existing = store.incidents.get(incident.id);
  const record: IncidentRecord = {
    ...incident,
    emitter: existing?.emitter ?? new EventEmitter(),
    runner: existing?.runner,
  };
  store.incidents.set(incident.id, record);
  broadcast(record);
  return toPublicIncident(record);
}

export function getIncident(incidentId: string) {
  const incident = store.incidents.get(incidentId);
  return incident ? toPublicIncident(incident) : null;
}

export function getIncidentRecord(incidentId: string) {
  return store.incidents.get(incidentId) ?? null;
}

export function subscribeToIncident(incidentId: string, listener: (incident: Incident) => void) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  const handler = (incident: Incident) => listener(incident);
  record.emitter.on('snapshot', handler);
  return () => record.emitter.off('snapshot', handler);
}

export function setIncidentRunner(incidentId: string, runner: Promise<void>) {
  const record = store.incidents.get(incidentId);
  if (!record) return;
  record.runner = runner;
}

export function updateIncidentStatus(incidentId: string, status: IncidentStatus, error: string | null = null) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  record.status = status;
  record.error = error;
  broadcast(record);
  return toPublicIncident(record);
}

export function appendEvent(incidentId: string, event: SwarmEvent) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  record.events = [...record.events, event];
  broadcast(record);
  return toPublicIncident(record);
}

export function addRun(incidentId: string, run: AgentRun) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  record.runs = [...record.runs, run];
  broadcast(record);
  return toPublicIncident(record);
}

export function updateRun(incidentId: string, runId: string, updates: Partial<AgentRun>) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  record.runs = record.runs.map((run) => (run.id === runId ? { ...run, ...updates } : run));
  broadcast(record);
  return toPublicIncident(record);
}

export function saveResult(incidentId: string, result: Incident['result']) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  record.result = result;
  broadcast(record);
  return toPublicIncident(record);
}

export function addPlaybookCandidate(incidentId: string, candidate: PlaybookCandidate) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  record.playbookCandidates = [...record.playbookCandidates, candidate];
  broadcast(record);
  return toPublicIncident(record);
}

export function promotePlaybookCandidate(incidentId: string, candidateId: string) {
  const record = store.incidents.get(incidentId);
  if (!record) return null;
  const candidate = record.playbookCandidates.find((item) => item.id === candidateId);
  if (!candidate) return null;

  if (!store.promotedPlaybooks.some((item) => item.id === candidate.id)) {
    store.promotedPlaybooks.push({
      id: candidate.id,
      title: candidate.title,
      summary: candidate.summary,
      content: candidate.content,
      sourceIncidentId: incidentId,
      sourceRunId: candidate.sourceRunId,
      sourceAgentId: candidate.sourceAgentId,
      promotedAt: new Date().toISOString(),
    });
  }

  record.playbookCandidates = record.playbookCandidates.map((item) =>
    item.id === candidateId ? { ...item, status: 'promoted' } : item,
  );
  record.appliedPlaybooks = [...store.promotedPlaybooks];
  broadcast(record);
  return toPublicIncident(record);
}

export function listPromotedPlaybooks() {
  return [...store.promotedPlaybooks];
}

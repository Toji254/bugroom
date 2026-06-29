export type AgentId = 'vision' | 'debug' | 'ux' | 'fix';
export type IncidentStatus = 'queued' | 'running' | 'completed' | 'failed';
export type AgentRunKind = 'primary' | 'subagent';
export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'integrated'
  | 'discarded'
  | 'failed';
export type PlaybookCandidateStatus = 'candidate' | 'promoted' | 'rejected';
export type SwarmAutonomy = 'observe' | 'analyze' | 'propose' | 'draft';

export type AgentDefinition = {
  id: AgentId;
  name: string;
  shortName: string;
  goal: string;
  icon: string;
  accentClassName: string;
};

export type AgentFinding = {
  agentId: AgentId;
  headline: string;
  details: string;
  confidence: number;
};

export type AnalysisRequest = {
  prompt: string;
  imageDataUri?: string;
  presetId?: string;
};

export type AnalysisResult = {
  summary: string;
  rootCause: string;
  nextSteps: string[];
  suggestedFix: string;
  confidence: number;
  agents: AgentFinding[];
  reportMarkdown: string;
  timing: {
    provider: 'cerebras';
    model: string;
    elapsedMs: number;
    timeToFirstTokenMs?: number;
    outputTokensPerSecond?: number;
    totalTokens?: number;
  };
};

export type SwarmEventLevel = 'info' | 'success' | 'warning' | 'error';
export type SwarmEventType =
  | 'incident_created'
  | 'status_changed'
  | 'run_queued'
  | 'run_started'
  | 'run_completed'
  | 'run_failed'
  | 'subagent_spawned'
  | 'subagent_integrated'
  | 'subagent_discarded'
  | 'candidate_created'
  | 'candidate_promoted'
  | 'consensus_locked';

export type SwarmEvent = {
  id: string;
  incidentId: string;
  runId?: string;
  type: SwarmEventType;
  title: string;
  message: string;
  level: SwarmEventLevel;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  incidentId: string;
  parentRunId: string | null;
  agentId: string;
  displayName: string;
  shortName: string;
  kind: AgentRunKind;
  specialty: string;
  status: AgentRunStatus;
  goal: string;
  headline?: string;
  summary?: string;
  confidence?: number;
  artifactTitle?: string;
  artifactBody?: string;
  decision?: 'integrated' | 'discarded';
  timing?: {
    elapsedMs: number;
    timeToFirstTokenMs?: number;
    outputTokensPerSecond?: number;
    totalTokens?: number;
  };
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
};

export type PlaybookCandidate = {
  id: string;
  incidentId: string;
  sourceRunId: string;
  sourceAgentId: string;
  title: string;
  summary: string;
  content: string;
  status: PlaybookCandidateStatus;
  createdAt: string;
};

export type PromotedPlaybook = {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceIncidentId: string;
  sourceRunId: string;
  sourceAgentId: string;
  promotedAt: string;
};

export type IncidentSettings = {
  allowSubagents: boolean;
  autonomy: SwarmAutonomy;
  maxSubagentsPerPrimary: number;
};

export type Incident = {
  id: string;
  prompt: string;
  imageDataUri?: string;
  screenshotLabel: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  settings: IncidentSettings;
  runs: AgentRun[];
  events: SwarmEvent[];
  playbookCandidates: PlaybookCandidate[];
  appliedPlaybooks: PromotedPlaybook[];
  result: AnalysisResult | null;
  error: string | null;
};

export type CreateIncidentRequest = {
  prompt: string;
  imageDataUri: string;
  screenshotLabel?: string;
  settings?: Partial<IncidentSettings>;
};

export type CreateIncidentResponse = {
  incident: Incident;
};

export type WatcherCaptureStatus = 'pending' | 'imported' | 'opened' | 'dismissed';

export type WatcherCapture = {
  id: string;
  filePath: string;
  fileName: string;
  detectedAt: string;
  modifiedAt: string;
  sizeBytes: number;
  status: WatcherCaptureStatus;
  source: 'watcher';
  importedAt?: string;
  openedAt?: string;
  dismissedAt?: string;
};

export type WatcherInbox = {
  watchDir: string;
  captures: WatcherCapture[];
  updatedAt: string;
  startedAt: string;
};

export const DEFAULT_INCIDENT_SETTINGS: IncidentSettings = {
  allowSubagents: true,
  autonomy: 'draft',
  maxSubagentsPerPrimary: 1,
};

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'vision',
    name: 'UI Analyzer',
    shortName: 'UI Analyzer',
    goal: 'Visual Structure & Layout Division: Specialist in DOM tree analysis, CSS cascade inspection, render layer detection.',
    icon: '👁️',
    accentClassName: 'text-[#1EF7C1]',
  },
  {
    id: 'debug',
    name: 'Log Parser',
    shortName: 'Log Parser',
    goal: 'Error Trace & Log Analysis Division: Specialist in Stack trace decoding, error pattern matching, log correlation.',
    icon: '🕵️',
    accentClassName: 'text-[#E88D39]',
  },
  {
    id: 'ux',
    name: 'State Inspector',
    shortName: 'State Inspector',
    goal: 'Data Flow & State Investigation Division: Specialist in Component state audit, prop drilling detection, store consistency checks.',
    icon: '🎨',
    accentClassName: 'text-[#2DD4BF]',
  },
  {
    id: 'fix',
    name: 'Network Probe',
    shortName: 'Network Probe',
    goal: 'Coordinate the room, settle disagreements, choose the best next action, and lock the final incident response (API & Network Diagnostics Specialist).',
    icon: '🛠️',
    accentClassName: 'text-white',
  },
];

export function getPrimaryAgents() {
  return AGENT_DEFINITIONS;
}

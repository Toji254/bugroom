import { randomUUID } from 'crypto';
import { callCerebrasAnalysis, callCerebrasJson, type CerebrasTiming } from './cerebras';
import { getCerebrasConfig } from './env';
import { buildIncidentReport } from './report';
import { FIX_CAPTAIN_RESPONSE_SCHEMA, PRIMARY_AGENT_RESPONSE_SCHEMA, SUBAGENT_RESPONSE_SCHEMA } from './swarm-schema';
import {
  addPlaybookCandidate,
  addRun,
  appendEvent,
  getIncidentRecord,
  listPromotedPlaybooks,
  saveResult,
  setIncidentRunner,
  updateIncidentStatus,
  updateRun,
} from './swarm-store';
import {
  AGENT_DEFINITIONS,
  type AgentDefinition,
  type AgentFinding,
  type AgentRun,
  type AnalysisResult,
  type Incident,
  type PlaybookCandidate,
  type SwarmEvent,
} from './types';

type PrimaryAgentResponse = {
  headline: string;
  details: string;
  confidence: number;
  evidence: string[];
  recommendation: string;
  subagent: {
    spawn: boolean;
    name: string;
    specialty: string;
    goal: string;
    reason: string;
  };
};

type FixCaptainResponse = {
  headline: string;
  details: string;
  confidence: number;
  finalSummary: string;
  rootCause: string;
  nextSteps: string[];
  suggestedFix: string;
  recommendation: string;
  subagent: {
    spawn: boolean;
    name: string;
    specialty: string;
    goal: string;
    reason: string;
  };
};

type SubagentResponse = {
  headline: string;
  details: string;
  confidence: number;
  artifactTitle: string;
  artifactBody: string;
  decision: 'integrate' | 'discard';
  reason: string;
};

type CompletedRunContext = {
  run: AgentRun;
  finding: AgentFinding;
  evidence: string[];
  recommendation: string;
  timing: CerebrasTiming;
  integrationNotes: string[];
};

export function launchIncidentOrchestration(incidentId: string) {
  const existing = getIncidentRecord(incidentId);
  if (!existing || existing.runner) return;
  const runner = runIncident(incidentId);
  setIncidentRunner(incidentId, runner);
}

async function runIncident(incidentId: string) {
  const record = getIncidentRecord(incidentId);
  if (!record) return;

  const config = getCerebrasConfig();
  const startedAt = Date.now();

  try {
    updateIncidentStatus(incidentId, 'running');
    emitEvent(incidentId, {
      type: 'status_changed',
      title: 'Swarm mobilized',
      message: 'The room is hot. Primary agents are taking their stations around the incident board.',
      level: 'info',
    });

    const primaryRuns = AGENT_DEFINITIONS.map((agent) => createRun(incidentId, agent));
    primaryRuns.forEach((run) => {
      addRun(incidentId, run);
      emitEvent(incidentId, {
        runId: run.id,
        type: 'run_queued',
        title: `${run.displayName} queued`,
        message: `${run.displayName} accepted the brief and is waiting for its turn on the board.`,
        level: 'info',
      });
    });

    const primaryContexts = await Promise.all(
      primaryRuns
        .filter((run) => run.agentId !== 'fix')
        .map((run) => executePrimaryAgent({ incidentId, run, config, priorSummaries: [] })),
    );

    const fixRun = primaryRuns.find((run) => run.agentId === 'fix');
    if (!fixRun) {
      throw new Error('Fix Captain run was not created');
    }

    const fixContext = await executeFixCaptain({
      incidentId,
      run: fixRun,
      config,
      priorContexts: primaryContexts,
    });

    const allContexts = [...primaryContexts, fixContext];
    const elapsedMs = Date.now() - startedAt;

    const aggregateTiming = summarizeTiming(allContexts.map((item) => item.timing), config.model, elapsedMs);
    const result: AnalysisResult = {
      summary: fixContext.run.summary ?? fixContext.finding.headline,
      rootCause: fixContext.integrationNotes[0] ?? fixContext.finding.details,
      nextSteps: extractNextSteps(fixContext),
      suggestedFix: fixContext.integrationNotes[1] ?? fixContext.recommendation,
      confidence: clampConfidence(
        allContexts.reduce((total, item) => total + (item.finding.confidence || 0), 0) / allContexts.length,
      ),
      agents: allContexts.map((item) => item.finding),
      reportMarkdown: '',
      timing: aggregateTiming,
    };

    result.reportMarkdown = buildIncidentReport(result);
    saveResult(incidentId, result);
    updateIncidentStatus(incidentId, 'completed');
    emitEvent(incidentId, {
      type: 'consensus_locked',
      title: 'Consensus locked',
      message: 'Fix Captain merged the room output into a final response package.',
      level: 'success',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown swarm failure';
    updateIncidentStatus(incidentId, 'failed', message);
    emitEvent(incidentId, {
      type: 'run_failed',
      title: 'Swarm failure',
      message,
      level: 'error',
    });
  }
}

async function executePrimaryAgent({
  incidentId,
  run,
  config,
  priorSummaries,
}: {
  incidentId: string;
  run: AgentRun;
  config: ReturnType<typeof getCerebrasConfig>;
  priorSummaries: string[];
}): Promise<CompletedRunContext> {
  const incident = requireIncident(incidentId);
  updateRun(incidentId, run.id, { status: 'running', startedAt: new Date().toISOString() });
  emitEvent(incidentId, {
    runId: run.id,
    type: 'run_started',
    title: `${run.displayName} on console`,
    message: `${run.displayName} is reviewing the screenshot and operator brief${priorSummaries.length ? ' with room context in hand' : ''}.`,
    level: 'info',
  });

  const playbookContext = formatPlaybookContext();
  const systemPrompt = [
    `You are ${run.displayName} inside BugRoom, a small incident-response organization.`,
    'You are one real seat in the room, not one section of a fake combined answer.',
    'Work independently, but produce a concise summary that another agent can build on.',
    'If a specialist subagent would help, propose exactly one.',
    playbookContext,
  ].join('\n');

  const userPrompt = [
    `Operator brief: ${incident.prompt}`,
    `Your mission: ${run.goal}`,
    priorSummaries.length ? `Existing room notes:\n- ${priorSummaries.join('\n- ')}` : 'Existing room notes: none yet.',
    'Return grounded evidence from the screenshot, not generic advice.',
  ].join('\n\n');

  const { parsed, timing } = await callCerebrasJson<PrimaryAgentResponse>({
    ...config,
    systemPrompt,
    userPrompt,
    imageDataUri: incident.imageDataUri,
    schemaName: `${run.agentId}_primary_agent`,
    schema: PRIMARY_AGENT_RESPONSE_SCHEMA,
  });

  const finding: AgentFinding = {
    agentId: run.agentId as AgentFinding['agentId'],
    headline: parsed.headline,
    details: parsed.details,
    confidence: clampConfidence(parsed.confidence),
  };

  updateRun(incidentId, run.id, {
    status: 'completed',
    startedAt: run.startedAt ?? new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    headline: parsed.headline,
    summary: parsed.details,
    confidence: finding.confidence,
    artifactTitle: parsed.evidence[0] ?? parsed.recommendation,
    artifactBody: parsed.evidence.join('\n• '),
    timing: {
      elapsedMs: timing.elapsedMs,
      timeToFirstTokenMs: timing.timeToFirstTokenMs,
      outputTokensPerSecond: timing.outputTokensPerSecond,
      totalTokens: timing.totalTokens,
    },
  });
  emitEvent(incidentId, {
    runId: run.id,
    type: 'run_completed',
    title: `${run.displayName} reported in`,
    message: `${parsed.headline} — ${parsed.recommendation}`,
    level: 'success',
  });

  const integrationNotes: string[] = [];
  const shouldSpawn = incident.settings.allowSubagents && parsed.subagent.spawn;
  if (shouldSpawn) {
    const subagentNote = await executeSubagent({
      incidentId,
      parentRun: { ...run, headline: parsed.headline, summary: parsed.details, confidence: finding.confidence },
      suggestion: parsed.subagent,
      parentFinding: finding,
      config,
    });
    if (subagentNote) integrationNotes.push(subagentNote);
  }

  return {
    run: { ...run, headline: parsed.headline, summary: parsed.details, confidence: finding.confidence },
    finding,
    evidence: parsed.evidence,
    recommendation: parsed.recommendation,
    timing,
    integrationNotes,
  };
}

async function executeFixCaptain({
  incidentId,
  run,
  config,
  priorContexts,
}: {
  incidentId: string;
  run: AgentRun;
  config: ReturnType<typeof getCerebrasConfig>;
  priorContexts: CompletedRunContext[];
}): Promise<CompletedRunContext> {
  const incident = requireIncident(incidentId);
  updateRun(incidentId, run.id, { status: 'running', startedAt: new Date().toISOString() });
  emitEvent(incidentId, {
    runId: run.id,
    type: 'run_started',
    title: 'Fix Captain convening',
    message: 'Fix Captain is comparing the room notes, resolving disagreements, and building the final action plan.',
    level: 'info',
  });

  const playbookContext = formatPlaybookContext();
  const roomSummary = priorContexts
    .map((context) => `${context.finding.agentId.toUpperCase()}: ${context.finding.headline}\n${context.finding.details}\nRecommendation: ${context.recommendation}${context.integrationNotes.length ? `\nSubagents: ${context.integrationNotes.join(' | ')}` : ''}`)
    .join('\n\n');

  const { parsed, timing } = await callCerebrasJson<FixCaptainResponse>({
    ...config,
    imageDataUri: incident.imageDataUri,
    schemaName: 'fix_captain_final',
    schema: FIX_CAPTAIN_RESPONSE_SCHEMA,
    systemPrompt: [
      'You are Fix Captain inside BugRoom, the lead of a small incident-response organization.',
      'You must coordinate the room and produce the final operator-facing package.',
      'Be decisive, reconcile disagreements, and choose exact next actions.',
      playbookContext,
    ].join('\n'),
    userPrompt: [
      `Operator brief: ${incident.prompt}`,
      'Room notes:',
      roomSummary,
      `Autonomy level: ${incident.settings.autonomy}`,
      'Return the final summary, root cause, next steps, suggested fix, and whether a final specialist subagent should be spawned.',
    ].join('\n\n'),
  });

  const finding: AgentFinding = {
    agentId: 'fix',
    headline: parsed.headline,
    details: parsed.details,
    confidence: clampConfidence(parsed.confidence),
  };

  updateRun(incidentId, run.id, {
    status: 'completed',
    finishedAt: new Date().toISOString(),
    headline: parsed.headline,
    summary: parsed.finalSummary,
    confidence: finding.confidence,
    artifactTitle: 'Consensus package',
    artifactBody: parsed.suggestedFix,
    timing: {
      elapsedMs: timing.elapsedMs,
      timeToFirstTokenMs: timing.timeToFirstTokenMs,
      outputTokensPerSecond: timing.outputTokensPerSecond,
      totalTokens: timing.totalTokens,
    },
  });
  emitEvent(incidentId, {
    runId: run.id,
    type: 'run_completed',
    title: 'Fix Captain draft ready',
    message: parsed.finalSummary,
    level: 'success',
  });

  const integrationNotes = [parsed.rootCause, parsed.suggestedFix];

  if (incident.settings.allowSubagents && parsed.subagent.spawn) {
    const subagentNote = await executeSubagent({
      incidentId,
      parentRun: { ...run, headline: parsed.headline, summary: parsed.finalSummary, confidence: finding.confidence },
      suggestion: parsed.subagent,
      parentFinding: finding,
      config,
    });
    if (subagentNote) {
      integrationNotes[1] = `${parsed.suggestedFix}\n\nSubagent addendum: ${subagentNote}`;
    }
  }

  return {
    run: { ...run, headline: parsed.headline, summary: parsed.finalSummary, confidence: finding.confidence },
    finding,
    evidence: [parsed.rootCause, ...parsed.nextSteps],
    recommendation: parsed.suggestedFix,
    timing,
    integrationNotes,
  };
}

async function executeSubagent({
  incidentId,
  parentRun,
  suggestion,
  parentFinding,
  config,
}: {
  incidentId: string;
  parentRun: AgentRun;
  suggestion: PrimaryAgentResponse['subagent'] | FixCaptainResponse['subagent'];
  parentFinding: AgentFinding;
  config: ReturnType<typeof getCerebrasConfig>;
}) {
  const incident = requireIncident(incidentId);
  const subagentRun: AgentRun = {
    id: randomUUID(),
    incidentId,
    parentRunId: parentRun.id,
    agentId: `${parentRun.agentId}:${slugify(suggestion.specialty)}`,
    displayName: suggestion.name,
    shortName: suggestion.name,
    kind: 'subagent',
    specialty: suggestion.specialty,
    status: 'queued',
    goal: suggestion.goal,
    createdAt: new Date().toISOString(),
  };

  addRun(incidentId, subagentRun);
  emitEvent(incidentId, {
    runId: subagentRun.id,
    type: 'subagent_spawned',
    title: `${suggestion.name} spawned`,
    message: `${parentRun.displayName} delegated a narrow task: ${suggestion.reason}`,
    level: 'warning',
  });
  updateRun(incidentId, subagentRun.id, { status: 'running', startedAt: new Date().toISOString() });

  const playbookContext = formatPlaybookContext();
  const { parsed, timing } = await callCerebrasJson<SubagentResponse>({
    ...config,
    imageDataUri: incident.imageDataUri,
    schemaName: `${slugify(suggestion.name)}_subagent`,
    schema: SUBAGENT_RESPONSE_SCHEMA,
    systemPrompt: [
      `You are ${suggestion.name}, a specialist subagent inside BugRoom.`,
      'Produce one narrow artifact for the parent agent and explicitly recommend integrate or discard.',
      playbookContext,
    ].join('\n'),
    userPrompt: [
      `Operator brief: ${incident.prompt}`,
      `Parent agent: ${parentRun.displayName}`,
      `Parent finding: ${parentFinding.headline}`,
      `Parent detail: ${parentFinding.details}`,
      `Specialty: ${suggestion.specialty}`,
      `Goal: ${suggestion.goal}`,
      'Return a compact artifact with specific evidence or an execution-ready recommendation.',
    ].join('\n\n'),
  });

  const integrated = parsed.decision === 'integrate' && parsed.confidence >= 0.62;
  const status = integrated ? 'integrated' : 'discarded';
  updateRun(incidentId, subagentRun.id, {
    status,
    finishedAt: new Date().toISOString(),
    headline: parsed.headline,
    summary: parsed.details,
    confidence: clampConfidence(parsed.confidence),
    artifactTitle: parsed.artifactTitle,
    artifactBody: parsed.artifactBody,
    decision: integrated ? 'integrated' : 'discarded',
    timing: {
      elapsedMs: timing.elapsedMs,
      timeToFirstTokenMs: timing.timeToFirstTokenMs,
      outputTokensPerSecond: timing.outputTokensPerSecond,
      totalTokens: timing.totalTokens,
    },
  });

  emitEvent(incidentId, {
    runId: subagentRun.id,
    type: integrated ? 'subagent_integrated' : 'subagent_discarded',
    title: integrated ? `${suggestion.name} integrated` : `${suggestion.name} discarded`,
    message: integrated ? parsed.reason : `Filed to the archive: ${parsed.reason}`,
    level: integrated ? 'success' : 'warning',
  });

  if (integrated) {
    const candidate: PlaybookCandidate = {
      id: randomUUID(),
      incidentId,
      sourceRunId: subagentRun.id,
      sourceAgentId: parentRun.agentId,
      title: `${parentRun.displayName} / ${parsed.artifactTitle}`,
      summary: parsed.headline,
      content: parsed.artifactBody,
      status: 'candidate',
      createdAt: new Date().toISOString(),
    };
    addPlaybookCandidate(incidentId, candidate);
    emitEvent(incidentId, {
      runId: subagentRun.id,
      type: 'candidate_created',
      title: 'Playbook candidate captured',
      message: `${candidate.title} can be promoted into the room's reusable tactics library.`,
      level: 'info',
    });
    return `${parsed.artifactTitle}: ${parsed.artifactBody}`;
  }

  return null;
}

export async function runSynchronousAnalysis(input: {
  prompt: string;
  imageDataUri?: string;
}): Promise<Omit<AnalysisResult, 'reportMarkdown'> & { reportMarkdown: string }> {
  const config = getCerebrasConfig();
  const analysis = await callCerebrasAnalysis({
    ...config,
    prompt: input.prompt,
    imageDataUri: input.imageDataUri,
  });
  return {
    ...analysis,
    reportMarkdown: buildIncidentReport(analysis),
  };
}

function createRun(incidentId: string, agent: AgentDefinition): AgentRun {
  return {
    id: randomUUID(),
    incidentId,
    parentRunId: null,
    agentId: agent.id,
    displayName: agent.name,
    shortName: agent.shortName,
    kind: 'primary',
    specialty: agent.shortName,
    status: 'queued',
    goal: agent.goal,
    createdAt: new Date().toISOString(),
  };
}

function summarizeTiming(timings: CerebrasTiming[], model: string, elapsedMs: number): AnalysisResult['timing'] {
  const totalTokens = timings.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0);
  const avgTps = timings.filter((item) => item.outputTokensPerSecond).length
    ? timings.reduce((sum, item) => sum + (item.outputTokensPerSecond ?? 0), 0) / timings.filter((item) => item.outputTokensPerSecond).length
    : undefined;
  return {
    provider: 'cerebras',
    model,
    elapsedMs,
    timeToFirstTokenMs: Math.min(...timings.map((item) => item.timeToFirstTokenMs ?? item.elapsedMs)),
    outputTokensPerSecond: avgTps,
    totalTokens: totalTokens || undefined,
  };
}

function extractNextSteps(context: CompletedRunContext) {
  const nextSteps = context.evidence.slice(1, 5).filter(Boolean);
  if (nextSteps.length) return nextSteps;
  return [
    'Validate the suspected root cause against the live screenshot.',
    'Apply the suggested fix in the smallest safe increment.',
    'Re-run the failing workflow and confirm the incident is cleared.',
  ];
}

function emitEvent(incidentId: string, input: Omit<SwarmEvent, 'id' | 'incidentId' | 'createdAt'>) {
  appendEvent(incidentId, {
    id: randomUUID(),
    incidentId,
    createdAt: new Date().toISOString(),
    ...input,
  });
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function requireIncident(incidentId: string): Incident {
  const incident = getIncidentRecord(incidentId);
  if (!incident) throw new Error(`Incident ${incidentId} not found`);
  return incident;
}

function formatPlaybookContext() {
  const playbooks = listPromotedPlaybooks();
  if (!playbooks.length) return 'Promoted room playbooks: none yet.';
  return `Promoted room playbooks:\n${playbooks.map((playbook) => `- ${playbook.title}: ${playbook.summary}\n  ${playbook.content}`).join('\n')}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export type AgentId = 'vision' | 'debug' | 'ux' | 'fix';

export type AgentDefinition = {
  id: AgentId;
  name: string;
  shortName: string;
  goal: string;
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

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'vision',
    name: 'Vision Agent',
    shortName: 'Vision',
    goal: 'Read the screenshot carefully, identify visible errors, UI elements, charts, text, and suspicious context.',
  },
  {
    id: 'debug',
    name: 'Code Detective',
    shortName: 'Debug',
    goal: 'Infer the most likely technical cause and separate root causes from distracting symptoms.',
  },
  {
    id: 'ux',
    name: 'UX Reviewer',
    shortName: 'UX',
    goal: 'Explain user-facing impact, design issues, accessibility problems, and clarity gaps visible on screen.',
  },
  {
    id: 'fix',
    name: 'Fix Captain',
    shortName: 'Fix',
    goal: 'Resolve disagreements, choose the fastest next action, and produce the final concise fix plan.',
  },
];

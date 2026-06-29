export const PRIMARY_AGENT_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'details', 'confidence', 'evidence', 'recommendation', 'subagent'],
  properties: {
    headline: { type: 'string' },
    details: { type: 'string' },
    confidence: { type: 'number' },
    evidence: {
      type: 'array',
      items: { type: 'string' },
    },
    recommendation: { type: 'string' },
    subagent: {
      type: 'object',
      additionalProperties: false,
      required: ['spawn', 'name', 'specialty', 'goal', 'reason'],
      properties: {
        spawn: { type: 'boolean' },
        name: { type: 'string' },
        specialty: { type: 'string' },
        goal: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  },
} as const;

export const FIX_CAPTAIN_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'details', 'confidence', 'finalSummary', 'rootCause', 'nextSteps', 'suggestedFix', 'recommendation', 'subagent'],
  properties: {
    headline: { type: 'string' },
    details: { type: 'string' },
    confidence: { type: 'number' },
    finalSummary: { type: 'string' },
    rootCause: { type: 'string' },
    nextSteps: {
      type: 'array',
      items: { type: 'string' },
    },
    suggestedFix: { type: 'string' },
    recommendation: { type: 'string' },
    subagent: {
      type: 'object',
      additionalProperties: false,
      required: ['spawn', 'name', 'specialty', 'goal', 'reason'],
      properties: {
        spawn: { type: 'boolean' },
        name: { type: 'string' },
        specialty: { type: 'string' },
        goal: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  },
} as const;

export const SUBAGENT_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['headline', 'details', 'confidence', 'artifactTitle', 'artifactBody', 'decision', 'reason'],
  properties: {
    headline: { type: 'string' },
    details: { type: 'string' },
    confidence: { type: 'number' },
    artifactTitle: { type: 'string' },
    artifactBody: { type: 'string' },
    decision: {
      type: 'string',
      enum: ['integrate', 'discard'],
    },
    reason: { type: 'string' },
  },
} as const;

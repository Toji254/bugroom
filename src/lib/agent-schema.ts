export const BUGROOM_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'rootCause', 'nextSteps', 'suggestedFix', 'confidence', 'agents'],
  properties: {
    summary: { type: 'string' },
    rootCause: { type: 'string' },
    nextSteps: {
      type: 'array',
      items: { type: 'string' },
    },
    suggestedFix: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    agents: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['agentId', 'headline', 'details', 'confidence'],
        properties: {
          agentId: { type: 'string', enum: ['vision', 'debug', 'ux', 'fix'] },
          headline: { type: 'string' },
          details: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

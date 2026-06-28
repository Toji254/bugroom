import { BUGROOM_RESPONSE_SCHEMA } from './agent-schema';
import type { AnalysisResult } from './types';

export type BuildCerebrasRequestInput = {
  prompt: string;
  model: string;
  imageDataUri?: string;
};

export type CallCerebrasInput = {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  imageDataUri?: string;
  fetchImpl?: typeof fetch;
};

type CerebrasRawResponse = {
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  usage?: { total_tokens?: number };
  time_info?: {
    time_to_first_token?: number;
    total_time?: number;
    output_tokens_per_second?: number;
  };
};

export function buildCerebrasRequestBody(input: BuildCerebrasRequestInput) {
  const content = input.imageDataUri
    ? [
        { type: 'text', text: input.prompt },
        { type: 'image_url', image_url: { url: input.imageDataUri } },
      ]
    : input.prompt;

  return {
    model: input.model,
    reasoning_effort: 'low',
    messages: [
      {
        role: 'system',
        content: [
          'You are BugRoom, a real-time multi-agent incident room for software screens.',
          'Return only valid JSON matching the schema.',
          'Make the four agents visibly collaborate: Vision Agent, Code Detective, UX Reviewer, Fix Captain.',
          'Prioritize a fast practical next action over broad speculation.',
          'Never reveal hidden chain-of-thought; summarize disagreement and consensus only.',
        ].join(' '),
      },
      { role: 'user', content },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'bugroom_analysis',
        strict: true,
        schema: BUGROOM_RESPONSE_SCHEMA,
      },
    },
  };
}

export async function callCerebrasAnalysis(input: CallCerebrasInput): Promise<Omit<AnalysisResult, 'reportMarkdown'>> {
  const fetcher = input.fetchImpl ?? fetch;
  const started = Date.now();
  const response = await fetcher(`${input.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      buildCerebrasRequestBody({
        prompt: input.prompt,
        model: input.model,
        imageDataUri: input.imageDataUri,
      }),
    ),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown Cerebras API error');
    throw new Error(`Cerebras API failed: ${response.status} ${errorText.slice(0, 500)}`);
  }

  const raw = (await response.json()) as CerebrasRawResponse;
  const content = extractMessageContent(raw);
  const parsed = parseStructuredContent(content);
  const elapsedMs = Date.now() - started;

  return {
    ...parsed,
    timing: {
      provider: 'cerebras',
      model: input.model,
      elapsedMs,
      timeToFirstTokenMs: secondsToMs(raw.time_info?.time_to_first_token),
      outputTokensPerSecond: raw.time_info?.output_tokens_per_second,
      totalTokens: raw.usage?.total_tokens,
    },
  };
}

function extractMessageContent(raw: CerebrasRawResponse): string {
  const content = raw.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text ?? '').join('\n');
  }
  throw new Error('Cerebras response did not include message content');
}

function parseStructuredContent(content: string): Omit<AnalysisResult, 'reportMarkdown' | 'timing'> {
  const trimmed = content.trim();
  const jsonText = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
    : trimmed;
  const parsed = JSON.parse(jsonText);
  validateAnalysisShape(parsed);
  return parsed;
}

function validateAnalysisShape(value: unknown): asserts value is Omit<AnalysisResult, 'reportMarkdown' | 'timing'> {
  if (!value || typeof value !== 'object') throw new Error('Analysis result is not an object');
  const result = value as Partial<AnalysisResult>;
  if (!result.summary || !result.rootCause || !result.suggestedFix || !Array.isArray(result.nextSteps)) {
    throw new Error('Analysis result is missing required fields');
  }
  if (!Array.isArray(result.agents) || result.agents.length !== 4) {
    throw new Error('Analysis result must include four agent findings');
  }
}

function secondsToMs(value: unknown): number | undefined {
  return typeof value === 'number' ? Math.round(value * 1000) : undefined;
}

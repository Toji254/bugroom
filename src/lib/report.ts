import type { AnalysisResult } from './types';

export function buildIncidentReport(result: Omit<AnalysisResult, 'reportMarkdown'>): string {
  const speedLine = [
    `Provider: ${result.timing.provider}`,
    `Model: ${result.timing.model}`,
    `Elapsed: ${result.timing.elapsedMs}ms`,
    result.timing.timeToFirstTokenMs ? `TTFT: ${result.timing.timeToFirstTokenMs}ms` : undefined,
    result.timing.outputTokensPerSecond ? `Output speed: ${Math.round(result.timing.outputTokensPerSecond)} tokens/sec` : undefined,
    result.timing.totalTokens ? `Tokens: ${result.timing.totalTokens}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ');

  const agentSections = result.agents
    .map(
      (agent) =>
        `### ${agent.agentId}\n\n**${agent.headline}** (${Math.round(agent.confidence * 100)}% confidence)\n\n${agent.details}`,
    )
    .join('\n\n');

  return `# BugRoom Incident Report\n\n${speedLine}\n\n## Summary\n\n${result.summary}\n\n## Root Cause\n\n${result.rootCause}\n\n## Agent Findings\n\n${agentSections}\n\n## Suggested Fix\n\n\`\`\`text\n${result.suggestedFix}\n\`\`\`\n\n## Next Steps\n\n${result.nextSteps.map((step) => `- ${step}`).join('\n')}\n`;
}

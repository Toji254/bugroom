"use client";

import type { AnalysisResult } from '../lib/types';

interface ReportModalProps {
  result: AnalysisResult | null;
  question: string;
  onClose: () => void;
}

export default function ReportModal({ result, question, onClose }: ReportModalProps) {
  if (!result) return null;

  // Format timestamp (current time)
  const timestamp = new Date().toLocaleString();
  const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;

  const handleDownload = () => {
    const content = result.reportMarkdown || generateMarkdownReport(result, question, timestamp);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bugroom-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const content = result.reportMarkdown || generateMarkdownReport(result, question, timestamp);
    navigator.clipboard.writeText(content);
    alert('Report copied to clipboard!');
  };

  const totalTime = result.timing.elapsedMs;

  const agentIcons: Record<string, string> = {
    vision: '👁️',
    debug: '🕵️',
    ux: '🎨',
    fix: '🛠️',
  };

  const agentNames: Record<string, string> = {
    vision: 'Vision Agent',
    debug: 'Code Detective',
    ux: 'UX Reviewer',
    fix: 'Fix Captain',
  };

  const agentColors: Record<string, string> = {
    vision: '#1EF7C1',
    debug: '#E88D39',
    ux: '#2DD4BF',
    fix: '#FEFEFE',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: 'rgba(2, 2, 2, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative overflow-hidden w-full max-w-2xl my-8 transition-all duration-300"
        style={{
          borderRadius: 20,
          background: 'rgba(18, 24, 40, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 40px 80px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b"
          style={{
            padding: '20px 24px',
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(30, 247, 193, 0.1)',
                border: '1px solid rgba(30, 247, 193, 0.25)',
              }}
            >
              {/* FileText Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1EF7C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  fontFamily: "'GeistMono', monospace",
                  fontSize: 15,
                  fontWeight: 400,
                  color: '#FEFEFE',
                  letterSpacing: '-0.2px',
                }}
              >
                Incident Analysis Report
              </span>
              <span
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 10,
                  color: '#C1C1C1',
                  opacity: 0.5,
                }}
              >
                {timestamp}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center transition-all duration-300 gap-1.5 cursor-pointer text-xs"
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#C1C1C1',
                fontFamily: "'GeistMono', monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#FEFEFE';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#C1C1C1';
              }}
            >
              <span>Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center transition-all duration-300 gap-1.5 cursor-pointer text-xs"
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(30, 247, 193, 0.1)',
                border: '1px solid rgba(30, 247, 193, 0.25)',
                color: '#1EF7C1',
                fontFamily: "'GeistMono', monospace",
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 247, 193, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 247, 193, 0.1)';
              }}
            >
              {/* Download Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export MD</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all duration-300 cursor-pointer"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#C1C1C1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 50, 50, 0.4)';
                e.currentTarget.style.color = '#FF6432';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#C1C1C1';
              }}
            >
              {/* X Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{
            padding: '24px',
            maxHeight: '70vh',
          }}
        >
          {/* Metrics */}
          <div
            className="grid grid-cols-3 gap-3 mb-6"
            style={{
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1EF7C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#FEFEFE',
                }}
              >
                {totalTime < 1000 ? `${totalTime.toFixed(0)}ms` : `${(totalTime / 1000).toFixed(2)}s`}
              </span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#C1C1C1',
                  opacity: 0.5,
                }}
              >
                Response Time
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E88D39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#FEFEFE',
                }}
              >
                {result.agents.length}
              </span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#C1C1C1',
                  opacity: 0.5,
                }}
              >
                Active Agents
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#FEFEFE',
                }}
              >
                {formatConfidence(result.confidence)}
              </span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#C1C1C1',
                  opacity: 0.5,
                }}
              >
                Consensus
              </span>
            </div>
          </div>

          {/* Prompt Query */}
          <div className="mb-5">
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#C1C1C1',
                opacity: 0.5,
              }}
            >
              Operator Query
            </span>
            <p
              style={{
                fontFamily: "'GeistMono', monospace",
                fontSize: 13,
                color: '#FEFEFE',
                margin: '6px 0 0 0',
                lineHeight: 1.5,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {question}
            </p>
          </div>

          {/* Swarm Consensus */}
          <div
            className="mb-5"
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(30, 247, 193, 0.05)',
              border: '1px solid rgba(30, 247, 193, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#1EF7C1',
                opacity: 0.7,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Swarm Consensus Summary
            </span>
            <p
              style={{
                fontFamily: "'Source Code Pro', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: '#FEFEFE',
                margin: 0,
              }}
            >
              {result.summary}
            </p>
          </div>

          {/* Agent Findings */}
          <div className="mb-5">
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#C1C1C1',
                opacity: 0.5,
                display: 'block',
                marginBottom: 10,
              }}
            >
              Agent Swarm Findings
            </span>
            <div className="flex flex-col gap-2.5">
              {result.agents.map((agent) => (
                <div
                  key={agent.agentId}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${agentColors[agent.agentId] || '#FEFEFE'}25`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span style={{ fontSize: 12 }}>{agentIcons[agent.agentId] || '🤖'}</span>
                    <span
                      style={{
                        fontFamily: "'GeistMono', monospace",
                        fontSize: 11,
                        fontWeight: 400,
                        color: agentColors[agent.agentId] || '#FEFEFE',
                      }}
                    >
                      {agentNames[agent.agentId] || agent.agentId}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Source Code Pro', monospace",
                        fontSize: 9,
                        marginLeft: 'auto',
                        opacity: 0.5,
                        color: '#C1C1C1',
                      }}
                    >
                      Confidence: {formatConfidence(agent.confidence)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'GeistMono', monospace",
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#FEFEFE',
                      marginBottom: 4,
                    }}
                  >
                    {agent.headline}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Source Code Pro', monospace",
                      fontSize: 11,
                      lineHeight: 1.6,
                      color: '#C1C1C1',
                      margin: 0,
                    }}
                  >
                    {agent.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Root Cause */}
          <div className="mb-5">
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#E88D39',
                opacity: 0.7,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Root Cause Identification
            </span>
            <p
              style={{
                fontFamily: "'Source Code Pro', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: '#C1C1C1',
                margin: 0,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(232, 141, 57, 0.03)',
                border: '1px solid rgba(232, 141, 57, 0.1)',
              }}
            >
              {result.rootCause}
            </p>
          </div>

          {/* Suggested Fix */}
          <div className="mb-5">
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#1EF7C1',
                opacity: 0.7,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Recommended Resolution
            </span>
            <p
              style={{
                fontFamily: "'Source Code Pro', monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: '#FEFEFE',
                margin: 0,
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(30, 247, 193, 0.05)',
                border: '1px solid rgba(30, 247, 193, 0.15)',
              }}
            >
              {result.suggestedFix}
            </p>
          </div>

          {/* Next Steps */}
          {result.nextSteps && result.nextSteps.length > 0 && (
            <div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#C1C1C1',
                  opacity: 0.5,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Verification Steps
              </span>
              <ul
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: '#C1C1C1',
                  margin: 0,
                  paddingLeft: '20px',
                  listStyleType: 'decimal',
                }}
              >
                {result.nextSteps.map((step, idx) => (
                  <li key={idx} className="mb-1">{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateMarkdownReport(result: AnalysisResult, question: string, timestamp: string): string {
  const totalTime = result.timing.elapsedMs;
  const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;
  return `# BugRoom Swarm Incident Report

**Generated:** ${timestamp}  
**Response Time:** ${totalTime < 1000 ? `${totalTime.toFixed(0)}ms` : `${(totalTime / 1000).toFixed(2)}s`}  
**Consensus Confidence:** ${formatConfidence(result.confidence)}  
**Powered by:** Gemma 4 on Cerebras

---

## Operator Query

> ${question}

## Swarm Consensus Summary

${result.summary}

## Root Cause Analysis

${result.rootCause}

## Recommended Resolution

\`\`\`
${result.suggestedFix}
\`\`\`

## Verification Steps

${result.nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Detailed Agent Swarm Findings

${result.agents.map((a) => `### ${a.agentId === 'vision' ? 'Vision Agent' : a.agentId === 'debug' ? 'Code Detective' : a.agentId === 'ux' ? 'UX Reviewer' : 'Fix Captain'} (${formatConfidence(a.confidence)} confidence)
**Headline:** ${a.headline}

${a.details}`).join('\n\n')}

---

*Report generated by BugRoom — Real-Time AI Incident Room*
`;
}

"use client";

import { useEffect, useRef } from 'react';
import type { AgentFinding } from '../lib/types';

type AgentStatus = "idle" | "thinking" | "complete" | "error";

interface AgentCardProps {
  name: string;
  agentId: string;
  status: AgentStatus;
  finding?: AgentFinding;
  index: number;
  isActive: boolean;
  onTypingComplete: () => void;
}

const AGENT_META: Record<string, { icon: string; role: string; color: string }> = {
  vision: { icon: "👁️", role: "OCR + UI Visual Context", color: "#1EF7C1" },
  debug: { icon: "🕵️", role: "Root-Cause Code Detective", color: "#E88D39" },
  ux: { icon: "🎨", role: "UX & Accessibility Audit", color: "#2DD4BF" },
  fix: { icon: "🛠️", role: "Fix Recommendations", color: "#FEFEFE" },
};

export default function AgentCard({
  name,
  agentId,
  status,
  finding,
  index,
  isActive,
  onTypingComplete,
}: AgentCardProps) {
  const meta = AGENT_META[agentId] || AGENT_META.vision;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (status !== 'complete') {
      completedRef.current = false;
      return () => undefined;
    }

    if (isActive && finding?.details && !completedRef.current) {
      const delay = Math.min(1600, Math.max(400, finding.details.length * 6));
      timeoutRef.current = setTimeout(() => {
        completedRef.current = true;
        onTypingComplete();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [finding?.details, isActive, onTypingComplete, status]);

  const getCardClasses = () => {
    let base = "relative overflow-hidden rounded-2xl glass p-4 transition-all duration-300 ";
    if (status === 'thinking') {
      base += agentId === 'debug' ? 'animate-biolum-amber ' : 'animate-biolum ';
    } else if (status === 'complete' && isActive) {
      base += 'border-cyan-500/40 glow-cyan ';
    }
    return base;
  };

  const getStatusLabel = () => {
    if (status === 'thinking') return 'ANALYZING';
    if (status === 'complete') return 'COMPLETE';
    if (status === 'error') return 'ERROR';
    return 'STANDBY';
  };

  const getStatusColor = () => {
    if (status === 'thinking') return '#E88D39';
    if (status === 'complete') return '#1EF7C1';
    if (status === 'error') return '#FF6432';
    return 'rgba(255,255,255,0.3)';
  };

  return (
    <article className={getCardClasses()} style={{ animationDelay: `${index * 0.15}s` }}>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/[0.015] to-transparent animate-pulse" style={{ zIndex: 1 }} />

      <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base"
            style={{
              borderColor: `${meta.color}35`,
              background: `${meta.color}08`,
              color: meta.color,
            }}
          >
            {meta.icon}
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'GeistMono', monospace",
                fontSize: 13,
                fontWeight: 400,
                color: '#FEFEFE',
                letterSpacing: '-0.2px',
              }}
            >
              {name}
            </h3>
            <p className="text-[10px]" style={{ color: '#C1C1C1', opacity: 0.5 }}>
              {meta.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/5 bg-white/[0.02]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${status === 'thinking' ? 'animate-pulse' : ''}`}
            style={{
              background: getStatusColor(),
              boxShadow: status === 'idle' ? 'none' : `0 0 6px ${getStatusColor()}`,
            }}
          />
          <span
            style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: 9,
              color: getStatusColor(),
              letterSpacing: '0.5px',
            }}
          >
            {getStatusLabel()}
          </span>
        </div>
      </div>

      <div className="relative z-10">
        {status === 'complete' && finding ? (
          <div className="space-y-2 mt-2">
            <div className="flex items-start justify-between gap-3">
              <p
                style={{
                  fontFamily: "'GeistMono', monospace",
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#FEFEFE',
                }}
              >
                {finding.headline}
              </p>
              <span
                style={{
                  fontFamily: "'Source Code Pro', monospace",
                  fontSize: 10,
                  color: '#1EF7C1',
                }}
              >
                {Math.round(finding.confidence * 100)}% conf
              </span>
            </div>
            <p
              className={isActive ? 'cursor-blink' : ''}
              style={{
                fontFamily: "'Source Code Pro', monospace",
                fontSize: 11,
                lineHeight: 1.6,
                color: '#C1C1C1',
              }}
            >
              {finding.details}
            </p>
          </div>
        ) : (
          <p
            className="text-[11px] leading-5"
            style={{
              fontFamily: "'Source Code Pro', monospace",
              color: '#C1C1C1',
              opacity: 0.5,
            }}
          >
            {status === 'thinking'
              ? 'Evaluating node telemetry and screen components...'
              : status === 'error'
                ? 'Telemetry node failed to establish connection.'
                : 'Swarm standby: awaiting diagnostic trigger.'}
          </p>
        )}
      </div>
    </article>
  );
}

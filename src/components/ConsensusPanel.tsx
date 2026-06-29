"use client";

import type { AnalysisResult, Incident } from '@/lib/types';

interface ConsensusPanelProps {
  incident: Incident | null;
  result: AnalysisResult | null;
  error: string | null;
  onOpenReport: () => void;
}

export default function ConsensusPanel({ incident, result, error, onOpenReport }: ConsensusPanelProps) {
  if (error) {
    return (
      <section className="rounded-[24px] border border-red-500/25 bg-red-500/[0.05] p-4 text-left">
        <h2 className="font-mono-technical text-xs font-semibold uppercase tracking-wider text-red-300 leading-normal py-0.5">Room failure</h2>
        <p className="mt-2 text-[11px] leading-6 text-red-200/80 font-mono-console">{error}</p>
      </section>
    );
  }

  if (!incident) {
    return (
      <section className="room-panel rounded-[24px] p-4 text-left text-[11px] font-mono-console text-white/45">
        The room is idle. Upload a screenshot and dispatch the organization.
      </section>
    );
  }

  if (!result) {
    return (
      <section className="room-panel rounded-[24px] p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-mono-technical text-xs font-semibold uppercase tracking-wider text-white leading-normal py-0.5">Consensus board</h2>
            <p className="mt-1 text-[10px] font-mono-console text-white/50">The organization is still working. Follow the timeline while Fix Captain gathers the final package.</p>
          </div>
          <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 font-mono-console text-[9px] uppercase tracking-wider text-orange-300">
            {incident.status}
          </span>
        </div>
        <div className="room-subpanel mt-4 rounded-2xl p-4">
          <p className="font-mono-console text-[11px] leading-6 text-white/65">
            Live incident: {incident.prompt}
          </p>
        </div>
      </section>
    );
  }

  // Parse out massive subagent plan from the dashboard preview
  const parseSuggestedFix = (text: string) => {
    const splitIndex = text.indexOf("Subagent addendum:");
    if (splitIndex !== -1) {
      return text.substring(0, splitIndex).trim();
    }
    return text;
  };

  const displayFix = parseSuggestedFix(result.suggestedFix);

  return (
    <section className="room-panel rounded-[24px] p-5 text-left animate-fade-in">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
        <div>
          <h2 className="font-sans text-sm font-semibold text-white leading-normal">Consensus package</h2>
          <p className="mt-0.5 font-mono-console text-[10px] text-white/40">Fix Captain has locked the room response.</p>
        </div>
        <button
          type="button"
          onClick={onOpenReport}
          className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono-console text-[10px] uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
        >
          View Full Report
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-3.5">
          <Panel label="Summary" value={result.summary} />
          <Panel label="Root cause" value={result.rootCause} accent="orange" />
          <div className="room-subpanel rounded-2xl p-4 border border-cyan-500/15">
            <p className="font-mono-technical text-[9px] uppercase tracking-wider text-cyan-300/80">Suggested fix</p>
            <p className="mt-1.5 font-sans text-xs text-cyan-100/90 leading-relaxed font-light">{displayFix}</p>
          </div>
        </div>

        <div className="room-subpanel rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <p className="font-mono-technical text-[9px] uppercase tracking-wider text-white/40 border-b border-white/5 pb-1.5">Next steps</p>
            <ol className="mt-2.5 space-y-2">
              {result.nextSteps.slice(0, 3).map((step, index) => (
                <li key={`${index}-${step}`} className="flex gap-2.5 text-xs leading-relaxed text-white/85 font-sans font-light">
                  <span className="text-cyan-300 font-mono-console font-bold text-[10px] pt-0.5">{String(index + 1).padStart(2, '0')}</span>
                  <span>{step}</span>
                </li>
              ))}
              {result.nextSteps.length > 3 && (
                <li className="text-[10px] text-white/40 font-mono-console italic pl-6 mt-1">
                  +{result.nextSteps.length - 3} more steps in report
                </li>
              )}
            </ol>
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
            <Metric label="Confidence" value={`${Math.round(result.confidence * 100)}%`} />
            <Metric label="Latency" value={`${result.timing.elapsedMs}ms`} />
            <Metric label="Model" value={result.timing.model.split('/').pop() || '—'} />
            <Metric label="Tokens" value={result.timing.totalTokens ? String(result.timing.totalTokens) : '—'} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({ label, value, accent = 'cyan' }: { label: string; value: string; accent?: 'cyan' | 'orange' }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent === 'orange' ? 'border-orange-500/15 bg-orange-500/[0.03]' : 'room-subpanel'}`}>
      <p className={`font-mono-technical text-[9px] uppercase tracking-wider ${accent === 'orange' ? 'text-orange-400/80' : 'text-cyan-300/80'}`}>{label}</p>
      <p className="mt-1.5 font-sans text-xs text-white/90 leading-relaxed font-light">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="room-subpanel-soft rounded-xl p-2.5">
      <p className="font-mono-technical text-[8px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-0.5 text-xs text-white/80 font-mono-console break-words truncate" title={value}>{value}</p>
    </div>
  );
}

"use client";

import React from "react";
import type { AnalysisResult } from "../lib/types";
import ReportPanel from "./ReportPanel";

interface DiagnosisPanelProps {
  result: AnalysisResult | null;
  activeAgentIndex: number | null;
  error: string | null;
  onOpenLog: () => void;
}

export default function DiagnosisPanel({
  result,
  activeAgentIndex,
  error,
  onOpenLog,
}: DiagnosisPanelProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/35 bg-red-500/5 p-4 text-xs font-mono-console leading-6 text-red-300 text-left animate-fade-in-up">
        <span className="font-bold block uppercase tracking-wider mb-1">Swarm Connection Failure</span>
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-white/5 bg-black/10 p-5 text-center text-xs font-mono-console leading-6 text-[#C1C1C1]/40 flex flex-col items-center justify-center gap-2 min-h-32">
        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center animate-pulse text-[#C1C1C1]/20 text-sm">
          👁️
        </div>
        <span>Swarm telemetry is dormant. Supply a screenshot or click 60s Demo to run.</span>
      </div>
    );
  }

  const isLocked = activeAgentIndex === 4 || activeAgentIndex === null;

  if (!isLocked) {
    return null;
  }

  return (
    <section className="rounded-2xl glass-strong p-5 sm:p-6 text-left space-y-5 animate-fade-in-up relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-cyan-500/[0.015] via-transparent to-transparent" />

      <div className="mb-4 flex items-start justify-between gap-4 relative z-10">
        <div>
          <h2 className="font-mono-technical text-base font-semibold tracking-[-0.02em] text-white">Consensus Swarm Diagnosis</h2>
          <p className="mt-0.5 text-xs text-[#C1C1C1]/60 font-light">Collaborative consensus locked in.</p>
        </div>
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[9px] font-mono-technical uppercase tracking-widest text-[#1EF7C1]">
          Locked
        </span>
      </div>

      <div className="space-y-4 font-mono-console text-xs relative z-10">
        <div>
          <p className="font-mono-technical text-[9px] uppercase tracking-widest text-[#C1C1C1]/40">consensus summary</p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-white">{result.summary}</p>
        </div>

        <div className="border-t border-white/5 pt-3">
          <p className="font-mono-technical text-[9px] uppercase tracking-widest text-orange-400/60">suspected root cause</p>
          <p className="mt-1.5 leading-relaxed text-[#C1C1C1] font-light">{result.rootCause}</p>
        </div>

        <div className="border-t border-white/5 pt-3">
          <p className="font-mono-technical text-[9px] uppercase tracking-widest text-[#1EF7C1]/60">recommended fix</p>
          <pre className="mt-2 overflow-auto rounded-xl border border-cyan-500/15 bg-black/45 p-3.5 text-[10px] leading-5 text-[#1EF7C1] font-mono-console max-w-full whitespace-pre-wrap">{result.suggestedFix}</pre>
        </div>

        {result.nextSteps && result.nextSteps.length > 0 && (
          <div className="border-t border-white/5 pt-3">
            <p className="font-mono-technical text-[9px] uppercase tracking-widest text-[#C1C1C1]/40">verification steps</p>
            <ol className="mt-2 space-y-1.5">
              {result.nextSteps.map((step, idx) => (
                <li className="flex gap-2.5 leading-relaxed text-white/90 font-light" key={step}>
                  <span className="text-[#1EF7C1] font-bold">{String(idx + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <ReportPanel markdown={result.reportMarkdown} onOpenLog={onOpenLog} />
      </div>
    </section>
  );
}

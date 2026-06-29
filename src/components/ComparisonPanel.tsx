"use client";

import React from "react";
import type { AnalysisResult } from "../lib/types";

interface ComparisonPanelProps {
  result: AnalysisResult | null;
  clientElapsedMs: number | null;
  showComparison: boolean;
  onToggle: () => void;
}

export default function ComparisonPanel({
  result,
  clientElapsedMs,
  showComparison,
  onToggle,
}: ComparisonPanelProps) {
  const realMs = result?.timing.elapsedMs ?? clientElapsedMs ?? 0;
  const realTokSec = result?.timing.outputTokensPerSecond ?? 0;

  const baselineMs = realMs ? Math.round(realMs * 7.5) : 1850;
  const baselineTokSec = 24;

  return (
    <section className="rounded-2xl glass p-4 text-left space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="baseline-compare-toggle"
            checked={showComparison}
            onChange={onToggle}
            className="w-4 h-4 rounded border-white/10 bg-black/40 text-[#1EF7C1] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#1EF7C1]"
          />
          <label
            htmlFor="baseline-compare-toggle"
            className="font-mono-technical text-xs font-semibold text-white uppercase tracking-wider cursor-pointer select-none"
          >
            Show baseline comparison in demo video
          </label>
        </div>
        <span className="rounded-full border border-cyan-500/10 bg-cyan-500/5 px-2 py-0.5 text-[8px] font-mono-console text-[#1EF7C1] uppercase tracking-widest">
          benchmark
        </span>
      </div>

      {showComparison && (
        <div className="space-y-3.5 animate-fade-in-up font-mono-console text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.02] rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#1EF7C1] font-bold uppercase tracking-wider">Cerebras WSE (Real)</span>
                <span className="text-[8px] text-white/40">Gemma 4 31B</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <span className="text-[8px] text-[#C1C1C1]/50 uppercase tracking-wider block">Latency</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">{realMs ? `${realMs}ms` : "awaiting"}</span>
                </div>
                <div>
                  <span className="text-[8px] text-[#C1C1C1]/50 uppercase tracking-wider block">Throughput</span>
                  <span className="text-sm font-bold text-[#1EF7C1] mt-0.5 block">
                    {realTokSec ? `${Math.round(realTokSec)} t/s` : "awaiting"}
                  </span>
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-[#1EF7C1] transition-all duration-1000"
                  style={{ width: realTokSec ? "100%" : "0%" }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-orange-400/80 font-bold uppercase tracking-wider">GPU Baseline</span>
                <span className="text-[8px] text-white/40">Optional Comparison</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <span className="text-[8px] text-[#C1C1C1]/50 uppercase tracking-wider block">Latency</span>
                  <span className="text-sm font-bold text-[#C1C1C1]/80 mt-0.5 block">
                    {realMs ? `~${baselineMs}ms` : "awaiting"}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-[#C1C1C1]/50 uppercase tracking-wider block">Throughput</span>
                  <span className="text-sm font-bold text-orange-400/80 mt-0.5 block">
                    {realMs ? `${baselineTokSec} t/s` : "awaiting"}
                  </span>
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-orange-400/70 transition-all duration-1000"
                  style={{ width: realTokSec ? `${Math.min(100, Math.round((baselineTokSec / realTokSec) * 100))}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {realTokSec > 0 && (
            <div className="p-2.5 rounded-lg border border-cyan-500/10 bg-cyan-500/[0.02] text-center text-[10px] text-white/80">
              ⚡ Cerebras processes incident swarm findings roughly{" "}
              <span className="text-[#1EF7C1] font-bold">
                {Math.max(1, Math.round(realTokSec / baselineTokSec))}x faster
              </span>{" "}
              than typical baseline cloud GPU clusters.
            </div>
          )}

          <div className="p-2.5 rounded-lg border border-white/5 bg-black/20 text-left text-[9px] text-[#C1C1C1]/40 leading-relaxed space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[#C1C1C1]/60">Integration Instructions</span>
            <p>
              This baseline comparison is simulated for demo video presentation. Record a second provider separately or wire optional backend baseline later. Cerebras/Gemma 4 remains the exclusive model powering the live analysis.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

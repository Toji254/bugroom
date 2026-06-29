"use client";

import React from "react";

interface SpeedBadgeProps {
  elapsedMs?: number;
  model?: string;
  tokensPerSecond?: number;
}

export default function SpeedBadge({ elapsedMs, model = "gemma-4-31b", tokensPerSecond }: SpeedBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5 text-xs text-[#1EF7C1] font-mono-console">
      <span className="font-bold">Cerebras Speed</span>
      <span className="text-white/60">|</span>
      <span className="text-white/80">{elapsedMs ? `${elapsedMs}ms` : "ready"}</span>
      {tokensPerSecond ? (
        <>
          <span className="text-white/60">|</span>
          <span className="text-white/80">{Math.round(tokensPerSecond)} tok/s</span>
        </>
      ) : null}
      <span className="text-white/60">|</span>
      <span className="text-white/80">{model}</span>
    </div>
  );
}

"use client";

import React, { MouseEvent } from "react";
import type { DemoPreset } from "../lib/presets";

interface DemoPresetCardProps {
  preset: DemoPreset;
  index: number;
  isActive: boolean;
  isAnalyzing: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function DemoPresetCard({
  preset,
  index,
  isActive,
  isAnalyzing,
  onClick,
}: DemoPresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isAnalyzing}
      className={`group rounded-xl border p-3 text-left transition-all duration-300 disabled:opacity-55 cursor-pointer w-full ${
        isActive
          ? "border-cyan-500/40 bg-cyan-500/5"
          : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono-console mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-[10px] text-[#1EF7C1]">
          0{index + 1}
        </span>
        <span className="flex-1">
          <span className="block text-xs font-semibold text-white font-mono-technical">{preset.title}</span>
          <span className="mt-1 block text-[10px] leading-relaxed text-[#C1C1C1]/60 font-light">{preset.description}</span>
        </span>
      </div>
    </button>
  );
}

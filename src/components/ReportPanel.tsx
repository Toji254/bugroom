"use client";

import React from "react";

interface ReportPanelProps {
  markdown: string;
  onOpenLog: () => void;
}

export default function ReportPanel({ markdown, onOpenLog }: ReportPanelProps) {
  const handleCopy = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy report", err);
    }
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bugroom-incident-report-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-3 font-mono-console">
      <div className="flex flex-col gap-0.5 text-left">
        <span className="font-mono-technical text-[9px] uppercase tracking-widest text-[#C1C1C1]/40">incident report</span>
        <span className="text-[10px] text-[#C1C1C1]/60 font-light">Exportable log formatted in Markdown.</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenLog}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[10px] font-semibold text-white/80 transition hover:bg-white/[0.05] cursor-pointer font-mono-technical uppercase tracking-wide"
        >
          Open Log
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-white/10 px-3.5 py-1.5 text-[10px] font-semibold text-white/80 transition hover:border-cyan-500/30 hover:text-[#1EF7C1] cursor-pointer font-mono-technical uppercase tracking-wide"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3.5 py-1.5 text-[10px] font-bold text-[#1EF7C1] transition hover:bg-cyan-500/20 cursor-pointer font-mono-technical uppercase tracking-wide"
        >
          Download MD
        </button>
      </div>
    </div>
  );
}

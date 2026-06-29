"use client";

import React, { useState } from "react";
import type { AnalysisResult } from "../lib/types";

interface AnalysisReportViewProps {
  result: AnalysisResult | null;
  question: string;
  onClose: () => void;
}

export default function AnalysisReportView({ result, question, onClose }: AnalysisReportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"diagnosis" | "resolution" | "evidence">("diagnosis");

  if (!result) return null;

  const timestamp = new Date().toLocaleString();
  const formatConfidence = (value: number) => `${Math.round(value * 100)}%`;
  const totalTime = result.timing.elapsedMs;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.reportMarkdown || "");
      alert("Report copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.reportMarkdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bugroom-analysis-report-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const agentIcons: Record<string, string> = {
    vision: "👁️",
    debug: "🕵️",
    ux: "🎨",
    fix: "🛠️",
  };

  const agentNames: Record<string, string> = {
    vision: "UI Analyzer",
    debug: "Log Parser",
    ux: "State Inspector",
    fix: "Network Probe",
  };

  const agentColors: Record<string, string> = {
    vision: "#1EF7C1",
    debug: "#E88D39",
    ux: "#2DD4BF",
    fix: "#FEFEFE",
  };

  // Extract subagent addendum or plan if present in suggestedFix to show it separately
  const parseSuggestedFix = (text: string) => {
    const splitIndex = text.indexOf("Subagent addendum:");
    if (splitIndex !== -1) {
      return {
        mainFix: text.substring(0, splitIndex).trim(),
        addendum: text.substring(splitIndex).trim(),
      };
    }
    return { mainFix: text, addendum: null };
  };

  const { mainFix, addendum } = parseSuggestedFix(result.suggestedFix);

  return (
    <div className="w-full rounded-[24px] border border-white/10 bg-[#0c1219]/95 p-6 md:p-8 text-left shadow-2xl backdrop-blur-xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1EF7C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h2 className="font-sans text-xl font-semibold tracking-tight text-white">Incident Analysis Report</h2>
            <p className="mt-1 font-mono-console text-xs text-white/40">Consensus locked in at {timestamp}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 font-mono-technical text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <span>Copy MD</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 font-mono-technical text-xs text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Report</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono-technical text-xs text-white/80 transition hover:bg-white/10"
          >
            <span>Console</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-white/5 pb-6">
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
          <p className="font-sans text-xs font-medium text-white/40 uppercase tracking-wider">Response Time</p>
          <p className="mt-1.5 font-mono-console text-xl font-semibold text-white">
            {totalTime < 1000 ? `${totalTime.toFixed(0)}ms` : `${(totalTime / 1000).toFixed(2)}s`}
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
          <p className="font-sans text-xs font-medium text-white/40 uppercase tracking-wider">Consensus Confidence</p>
          <p className="mt-1.5 font-mono-console text-xl font-semibold text-[#1EF7C1]">{formatConfidence(result.confidence)}</p>
        </div>
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
          <p className="font-sans text-xs font-medium text-white/40 uppercase tracking-wider">Active Swarm</p>
          <p className="mt-1.5 font-mono-console text-xl font-semibold text-white">{result.agents.length} Agents</p>
        </div>
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
          <p className="font-sans text-xs font-medium text-white/40 uppercase tracking-wider">Engine / Speed</p>
          <p className="mt-1.5 font-mono-console text-sm font-semibold text-white/85 truncate" title={result.timing.model}>
            {result.timing.model.split('/').pop()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-white/5">
        <button
          onClick={() => setActiveSubTab("diagnosis")}
          className={`pb-3 px-4 font-sans text-sm font-medium border-b-2 transition-all ${
            activeSubTab === "diagnosis"
              ? "border-[#1EF7C1] text-[#1EF7C1]"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          Diagnosis & Root Cause
        </button>
        <button
          onClick={() => setActiveSubTab("resolution")}
          className={`pb-3 px-4 font-sans text-sm font-medium border-b-2 transition-all ${
            activeSubTab === "resolution"
              ? "border-[#1EF7C1] text-[#1EF7C1]"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          Resolution & Action Plan
        </button>
        <button
          onClick={() => setActiveSubTab("evidence")}
          className={`pb-3 px-4 font-sans text-sm font-medium border-b-2 transition-all ${
            activeSubTab === "evidence"
              ? "border-[#1EF7C1] text-[#1EF7C1]"
              : "border-transparent text-white/50 hover:text-white/80"
          }`}
        >
          Swarm Evidence ({result.agents.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-6 font-sans">
        {activeSubTab === "diagnosis" && (
          <div className="space-y-6 animate-fade-in">
            {/* Operator Query */}
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold font-mono-technical">Operator Query</span>
              <p className="mt-1.5 text-sm text-white/90 leading-relaxed font-light">{question}</p>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">Executive Summary</h3>
              <p className="text-base text-white/80 leading-relaxed font-light">{result.summary}</p>
            </div>

            {/* Root Cause Card */}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-5">
              <div className="flex items-center gap-2 text-orange-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span className="text-xs uppercase tracking-widest font-semibold font-mono-technical">Suspected Root Cause</span>
              </div>
              <p className="mt-3 text-sm text-white/90 leading-relaxed font-light">{result.rootCause}</p>
            </div>
          </div>
        )}

        {activeSubTab === "resolution" && (
          <div className="space-y-6 animate-fade-in">
            {/* Recommended Fix */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Recommended Resolution</h3>
              <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.02] p-5">
                <p className="text-sm text-white/90 leading-relaxed font-light">{mainFix}</p>
                
                {addendum && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <span className="text-[10px] uppercase tracking-widest text-cyan-400/80 font-semibold font-mono-technical block mb-2">Technical Execution Plan</span>
                    <pre className="overflow-auto rounded-lg border border-white/5 bg-black/40 p-4 text-xs leading-relaxed text-cyan-200/90 font-mono-console max-w-full whitespace-pre-wrap">
                      {addendum.replace("Subagent addendum:", "").trim()}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Steps */}
            {result.nextSteps && result.nextSteps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-white">Verification & Next Steps</h3>
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5">
                  <ol className="space-y-3">
                    {result.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex gap-4 text-sm text-white/80 font-light leading-relaxed">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-bold text-[#1EF7C1] font-mono-console">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "evidence" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-medium text-white mb-2">Agent Swarm Evidence</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {result.agents.map((agent) => (
                <div
                  key={agent.agentId}
                  className="rounded-xl border p-5 bg-white/[0.01] flex flex-col justify-between"
                  style={{ borderColor: `${agentColors[agent.agentId] || "#FEFEFE"}15` }}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{agentIcons[agent.agentId] || "🤖"}</span>
                        <span
                          className="text-sm font-semibold font-mono-technical"
                          style={{ color: agentColors[agent.agentId] || "#FEFEFE" }}
                        >
                          {agentNames[agent.agentId] || agent.agentId}
                        </span>
                      </div>
                      <span className="font-mono-console text-xs text-white/55 bg-white/5 px-2 py-0.5 rounded">
                        Confidence: {formatConfidence(agent.confidence)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white/95 leading-relaxed">{agent.headline}</p>
                    <p className="mt-2 text-xs text-white/70 leading-relaxed font-light">{agent.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

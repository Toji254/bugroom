"use client";

import React, { useState } from "react";
import type { AnalysisResult } from "../lib/types";

interface ReportModalProps {
  result: AnalysisResult | null;
  question: string;
  onClose: () => void;
}

export default function ReportModal({ result, question, onClose }: ReportModalProps) {
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background: "rgba(2, 2, 2, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="relative overflow-hidden w-full max-w-3xl my-8 transition-all duration-300 flex flex-col"
        style={{
          borderRadius: 20,
          background: "rgba(18, 24, 40, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 40px 80px rgba(0, 0, 0, 0.7)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b"
          style={{
            padding: "20px 24px",
            borderColor: "rgba(255, 255, 255, 0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(30, 247, 193, 0.1)",
                border: "1px solid rgba(30, 247, 193, 0.25)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1EF7C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-base font-semibold text-[#FEFEFE]">Incident Analysis Report</span>
              <span className="font-mono-console text-[10px] text-[#C1C1C1]/50">{timestamp}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center transition-all duration-300 gap-1.5 cursor-pointer text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 py-1.5 font-mono-technical"
            >
              <span>Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center transition-all duration-300 gap-1.5 cursor-pointer text-xs rounded-lg border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 text-[#1EF7C1] px-3 py-1.5 font-mono-technical"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export MD</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center transition-all duration-300 cursor-pointer w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-white/70 hover:text-red-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Metrics bar */}
          <div className="grid grid-cols-3 gap-3 border border-white/5 bg-white/[0.01] rounded-xl p-4">
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-sans text-[10px] font-medium text-white/40 uppercase tracking-wider">Response Time</span>
              <span className="mt-1 font-mono-console text-lg font-semibold text-white">
                {totalTime < 1000 ? `${totalTime.toFixed(0)}ms` : `${(totalTime / 1000).toFixed(2)}s`}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-sans text-[10px] font-medium text-white/40 uppercase tracking-wider">Confidence</span>
              <span className="mt-1 font-mono-console text-lg font-semibold text-[#1EF7C1]">{formatConfidence(result.confidence)}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-sans text-[10px] font-medium text-white/40 uppercase tracking-wider">Active Swarm</span>
              <span className="mt-1 font-mono-console text-lg font-semibold text-white">{result.agents.length} Agents</span>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveSubTab("diagnosis")}
              className={`pb-2.5 px-4 font-sans text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeSubTab === "diagnosis"
                  ? "border-[#1EF7C1] text-[#1EF7C1]"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              Diagnosis
            </button>
            <button
              onClick={() => setActiveSubTab("resolution")}
              className={`pb-2.5 px-4 font-sans text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeSubTab === "resolution"
                  ? "border-[#1EF7C1] text-[#1EF7C1]"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              Resolution
            </button>
            <button
              onClick={() => setActiveSubTab("evidence")}
              className={`pb-2.5 px-4 font-sans text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeSubTab === "evidence"
                  ? "border-[#1EF7C1] text-[#1EF7C1]"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              Swarm Evidence
            </button>
          </div>

          {/* Tab contents */}
          <div className="font-sans text-left">
            {activeSubTab === "diagnosis" && (
              <div className="space-y-5 animate-fade-in">
                {/* Operator Query */}
                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                  <span className="text-[9px] uppercase tracking-widest text-white/30 font-semibold font-mono-technical block mb-1">Operator Query</span>
                  <p className="text-sm text-white/90 leading-relaxed font-light">{question}</p>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 font-mono-technical">Executive Summary</h3>
                  <p className="text-sm text-white/90 leading-relaxed font-light">{result.summary}</p>
                </div>

                {/* Root Cause */}
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-4.5">
                  <div className="flex items-center gap-1.5 text-orange-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span className="text-[10px] uppercase tracking-widest font-semibold font-mono-technical">Suspected Root Cause</span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed font-light">{result.rootCause}</p>
                </div>
              </div>
            )}

            {activeSubTab === "resolution" && (
              <div className="space-y-5 animate-fade-in">
                {/* Resolution */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 font-mono-technical">Recommended Resolution</h3>
                  <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/[0.02] p-4.5">
                    <p className="text-sm text-white/90 leading-relaxed font-light">{mainFix}</p>
                    
                    {addendum && (
                      <div className="mt-3 border-t border-white/5 pt-3">
                        <span className="text-[9px] uppercase tracking-widest text-cyan-400/80 font-semibold font-mono-technical block mb-1.5">Technical Execution Plan</span>
                        <pre className="overflow-auto rounded-lg border border-white/5 bg-black/40 p-3.5 text-xs leading-relaxed text-cyan-200/90 font-mono-console max-w-full whitespace-pre-wrap">
                          {addendum.replace("Subagent addendum:", "").trim()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps */}
                {result.nextSteps && result.nextSteps.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 font-mono-technical">Verification Steps</h3>
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4.5">
                      <ol className="space-y-2.5">
                        {result.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-sm text-white/80 font-light leading-relaxed">
                            <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-bold text-[#1EF7C1] font-mono-console">
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
              <div className="space-y-3.5 animate-fade-in">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 font-mono-technical mb-1">Agent Findings</h3>
                <div className="flex flex-col gap-3">
                  {result.agents.map((agent) => (
                    <div
                      key={agent.agentId}
                      className="rounded-xl border p-4 bg-white/[0.01] flex flex-col justify-between"
                      style={{ borderColor: `${agentColors[agent.agentId] || "#FEFEFE"}15` }}
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{agentIcons[agent.agentId] || "🤖"}</span>
                          <span
                            className="text-xs font-semibold font-mono-technical"
                            style={{ color: agentColors[agent.agentId] || "#FEFEFE" }}
                          >
                            {agentNames[agent.agentId] || agent.agentId}
                          </span>
                        </div>
                        <span className="font-mono-console text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded">
                          {formatConfidence(agent.confidence)} confidence
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white/95 leading-relaxed">{agent.headline}</p>
                      <p className="mt-1.5 text-xs text-white/70 leading-relaxed font-light">{agent.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

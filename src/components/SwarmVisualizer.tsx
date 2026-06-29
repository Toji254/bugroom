'use client';

import React, { useMemo, useEffect, useState } from 'react';
import type { Incident, AgentRun } from '@/lib/types';

interface SwarmVisualizerProps {
  incident: Incident | null;
  isAnalyzing: boolean;
}

export default function SwarmVisualizer({ incident, isAnalyzing }: SwarmVisualizerProps) {
  const [radarAngle, setRadarAngle] = useState(0);

  // Radar sweep animation when idle
  useEffect(() => {
    if (isAnalyzing) return;
    let animId: number;
    const tick = () => {
      setRadarAngle((prev) => (prev + 1) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isAnalyzing]);

  // Extract runs
  const runs = useMemo(() => incident?.runs ?? [], [incident]);

  // Map primary runs
  const primaryRuns = useMemo(() => runs.filter((r) => r.kind === 'primary'), [runs]);

  // Map subagent runs
  const subagentRuns = useMemo(() => runs.filter((r) => r.kind === 'subagent'), [runs]);

  // Define positions for the 4 primary agents
  // Center is (400, 225)
  const primaryPositions: Record<string, { x: number; y: number; angle: number }> = {
    vision: { x: 220, y: 120, angle: 210 }, // Top-Left
    debug: { x: 220, y: 310, angle: 150 },  // Bottom-Left
    ux: { x: 580, y: 120, angle: 330 },     // Top-Right
    fix: { x: 580, y: 310, angle: 30 },      // Bottom-Right
  };

  // Dynamically position subagents around their parent node
  const subagentPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Group subagents by parent run ID
    const parentGroups: Record<string, AgentRun[]> = {};
    subagentRuns.forEach((run) => {
      if (run.parentRunId) {
        if (!parentGroups[run.parentRunId]) {
          parentGroups[run.parentRunId] = [];
        }
        parentGroups[run.parentRunId].push(run);
      }
    });

    // Assign positions
    Object.entries(parentGroups).forEach(([parentRunId, children]) => {
      const parentRun = primaryRuns.find((r) => r.id === parentRunId);
      if (!parentRun) return;

      const parentPos = primaryPositions[parentRun.agentId];
      if (!parentPos) return;

      children.forEach((child, index) => {
        // Position subagents in an arc extending outwards from the parent
        const baseAngle = (parentPos.angle * Math.PI) / 180;
        const offsetAngle = ((index - (children.length - 1) / 2) * 35 * Math.PI) / 180;
        const angle = baseAngle + offsetAngle;
        const distance = 95; // distance from parent

        positions[child.id] = {
          x: parentPos.x + Math.cos(angle) * distance,
          y: parentPos.y + Math.sin(angle) * distance,
        };
      });
    });

    return positions;
  }, [primaryRuns, subagentRuns]);

  return (
    <div className="relative w-full aspect-video border border-white/10 bg-black/40 overflow-hidden rounded-sm select-none">
      {/* SVG Swarm Canvas */}
      <svg
        viewBox="0 0 800 450"
        className="w-full h-full"
        style={{ background: '#04070b' }}
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
            <circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.08)" />
          </pattern>

          {/* Glow filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Radial gradient for radar */}
          <radialGradient id="radar-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(30, 247, 193, 0.15)" />
            <stop offset="70%" stopColor="rgba(30, 247, 193, 0.05)" />
            <stop offset="100%" stopColor="rgba(30, 247, 193, 0)" />
          </radialGradient>
        </defs>

        {/* Custom CSS animations */}
        <style>{`
          @keyframes radar-pulse {
            0% { r: 50px; opacity: 0.6; }
            100% { r: 180px; opacity: 0; }
          }
          @keyframes pulse-node {
            0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(30, 247, 193, 0.4)); }
            50% { transform: scale(1.06); filter: drop-shadow(0 0 8px rgba(30, 247, 193, 0.8)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(30, 247, 193, 0.4)); }
          }
          @keyframes pulse-node-red {
            0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.4)); }
            50% { transform: scale(1.06); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(239, 68, 68, 0.4)); }
          }
          @keyframes flow-dash {
            to { stroke-dashoffset: -20; }
          }
          @keyframes rotate-radar {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-radar-pulse {
            animation: radar-pulse 3s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
          }
          .node-pulse-active {
            animation: pulse-node 2s infinite ease-in-out;
            transform-origin: center;
          }
          .node-pulse-failed {
            animation: pulse-node-red 1.5s infinite ease-in-out;
            transform-origin: center;
          }
          .line-flow {
            stroke-dasharray: 5, 5;
            animation: flow-dash 1s linear infinite;
          }
        `}</style>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* ================= IDLE STATE (RADAR SCANNER) ================= */}
        {!isAnalyzing && !incident && (
          <g>
            {/* Center crosshair */}
            <line x1="400" y1="50" x2="400" y2="400" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <line x1="100" y1="225" x2="700" y2="225" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            
            {/* Radar circles */}
            <circle cx="400" cy="225" r="70" fill="none" stroke="rgba(30, 247, 193, 0.08)" strokeWidth="1" />
            <circle cx="400" cy="225" r="140" fill="none" stroke="rgba(30, 247, 193, 0.05)" strokeWidth="1" />
            <circle cx="400" cy="225" r="210" fill="none" stroke="rgba(30, 247, 193, 0.03)" strokeWidth="1" />

            {/* Pulsing center radar wave */}
            <circle cx="400" cy="225" r="100" fill="none" stroke="#1EF7C1" strokeWidth="1" className="animate-radar-pulse" />

            {/* Rotating radar sweep line */}
            <g transform={`rotate(${radarAngle}, 400, 225)`}>
              <line x1="400" y1="225" x2="400" y2="25" stroke="#1EF7C1" strokeWidth="1.5" opacity="0.8" filter="url(#glow)" />
              <path d="M 400 225 L 400 25 A 200 200 0 0 1 520 70 Z" fill="url(#radar-grad)" opacity="0.4" />
            </g>

            {/* Diagnostics labels */}
            <text x="400" y="220" fontFamily="var(--font-ibm-plex-mono), monospace" fontSize="10" fill="#1EF7C1" textAnchor="middle" letterSpacing="0.2em" opacity="0.8">
              AWAITING DISPATCH
            </text>
            <text x="400" y="240" fontFamily="var(--font-ibm-plex-mono), monospace" fontSize="8" fill="rgba(255,255,255,0.4)" textAnchor="middle" letterSpacing="0.1em">
              WATCHER ACTIVE & READY
            </text>
          </g>
        )}

        {/* ================= ACTIVE SWARM ORCHESTRATION MAP ================= */}
        {(isAnalyzing || incident) && (
          <g>
            {/* 1. CONNECTION LINES (Rendered underneath nodes) */}
            
            {/* Lines from Center to Primary Agents */}
            {Object.entries(primaryPositions).map(([agentId, pos]) => {
              const run = primaryRuns.find((r) => r.agentId === agentId);
              const isActive = run?.status === 'running';
              const isCompleted = run?.status === 'completed';
              
              let strokeColor = 'rgba(255,255,255,0.08)';
              if (isActive) strokeColor = 'rgba(30,247,193,0.5)';
              else if (isCompleted) strokeColor = 'rgba(30,247,193,0.2)';

              return (
                <g key={`line-to-${agentId}`}>
                  <line
                    x1="400"
                    y1="225"
                    x2={pos.x}
                    y2={pos.y}
                    stroke={strokeColor}
                    strokeWidth={isActive ? 2 : 1.2}
                    className={isActive ? 'line-flow' : ''}
                  />
                  {/* Flow particles for active lines */}
                  {isActive && (
                    <circle r="3" fill="#1EF7C1" filter="url(#glow)">
                      <animateMotion
                        path={`M 400 225 L ${pos.x} ${pos.y}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Lines from Primary Agents to Subagents */}
            {subagentRuns.map((subRun) => {
              const parentPos = subagentPositions[subRun.id];
              const parentRun = primaryRuns.find((r) => r.id === subRun.parentRunId);
              if (!parentPos || !parentRun) return null;

              const parentPosCoords = primaryPositions[parentRun.agentId];
              if (!parentPosCoords) return null;

              const isActive = subRun.status === 'running' || subRun.status === 'queued';
              const isIntegrated = subRun.status === 'integrated';
              const isDiscarded = subRun.status === 'discarded';

              let strokeColor = 'rgba(255,255,255,0.06)';
              let strokeWidth = 1;
              if (isActive) {
                strokeColor = 'rgba(245, 158, 11, 0.5)'; // Orange/amber for active subagent spawning
                strokeWidth = 1.5;
              } else if (isIntegrated) {
                strokeColor = 'rgba(45, 212, 191, 0.4)'; // Teal for integrated
              } else if (isDiscarded) {
                strokeColor = 'rgba(239, 68, 68, 0.2)'; // Red/muted for discarded
              }

              return (
                <g key={`line-sub-${subRun.id}`}>
                  <line
                    x1={parentPosCoords.x}
                    y1={parentPosCoords.y}
                    x2={parentPos.x}
                    y2={parentPos.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={isDiscarded ? '2,4' : undefined}
                    className={isActive ? 'line-flow' : ''}
                  />
                  {/* Flow particles to subagent */}
                  {isActive && (
                    <circle r="2.5" fill="#f59e0b" filter="url(#glow)">
                      <animateMotion
                        path={`M ${parentPosCoords.x} ${parentPosCoords.y} L ${parentPos.x} ${parentPos.y}`}
                        dur="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  {/* Flow particles returning from integrated subagent */}
                  {isIntegrated && (
                    <circle r="2.5" fill="#2dd4bf" filter="url(#glow)">
                      <animateMotion
                        path={`M ${parentPos.x} ${parentPos.y} L ${parentPosCoords.x} ${parentPosCoords.y}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* 2. SUBAGENT NODES */}
            {subagentRuns.map((subRun) => {
              const pos = subagentPositions[subRun.id];
              if (!pos) return null;

              const isQueued = subRun.status === 'queued';
              const isActive = subRun.status === 'running';
              const isIntegrated = subRun.status === 'integrated';
              const isDiscarded = subRun.status === 'discarded';

              let nodeColor = 'rgba(255,255,255,0.15)';
              let glowColor = 'transparent';
              let ringColor = 'transparent';
              
              if (isQueued || isActive) {
                nodeColor = '#f59e0b'; // Amber
                glowColor = 'rgba(245, 158, 11, 0.3)';
                ringColor = 'rgba(245, 158, 11, 0.4)';
              } else if (isIntegrated) {
                nodeColor = '#2dd4bf'; // Teal
                glowColor = 'rgba(45, 212, 191, 0.2)';
              } else if (isDiscarded) {
                nodeColor = 'rgba(239, 68, 68, 0.4)'; // Muted Red
                glowColor = 'transparent';
              }

              return (
                <g key={`node-sub-${subRun.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Pulsing ring for active */}
                  {isActive && (
                    <circle cx="0" cy="0" r="14" fill="none" stroke={ringColor} strokeWidth="1.5" className="animate-radar-pulse" />
                  )}
                  
                  {/* Node core */}
                  <circle
                    cx="0"
                    cy="0"
                    r="6"
                    fill={nodeColor}
                    stroke="#04070b"
                    strokeWidth="1.5"
                    filter={glowColor !== 'transparent' ? 'url(#glow)' : undefined}
                    className={isActive ? 'node-pulse-active' : ''}
                  />

                  {/* Discarded cross-out overlay */}
                  {isDiscarded && (
                    <path d="M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#ef4444" strokeWidth="1.5" />
                  )}

                  {/* Subagent Label */}
                  <text
                    x="0"
                    y="-12"
                    fontFamily="var(--font-ibm-plex-mono), monospace"
                    fontSize="8"
                    fill={isDiscarded ? 'rgba(255,255,255,0.3)' : isIntegrated ? '#2dd4bf' : '#fff'}
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {subRun.displayName}
                  </text>
                  
                  {/* Status subtext */}
                  <text
                    x="0"
                    y="16"
                    fontFamily="var(--font-ibm-plex-mono), monospace"
                    fontSize="7"
                    fill={isDiscarded ? '#ef4444' : isIntegrated ? '#2dd4bf' : 'rgba(255,255,255,0.5)'}
                    textAnchor="middle"
                  >
                    {subRun.status.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* 3. PRIMARY AGENT NODES */}
            {Object.entries(primaryPositions).map(([agentId, pos]) => {
              const run = primaryRuns.find((r) => r.agentId === agentId);
              const isQueued = !run || run.status === 'queued';
              const isActive = run?.status === 'running';
              const isCompleted = run?.status === 'completed';
              const isFailed = run?.status === 'failed';

              let nodeColor = 'rgba(255, 255, 255, 0.1)';
              let strokeColor = 'rgba(255, 255, 255, 0.2)';
              let textColor = 'rgba(255, 255, 255, 0.5)';
              let ringColor = 'transparent';

              if (isActive) {
                nodeColor = 'rgba(30, 247, 193, 0.15)';
                strokeColor = '#1EF7C1';
                textColor = '#ffffff';
                ringColor = 'rgba(30, 247, 193, 0.3)';
              } else if (isCompleted) {
                nodeColor = 'rgba(45, 212, 191, 0.08)';
                strokeColor = 'rgba(45, 212, 191, 0.8)';
                textColor = '#2dd4bf';
              } else if (isFailed) {
                nodeColor = 'rgba(239, 68, 68, 0.15)';
                strokeColor = '#ef4444';
                textColor = '#ef4444';
                ringColor = 'rgba(239, 68, 68, 0.3)';
              }

              const labelMap: Record<string, string> = {
                vision: 'UI ANALYZER',
                debug: 'LOG PARSER',
                ux: 'STATE INSPECTOR',
                fix: 'FIX CAPTAIN',
              };

              return (
                <g key={`node-${agentId}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Pulsing ring for active */}
                  {isActive && (
                    <circle cx="0" cy="0" r="26" fill="none" stroke={ringColor} strokeWidth="2" className="animate-radar-pulse" />
                  )}
                  
                  {/* Node backing block */}
                  <rect
                    x="-45"
                    y="-15"
                    width="90"
                    height="30"
                    rx="4"
                    fill="#04070b"
                    stroke={strokeColor}
                    strokeWidth={isActive ? 2 : 1}
                    filter={isActive ? 'url(#glow)' : undefined}
                    className={isActive ? 'node-pulse-active' : isFailed ? 'node-pulse-failed' : ''}
                  />

                  {/* Agent Label */}
                  <text
                    x="0"
                    y="3"
                    fontFamily="var(--font-ibm-plex-mono), monospace"
                    fontSize="9"
                    fill={textColor}
                    textAnchor="middle"
                    fontWeight={isActive ? '600' : '400'}
                    letterSpacing="0.05em"
                  >
                    {labelMap[agentId]}
                  </text>

                  {/* Status Indicator Dot */}
                  <circle
                    cx="-35"
                    cy="0"
                    r="3"
                    fill={isActive ? '#1EF7C1' : isCompleted ? '#2dd4bf' : isFailed ? '#ef4444' : 'rgba(255,255,255,0.2)'}
                  />

                  {/* Tooltip finding summary (if completed) */}
                  {isCompleted && run?.headline && (
                    <g opacity="0.85">
                      <rect
                        x="-60"
                        y="22"
                        width="120"
                        height="14"
                        rx="2"
                        fill="rgba(0, 0, 0, 0.85)"
                        stroke="rgba(45, 212, 191, 0.2)"
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y="31"
                        fontFamily="var(--font-ibm-plex-mono), monospace"
                        fontSize="7"
                        fill="rgba(255,255,255,0.8)"
                        textAnchor="middle"
                      >
                        {run.headline.length > 22 ? `${run.headline.slice(0, 20)}...` : run.headline}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* 4. CENTRAL INCIDENT DISPATCH NODE */}
            <g transform="translate(400, 225)">
              {/* Pulsing waves */}
              {isAnalyzing && (
                <>
                  <circle cx="0" cy="0" r="32" fill="none" stroke="rgba(30, 247, 193, 0.2)" strokeWidth="1" className="animate-radar-pulse" />
                  <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(30, 247, 193, 0.1)" strokeWidth="1" className="animate-radar-pulse" style={{ animationDelay: '1.5s' }} />
                </>
              )}

              {/* Core Node */}
              <circle
                cx="0"
                cy="0"
                r="18"
                fill="#04070b"
                stroke={isAnalyzing ? '#1EF7C1' : 'rgba(255, 255, 255, 0.4)'}
                strokeWidth={isAnalyzing ? 2.5 : 1.5}
                filter={isAnalyzing ? 'url(#glow)' : undefined}
              />
              
              {/* Inner core graphic */}
              {isAnalyzing ? (
                <path
                  d="M -5 -5 L 5 5 M 5 -5 L -5 5 M -7 0 L 7 0"
                  stroke="#1EF7C1"
                  strokeWidth="2"
                  filter="url(#glow)"
                />
              ) : (
                <circle cx="0" cy="0" r="4" fill="rgba(255, 255, 255, 0.4)" />
              )}

              {/* Label */}
              <text
                x="0"
                y="-24"
                fontFamily="var(--font-ibm-plex-mono), monospace"
                fontSize="9"
                fill={isAnalyzing ? '#1EF7C1' : 'rgba(255,255,255,0.6)'}
                textAnchor="middle"
                fontWeight="600"
                letterSpacing="0.1em"
              >
                {incident?.status === 'failed' ? 'INCIDENT FAILED' : isAnalyzing ? 'SWARM MOBILIZED' : 'INCIDENT RECORD'}
              </text>
              
              {/* Small status tracker */}
              <text
                x="0"
                y="30"
                fontFamily="var(--font-ibm-plex-mono), monospace"
                fontSize="7.5"
                fill="rgba(255,255,255,0.4)"
                textAnchor="middle"
              >
                {incident ? `ID: ${incident.id.slice(0, 8)}` : 'DISPATCHING'}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Floating Panel Stats */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none font-mono-console text-[9px] text-white/40">
        <div>
          <span>SWARM_VISUALIZER // v1.0.0</span>
        </div>
        <div className="flex gap-4">
          <span>PRIMARIES: {primaryRuns.length}</span>
          <span className="text-amber-500/80">SUBAGENTS: {subagentRuns.length}</span>
          <span className="text-teal-400/80">INTEGRATED: {subagentRuns.filter(r => r.status === 'integrated').length}</span>
        </div>
      </div>
    </div>
  );
}

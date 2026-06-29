"use client";

import type { AgentRun, Incident } from '@/lib/types';
import { AGENT_DEFINITIONS } from '@/lib/types';

interface SwarmRosterProps {
  incident: Incident | null;
}

export default function SwarmRoster({ incident }: SwarmRosterProps) {
  const primaryRuns = (incident?.runs ?? []).filter((run) => run.kind === 'primary');
  const subagentRuns = (incident?.runs ?? []).filter((run) => run.kind === 'subagent');
  const primaryConfidences = primaryRuns.map((run) => run.confidence).filter((value): value is number => value !== undefined);
  const confidenceSpread = primaryConfidences.length
    ? Math.max(...primaryConfidences) - Math.min(...primaryConfidences)
    : 0;
  const integratedCount = subagentRuns.filter((run) => run.status === 'integrated').length;
  const discardedCount = subagentRuns.filter((run) => run.status === 'discarded').length;
  const recentSubagents = [...subagentRuns]
    .sort((a, b) => new Date(b.finishedAt ?? b.createdAt).getTime() - new Date(a.finishedAt ?? a.createdAt).getTime())
    .slice(0, 5);
  const consensusLabel = getConsensusLabel(incident?.status, confidenceSpread, discardedCount);

  return (
    <section className="room-panel overflow-hidden rounded-[30px] border border-white/10 text-left">
      <div className="border-b border-white/8 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-white/38 font-mono-console">
              <span className={`h-1.5 w-1.5 rounded-full ${incident?.status === 'running' ? 'animate-pulse bg-[#E88D39]' : incident?.status === 'completed' ? 'bg-[#1EF7C1]' : 'bg-white/28'}`} />
              <span>Primary agent roster</span>
              <span className="text-white/18">/</span>
              <span>incident board</span>
            </div>
            <h2 className="mt-3 font-mono-technical text-[clamp(1.05rem,2vw,1.45rem)] uppercase tracking-[0.08em] text-white">
              Agent room at a glance
            </h2>
            <p className="mt-2 max-w-2xl text-[11px] leading-6 text-white/52 font-mono-console">
              The room should feel like the same operating surface as the feed below: compact seats, restrained telemetry, and no generic dashboard-card treatment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <StatPill label="Primaries" value={String(primaryRuns.length || AGENT_DEFINITIONS.length)} accent="cyan" />
            <StatPill label="Subagents" value={String(subagentRuns.length)} />
            <StatPill label="Spread" value={primaryConfidences.length ? `${Math.round(confidenceSpread * 100)} pts` : '—'} />
            <StatPill label="Consensus" value={consensusLabel} accent={incident?.status === 'completed' ? 'emerald' : confidenceSpread > 0.2 ? 'orange' : 'cyan'} />
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="border-b border-white/8 xl:border-b-0 xl:border-r xl:border-white/8">
          <div className="grid gap-0 md:grid-cols-2">
            {AGENT_DEFINITIONS.map((definition, index) => {
              const run = primaryRuns.find((item) => item.agentId === definition.id);
              const children = subagentRuns.filter((item) => item.parentRunId === run?.id);

              return (
                <article
                  key={definition.id}
                  className={`relative min-h-[262px] border-white/8 p-4 sm:p-5 ${seatChromeClassName(index)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] text-lg">
                        {definition.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[8px] uppercase tracking-[0.24em] text-white/34 font-mono-console">
                          <span>Seat {String(index + 1).padStart(2, '0')}</span>
                          <span className="text-white/18">/</span>
                          <span>{definition.shortName}</span>
                        </div>
                        <h3 className="mt-2 font-mono-technical text-sm uppercase tracking-[0.06em] text-white">
                          {definition.name}
                        </h3>
                        <p className="mt-1 max-w-[38ch] text-[10px] leading-5 text-white/43 font-mono-console">
                          {definition.goal}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusPill status={run?.status ?? 'queued'} compact />
                      <div className="text-right">
                        <p className="font-mono-console text-[8px] uppercase tracking-[0.24em] text-white/28">Confidence</p>
                        <p className="mt-1 font-mono-technical text-sm text-white">
                          {run?.confidence !== undefined ? `${Math.round(run.confidence * 100)}%` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 room-subpanel rounded-[18px] p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <TimingChip label="Latency" value={run?.timing ? `${run.timing.elapsedMs}ms` : 'waiting'} />
                      <TimingChip label="TTFT" value={run?.timing?.timeToFirstTokenMs ? `${run.timing.timeToFirstTokenMs}ms` : '—'} />
                      <TimingChip label="Output" value={run?.timing?.outputTokensPerSecond ? `${Math.round(run.timing.outputTokensPerSecond)} tok/s` : '—'} />
                    </div>
                    <p className="mt-3 text-[11px] leading-6 text-white/74 font-mono-console">
                      {run?.summary ?? 'Waiting for the incident to be dispatched.'}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-white/40 font-mono-console">
                    <span className="min-w-0 truncate">{run?.headline ?? 'No finding locked yet.'}</span>
                    <span>{children.length ? `${children.length} child seat${children.length > 1 ? 's' : ''}` : 'no child seats'}</span>
                  </div>

                  {children.length ? (
                    <div className="relative mt-3 space-y-2 pl-4 before:absolute before:bottom-2 before:left-[7px] before:top-1 before:w-px before:bg-cyan-500/14">
                      {children.map((child) => (
                        <SubagentCard key={child.id} run={child} parentName={definition.shortName} />
                      ))}
                    </div>
                  ) : (
                    <div className="room-empty mt-4 rounded-[16px] px-3 py-2.5 text-[10px] text-white/32 font-mono-console">
                      No specialist spawned under this seat yet.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col">
          <section className="border-b border-white/8 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.24em] text-white/32 font-mono-console">Tension read</p>
                <h3 className="mt-2 font-mono-technical text-sm uppercase tracking-[0.06em] text-white">Disagreement and consensus</h3>
                <p className="mt-1 text-[10px] leading-5 text-white/44 font-mono-console">
                  Whether the primaries are aligned or whether Fix Captain still needs to arbitrate.
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-wider font-mono-console ${consensusToneClassName(incident?.status, confidenceSpread, discardedCount)}`}>
                {consensusLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              <SignalCard
                label="Spread"
                value={primaryConfidences.length ? `${Math.round(confidenceSpread * 100)} pts` : '—'}
                note={confidenceSpread > 0.2 ? 'room opinions diverged' : 'primaries mostly aligned'}
                tone={confidenceSpread > 0.2 ? 'orange' : 'cyan'}
              />
              <SignalCard
                label="Integrated"
                value={String(integratedCount)}
                note="specialist artifacts adopted"
                tone="emerald"
              />
              <SignalCard
                label="Archived"
                value={String(discardedCount)}
                note="subagent outputs not promoted"
                tone={discardedCount > integratedCount ? 'orange' : 'muted'}
              />
            </div>

            <div className="mt-4 space-y-2">
              {AGENT_DEFINITIONS.map((definition) => {
                const run = primaryRuns.find((item) => item.agentId === definition.id);
                const confidence = run?.confidence ?? 0;
                const width = Math.max(8, Math.round(confidence * 100));
                return (
                  <div key={definition.id} className="room-subpanel-soft rounded-2xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono-console">
                      <span className="text-white/72">{definition.shortName}</span>
                      <span className="text-white/36">{run?.confidence !== undefined ? `${Math.round(run.confidence * 100)}%` : 'awaiting'}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(30,247,193,0.7),rgba(232,141,57,0.78))] transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.24em] text-white/32 font-mono-console">Room memory</p>
                <h3 className="mt-2 font-mono-technical text-sm uppercase tracking-[0.06em] text-white">Integration history</h3>
                <p className="mt-1 text-[10px] leading-5 text-white/44 font-mono-console">
                  What each specialist produced and whether the room kept it.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] uppercase tracking-wider text-white/55 font-mono-console">
                {recentSubagents.length} latest
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {recentSubagents.length ? (
                recentSubagents.map((run) => {
                  const parent = primaryRuns.find((item) => item.id === run.parentRunId);
                  return (
                    <article key={run.id} className="room-subpanel-soft rounded-2xl p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono-technical text-xs text-white">{run.displayName}</p>
                            <span className="text-[10px] text-white/30 font-mono-console">↳ {parent?.shortName ?? 'unknown seat'}</span>
                            <StatusPill status={run.status} compact />
                          </div>
                          <p className="mt-1 text-[10px] leading-5 text-white/45 font-mono-console">{run.artifactTitle ?? run.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono-console text-[9px] uppercase tracking-widest text-white/28">Latency</p>
                          <p className="mt-1 text-[10px] text-white/62 font-mono-technical">{run.timing ? `${run.timing.elapsedMs}ms` : '—'}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-white/70 font-mono-console">{run.summary ?? run.goal}</p>
                    </article>
                  );
                })
              ) : (
                <div className="room-empty rounded-2xl p-4 text-[11px] text-white/34 font-mono-console">
                  No subagent decisions yet. Once specialists spawn, their integrate/discard history lands here instead of getting lost below the fold.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function SubagentCard({ run, parentName }: { run: AgentRun; parentName: string }) {
  return (
    <div className="room-subpanel-soft relative rounded-2xl p-3 before:absolute before:left-[-10px] before:top-5 before:h-px before:w-3 before:bg-cyan-500/18">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono-technical text-xs text-white">{run.displayName}</p>
            <span className="text-[9px] uppercase tracking-wider text-white/28 font-mono-console">from {parentName}</span>
            <StatusPill status={run.status} compact />
          </div>
          <p className="mt-1 text-[10px] text-white/44 font-mono-console">{run.specialty}</p>
        </div>
        <div className="text-right">
          <p className="font-mono-console text-[9px] uppercase tracking-widest text-white/26">Pace</p>
          <p className="mt-1 text-[10px] text-white/62 font-mono-technical">
            {run.timing?.outputTokensPerSecond ? `${Math.round(run.timing.outputTokensPerSecond)} tok/s` : run.timing ? `${run.timing.elapsedMs}ms` : '—'}
          </p>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-white/68 font-mono-console">{run.summary ?? run.goal}</p>
      {run.artifactTitle ? (
        <div className="room-subpanel-soft mt-2 rounded-xl p-2.5">
          <p className="font-mono-technical text-[10px] uppercase tracking-wider text-cyan-300/80">{run.artifactTitle}</p>
          <p className="mt-1 whitespace-pre-wrap text-[10px] leading-5 text-white/62 font-mono-console">{run.artifactBody}</p>
        </div>
      ) : null}
    </div>
  );
}

function StatPill({
  label,
  value,
  accent = 'muted',
}: {
  label: string;
  value: string;
  accent?: 'cyan' | 'emerald' | 'orange' | 'muted';
}) {
  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClassName(accent)}`}>
      <p className="font-mono-console text-[8px] uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 font-mono-technical text-xs uppercase tracking-[0.05em] text-white">{value}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: 'cyan' | 'emerald' | 'orange' | 'muted';
}) {
  return (
    <div className={`rounded-2xl border p-3 ${toneClassName(tone)}`}>
      <p className="font-mono-console text-[8px] uppercase tracking-widest text-white/42">{label}</p>
      <p className="mt-1 font-mono-technical text-sm text-white">{value}</p>
      <p className="mt-2 text-[10px] leading-5 text-white/50 font-mono-console">{note}</p>
    </div>
  );
}

function TimingChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/8 bg-[#0a121b] px-2 py-1 text-[9px] uppercase tracking-wider text-white/52 font-mono-console">
      {label}: {value}
    </span>
  );
}

function StatusPill({ status, compact = false }: { status: AgentRun['status']; compact?: boolean }) {
  const palette: Record<AgentRun['status'], string> = {
    queued: 'border-white/10 bg-white/[0.035] text-white/56',
    running: 'border-orange-500/20 bg-orange-500/10 text-orange-300',
    blocked: 'border-red-500/20 bg-red-500/10 text-red-300',
    completed: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    integrated: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    discarded: 'border-white/10 bg-[#0b1520]/90 text-white/38',
    failed: 'border-red-500/20 bg-red-500/10 text-red-300',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono-console uppercase tracking-wider ${compact ? 'text-[8px]' : 'text-[9px]'} ${palette[status]}`}>
      {status}
    </span>
  );
}

function seatChromeClassName(index: number) {
  const base = 'border-b md:border-b md:[&:nth-child(odd)]:border-r md:[&:nth-child(odd)]:border-white/8';
  switch (index) {
    case 0:
      return `${base} bg-[radial-gradient(circle_at_top_left,rgba(30,247,193,0.06),transparent_28%),linear-gradient(180deg,rgba(12,16,24,0.96),rgba(8,11,17,0.98))]`;
    case 1:
      return `${base} bg-[radial-gradient(circle_at_top_left,rgba(232,141,57,0.05),transparent_28%),linear-gradient(180deg,rgba(12,16,24,0.96),rgba(8,11,17,0.98))]`;
    case 2:
      return `${base} bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.05),transparent_28%),linear-gradient(180deg,rgba(12,16,24,0.96),rgba(8,11,17,0.98))]`;
    default:
      return `${base} bg-[linear-gradient(180deg,rgba(12,16,24,0.96),rgba(8,11,17,0.98))]`;
  }
}

function toneClassName(tone: 'cyan' | 'emerald' | 'orange' | 'muted') {
  switch (tone) {
    case 'cyan':
      return 'border-cyan-500/16 bg-cyan-500/[0.045]';
    case 'emerald':
      return 'border-emerald-500/16 bg-emerald-500/[0.05]';
    case 'orange':
      return 'border-orange-500/16 bg-orange-500/[0.05]';
    default:
      return 'border-white/8 bg-white/[0.018]';
  }
}

function getConsensusLabel(status: Incident['status'] | undefined, confidenceSpread: number, discardedCount: number) {
  if (status === 'completed') return 'locked';
  if (status === 'running' && confidenceSpread > 0.2) return 'debating';
  if (status === 'running' && discardedCount > 0) return 'arbitrating';
  if (status === 'running') return 'aligning';
  if (status === 'failed') return 'stalled';
  return 'standby';
}

function consensusToneClassName(
  status: Incident['status'] | undefined,
  confidenceSpread: number,
  discardedCount: number,
) {
  if (status === 'completed') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (confidenceSpread > 0.2 || discardedCount > 0) return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
  if (status === 'running') return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';
  return 'border-white/10 bg-white/[0.03] text-white/55';
}

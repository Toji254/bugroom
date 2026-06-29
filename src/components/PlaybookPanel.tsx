"use client";

import type { Incident, PromotedPlaybook } from '@/lib/types';

interface PlaybookPanelProps {
  incident: Incident | null;
  onPromote: (candidateId: string) => void;
  isBusy: boolean;
}

export default function PlaybookPanel({ incident, onPromote, isBusy }: PlaybookPanelProps) {
  const candidates = incident?.playbookCandidates ?? [];
  const applied = incident?.appliedPlaybooks ?? [];

  return (
    <section className="room-panel rounded-[24px] p-4 text-left">
      <div className="mb-4">
        <h2 className="font-mono-technical text-xs font-semibold uppercase tracking-wider text-white leading-normal py-0.5">Room Memory</h2>
        <p className="mt-1 text-[10px] font-mono-console text-white/50">Integrated subagent artifacts can be promoted into reusable BugRoom playbooks.</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-2 font-mono-technical text-[10px] uppercase tracking-wider text-cyan-300/80">Promotion candidates</p>
          <div className="space-y-2">
            {candidates.length ? (
              candidates.map((candidate) => (
                <article key={candidate.id} className="room-subpanel rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono-technical text-xs text-white">{candidate.title}</p>
                      <p className="mt-1 text-[10px] font-mono-console text-white/45">{candidate.summary}</p>
                    </div>
                    {candidate.status === 'promoted' ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono-console text-[8px] uppercase tracking-wider text-emerald-300">
                        promoted
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onPromote(candidate.id)}
                        className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 font-mono-console text-[9px] uppercase tracking-wider text-cyan-300 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Promote
                      </button>
                    )}
                  </div>
                  <pre className="room-subpanel-soft mt-2 whitespace-pre-wrap rounded-xl p-2.5 text-[10px] leading-5 text-white/65 font-mono-console">
                    {candidate.content}
                  </pre>
                </article>
              ))
            ) : (
              <div className="room-empty rounded-2xl p-3 text-[11px] font-mono-console text-white/40">
                No reusable artifacts captured yet. Integrated subagents will land here.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono-technical text-[10px] uppercase tracking-wider text-emerald-300/80">Promoted playbooks</p>
          <div className="space-y-2">
            {applied.length ? applied.map((playbook) => <PromotedPlaybookCard key={playbook.id} playbook={playbook} />) : (
              <div className="room-empty rounded-2xl p-3 text-[11px] font-mono-console text-white/40">
                The room has not promoted any reusable tactics yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PromotedPlaybookCard({ playbook }: { playbook: PromotedPlaybook }) {
  return (
    <article className="rounded-2xl border border-emerald-500/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(9,17,25,0.94))] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono-technical text-xs text-white">{playbook.title}</p>
          <p className="mt-1 text-[10px] font-mono-console text-white/45">{playbook.summary}</p>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono-console text-[8px] uppercase tracking-wider text-emerald-300">
          live
        </span>
      </div>
      <pre className="room-subpanel-soft mt-2 whitespace-pre-wrap rounded-xl p-2.5 text-[10px] leading-5 text-white/65 font-mono-console">
        {playbook.content}
      </pre>
    </article>
  );
}

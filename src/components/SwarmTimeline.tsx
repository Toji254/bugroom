"use client";

import type { Incident } from '@/lib/types';

interface SwarmTimelineProps {
  incident: Incident | null;
}

export default function SwarmTimeline({ incident }: SwarmTimelineProps) {
  const events = [...(incident?.events ?? [])].reverse();

  return (
    <section className="room-panel rounded-[24px] p-4 text-left">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-mono-technical text-xs font-semibold uppercase tracking-wider text-white leading-normal py-0.5">Coordination Timeline</h2>
          <p className="mt-1 text-[10px] font-mono-console text-white/50">The room log shows who spawned, who integrated, and who got discarded.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-mono-console text-[9px] uppercase tracking-wider text-white/60">
          {events.length} events
        </span>
      </div>

      <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
        {events.length ? (
          events.map((event) => (
            <div key={event.id} className="room-subpanel rounded-2xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono-technical text-xs text-white">{event.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/70 font-mono-console">{event.message}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono-console text-[8px] uppercase tracking-wider ${levelClassName(event.level)}`}>
                    {event.level}
                  </span>
                  <p className="mt-1 text-[9px] font-mono-console text-white/35">{formatTime(event.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="room-empty rounded-2xl p-4 text-[11px] font-mono-console text-white/45">
            Timeline waiting for the room to mobilize.
          </div>
        )}
      </div>
    </section>
  );
}

function levelClassName(level: Incident['events'][number]['level']) {
  switch (level) {
    case 'success':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
    case 'warning':
      return 'border-orange-500/20 bg-orange-500/10 text-orange-300';
    case 'error':
      return 'border-red-500/20 bg-red-500/10 text-red-300';
    default:
      return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

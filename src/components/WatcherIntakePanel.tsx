"use client";

import type { WatcherCapture } from '@/lib/types';

interface WatcherIntakePanelProps {
  capture: WatcherCapture | null;
  queueCount: number;
  watchDir: string | null;
  isBusy: boolean;
  onContinue: () => void;
  onOpenViewer: () => void;
  onDismiss: () => void;
}

export default function WatcherIntakePanel({
  capture,
  queueCount,
  watchDir,
  isBusy,
  onContinue,
  onOpenViewer,
  onDismiss,
}: WatcherIntakePanelProps) {
  if (!capture) {
    return (
      <section className="room-panel room-accent-grid rounded-[24px] p-4 text-left overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-mono-technical text-xs font-semibold uppercase tracking-wider text-white">Auto Intake</h2>
            <p className="mt-1 text-[10px] leading-5 text-white/50 font-mono-console">
              No pending screenshots in the watcher queue. Run the local watcher and new captures will appear here.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 font-mono-console text-[9px] uppercase tracking-wider text-white/45">
            standby
          </span>
        </div>
        <div className="room-subpanel mt-3 rounded-2xl p-3 font-mono-console text-[10px] leading-5 text-white/45">
          Watching: {watchDir ?? 'not configured'}
        </div>
      </section>
    );
  }

  return (
    <section className="room-panel room-accent-grid rounded-[24px] p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-biolum overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1EF7C1] animate-pulse" />
            <h2 className="font-mono-technical text-xs font-semibold uppercase tracking-wider text-white">Auto Intake</h2>
          </div>
          <p className="mt-1 text-[10px] leading-5 text-white/55 font-mono-console">
            A fresh screenshot landed in the room queue. Continue with BugRoom and the organization will take over, or open it in your default viewer.
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 font-mono-console text-[9px] uppercase tracking-wider text-cyan-300">
          {queueCount} queued
        </span>
      </div>

      <div className="room-subpanel mt-4 rounded-2xl p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono-technical text-sm text-white">{capture.fileName}</p>
            <p className="mt-1 text-[10px] font-mono-console text-white/45">{watchDir}</p>
          </div>
          <div className="text-right font-mono-console text-[10px] text-white/45">
            <p>{formatSize(capture.sizeBytes)}</p>
            <p className="mt-1">{formatTime(capture.detectedAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={onContinue}
          className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5 font-mono-technical text-[11px] font-semibold uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue in BugRoom
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onOpenViewer}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono-technical text-[11px] font-semibold uppercase tracking-wide text-white/80 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Open in Viewer
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={onDismiss}
          className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 font-mono-technical text-[11px] font-semibold uppercase tracking-wide text-white/55 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

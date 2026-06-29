"use client";

import React, { ChangeEvent, DragEvent } from "react";

interface UploadPanelProps {
  previewSrc?: string;
  previewAlt: string;
  previewName: string;
  isDragOver: boolean;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function UploadPanel({
  previewSrc,
  previewAlt,
  previewName,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onClear,
}: UploadPanelProps) {
  return (
    <section className="room-panel room-accent-grid rounded-[24px] p-4 text-left overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-mono-technical text-xs font-semibold text-white uppercase tracking-wider">Telemetry Capture</h2>
          <p className="mt-1 text-[10px] text-[#C1C1C1]/60 font-mono-console">PNG, JPG, or WEBP. Demo presets run against real screenshots now.</p>
        </div>
        {previewSrc ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/70 transition hover:border-red-500/40 hover:text-red-400 cursor-pointer"
          >
            Clear
          </button>
        ) : null}
      </div>

      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed p-4 text-center transition-all duration-300 ${
          isDragOver
            ? "border-cyan-400/60 bg-cyan-400/8"
            : "room-subpanel hover:border-cyan-400/30 hover:bg-white/[0.03]"
        }`}
      >
        <input className="sr-only" type="file" accept="image/*" onChange={onFileChange} />

        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt={previewAlt} className="max-h-[320px] w-full rounded-[16px] border border-white/10 object-contain shadow-[0_24px_60px_rgba(0,0,0,0.35)]" />
        ) : (
          <div className="flex max-w-[240px] flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-lg text-[#1EF7C1]">
              ⇪
            </div>
            <div>
              <p className="font-mono-technical text-xs font-medium text-white uppercase tracking-wider">Drag Screenshot Here</p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-[#C1C1C1]/60 font-mono-console">or click to browse {previewName !== "No screenshot selected" ? `(${previewName})` : "filesystem"}</p>
            </div>
          </div>
        )}
      </label>

      <p className="mt-3 text-[10px] leading-relaxed text-[#C1C1C1]/45 font-mono-console">
        {previewSrc ? `Active source: ${previewName}` : 'No screenshot armed. Upload your own image or launch one of the real demo presets below.'}
      </p>
    </section>
  );
}

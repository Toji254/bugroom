"use client";

const nodes = [
  { label: 'Capture', top: '22%', left: '24%', tone: 'cyan' },
  { label: 'OCR', top: '36%', left: '66%', tone: 'steel' },
  { label: 'Swarm', top: '56%', left: '30%', tone: 'amber' },
  { label: 'Fix', top: '68%', left: '72%', tone: 'cyan' },
] as const;

export default function IncidentPulseSculpture() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(65,173,194,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(246,151,86,0.14),transparent_24%),linear-gradient(180deg,rgba(15,28,40,0.96),rgba(8,16,25,0.92))] p-4 shadow-[0_24px_70px_rgba(3,8,15,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_26%,transparent_72%,rgba(255,255,255,0.03))]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono-technical text-[10px] uppercase tracking-[0.28em] text-white/45">Signal sculpture</p>
          <h3 className="mt-2 font-mono-technical text-base text-white">Incident pulse lattice</h3>
          <p className="mt-1 max-w-[18rem] text-[10px] leading-5 text-white/55 font-mono-console">
            A live orbital map for how a screenshot becomes evidence, swarm activity, and operator action.
          </p>
        </div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono-console text-[9px] uppercase tracking-widest text-cyan-200">
          live surface
        </div>
      </div>

      <div className="relative mt-4 h-[220px] rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(95,160,189,0.08),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
        <div className="absolute inset-5 rounded-full border border-white/6" />
        <div className="absolute inset-11 rounded-full border border-white/6" />
        <div className="absolute inset-16 rounded-full border border-cyan-300/10" />
        <div className="absolute left-1/2 top-1/2 h-[1px] w-[78%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[78%] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25 bg-[radial-gradient(circle,rgba(86,191,205,0.32),rgba(34,86,102,0.08)_55%,transparent_70%)] shadow-[0_0_55px_rgba(75,176,192,0.18)] animate-[pulse_5s_ease-in-out_infinite]" />
        <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.4)]" />

        <div className="absolute left-1/2 top-1/2 h-[126px] w-[126px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-amber-300/20 animate-[spin_22s_linear_infinite]" />
        <div className="absolute left-1/2 top-1/2 h-[170px] w-[170px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/20 animate-[spin_30s_linear_infinite_reverse]" />

        {nodes.map((node) => (
          <div
            key={node.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: node.top, left: node.left }}
          >
            <div
              className={`h-3 w-3 rounded-full border ${
                node.tone === 'amber'
                  ? 'border-amber-300/70 bg-amber-300 shadow-[0_0_18px_rgba(246,151,86,0.4)]'
                  : node.tone === 'steel'
                    ? 'border-white/40 bg-slate-300 shadow-[0_0_16px_rgba(198,210,224,0.28)]'
                    : 'border-cyan-200/70 bg-cyan-200 shadow-[0_0_18px_rgba(103,221,235,0.4)]'
              }`}
            />
            <div className="mt-2 -ml-4 rounded-full border border-white/8 bg-[#0b1722]/90 px-2 py-1 font-mono-console text-[9px] uppercase tracking-wider text-white/65">
              {node.label}
            </div>
          </div>
        ))}

        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M24 22 C36 30, 42 36, 50 50" stroke="rgba(103,221,235,0.28)" strokeWidth="0.5" fill="none" />
          <path d="M66 36 C60 44, 57 46, 50 50" stroke="rgba(198,210,224,0.22)" strokeWidth="0.5" fill="none" />
          <path d="M30 56 C38 56, 44 54, 50 50" stroke="rgba(246,151,86,0.26)" strokeWidth="0.5" fill="none" />
          <path d="M72 68 C62 62, 57 56, 50 50" stroke="rgba(103,221,235,0.28)" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <SignalPill label="Evidence linked" value="4 nodes" tone="cyan" />
        <SignalPill label="Room state" value="Operator-led" tone="steel" />
        <SignalPill label="Output" value="Next action" tone="amber" />
      </div>
    </div>
  );
}

function SignalPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'steel';
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-300/15 bg-amber-300/10 text-amber-100'
      : tone === 'steel'
        ? 'border-white/10 bg-white/[0.04] text-white/80'
        : 'border-cyan-300/15 bg-cyan-300/10 text-cyan-100';

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <p className="font-mono-console text-[8px] uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className="mt-1 font-mono-technical text-[11px]">{value}</p>
    </div>
  );
}

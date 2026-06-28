"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";
import { AGENT_DEFINITIONS, type AgentFinding, type AnalysisResult } from "@/lib/types";
import { DEMO_PRESETS } from "@/lib/presets";

type AgentStatus = "idle" | "thinking" | "complete" | "error";

const RAIN_COLUMNS = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 4.73 + 3) % 100}%`,
  speed: `${7 + (index % 7) * 1.1}s`,
  delay: `${-(index % 9) * 0.65}s`,
}));

const AGENT_META: Record<string, { icon: string; role: string; color: string }> = {
  vision: { icon: "◈", role: "Screen OCR + UI Context", color: "#29ffd2" },
  debug: { icon: "⌁", role: "Root-Cause Trace", color: "#c9ff62" },
  ux: { icon: "◎", role: "Experience Risk", color: "#7dd3fc" },
  fix: { icon: "✦", role: "Consensus + Action", color: "#ff9a4b" },
};

export default function Home() {
  const [prompt, setPrompt] = useState("What is wrong with this screen, what is the root cause, and what should I do next?");
  const [imageDataUri, setImageDataUri] = useState<string | undefined>();
  const [previewName, setPreviewName] = useState("No screenshot selected");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [clientElapsedMs, setClientElapsedMs] = useState<number | null>(null);

  const findingsByAgent = useMemo(() => {
    const map = new Map<string, AgentFinding>();
    result?.agents.forEach((agent) => map.set(agent.agentId, agent));
    return map;
  }, [result]);

  async function setImageFromFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a screenshot image file.");
      return;
    }
    const dataUri = await fileToDataUri(file);
    setImageDataUri(dataUri);
    setPreviewName(file.name);
    setResult(null);
    setError(null);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    await setImageFromFile(event.target.files?.[0]);
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOver(false);
    await setImageFromFile(event.dataTransfer.files?.[0]);
  }

  async function runAnalysis(nextPrompt = prompt, nextImageDataUri = imageDataUri) {
    setError(null);
    setIsAnalyzing(true);
    setResult(null);
    setClientElapsedMs(null);
    const started = performance.now();

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: nextPrompt, imageDataUri: nextImageDataUri }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
      setClientElapsedMs(Math.round(performance.now() - started));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function runPresetDemo(presetId: string) {
    const preset = DEMO_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setPrompt(preset.prompt);
    setPreviewName(`${preset.title} demo scenario`);
    setImageDataUri(undefined);
    await runAnalysis(preset.prompt, undefined);
  }

  const speedMs = result?.timing.elapsedMs ?? clientElapsedMs ?? undefined;
  const completedCount = result?.agents.length ?? 0;

  return (
    <main className="bugroom-shell min-h-screen px-4 pb-10 pt-24 text-[var(--bugroom-text)] sm:px-6 lg:px-10">
      <SignalRain />
      <TopNav elapsedMs={speedMs} isAnalyzing={isAnalyzing} />

      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="room-panel-strong scan-sweep rounded-[24px] p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${isAnalyzing ? "bg-[var(--bugroom-ember)]" : "bg-[var(--bugroom-cyan)]"}`} />
                <span className="terminal-label text-[var(--bugroom-muted)]">
                  {isAnalyzing ? "Analysis in progress" : "Live incident room"}
                </span>
              </div>
              <h1 className="mono-copy text-4xl font-medium tracking-[-0.07em] text-white sm:text-6xl">
                BugRoom
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--bugroom-muted)] sm:text-lg">
                A noir AI incident room for your screen. Drop in a screenshot and Gemma 4 on Cerebras turns four specialist agents into one clean diagnosis.
              </p>
            </div>
            <SpeedBadge elapsedMs={speedMs} model={result?.timing.model ?? "gemma-4-31b"} tokensPerSecond={result?.timing.outputTokensPerSecond} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)] xl:grid-cols-[470px_minmax(0,1fr)]">
          <section className="flex flex-col gap-4">
            <UploadPanel
              imageDataUri={imageDataUri}
              previewName={previewName}
              isDragOver={isDragOver}
              onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              onClear={() => { setImageDataUri(undefined); setPreviewName("No screenshot selected"); }}
            />

            <section className="room-panel rounded-[var(--radius-panel)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="mono-copy text-sm font-medium text-white">Ask the swarm</h2>
                  <p className="mt-1 text-xs text-[var(--bugroom-muted)]">The backend sends this to `/api/analyze` server-side.</p>
                </div>
                <span className="ember-pill rounded-full px-2.5 py-1 text-[10px] terminal-label">real api</span>
              </div>
              <label className="sr-only" htmlFor="prompt">Question for BugRoom</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white placeholder:text-white/25 outline-none transition focus:border-[var(--bugroom-cyan)]"
                placeholder="What is wrong with this screen?"
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => runAnalysis()}
                  disabled={isAnalyzing}
                  className="rounded-2xl border border-[rgba(41,255,210,0.35)] bg-[rgba(41,255,210,0.12)] px-4 py-3 text-sm font-bold text-[var(--bugroom-cyan)] transition hover:bg-[rgba(41,255,210,0.19)] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isAnalyzing ? "Agents analyzing…" : "Analyze with Gemma 4"}
                </button>
                <button
                  type="button"
                  onClick={() => runPresetDemo("vite-error")}
                  disabled={isAnalyzing}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white transition hover:border-[rgba(255,154,75,0.34)] hover:bg-[rgba(255,154,75,0.08)] disabled:opacity-55"
                >
                  Run 60-sec demo
                </button>
              </div>
            </section>

            <section className="room-panel rounded-[var(--radius-panel)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="mono-copy text-sm font-medium text-white">Demo scenarios</h2>
                <span className="terminal-label text-[var(--bugroom-muted)]">{DEMO_PRESETS.length} presets</span>
              </div>
              <div className="grid gap-2">
                {DEMO_PRESETS.map((preset, index) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => runPresetDemo(preset.id)}
                    disabled={isAnalyzing}
                    className="group rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-[rgba(41,255,210,0.28)] hover:bg-[rgba(41,255,210,0.055)] disabled:opacity-55"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mono-copy mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[rgba(41,255,210,0.20)] bg-[rgba(41,255,210,0.07)] text-xs text-[var(--bugroom-cyan)]">0{index + 1}</span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{preset.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--bugroom-muted)]">{preset.description}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </section>

          <section className="space-y-6">
            <StatusStrip isAnalyzing={isAnalyzing} completedCount={completedCount} elapsedMs={speedMs} result={result} />

            <section className="grid gap-4 md:grid-cols-2" aria-busy={isAnalyzing} aria-label="BugRoom agent findings">
              {AGENT_DEFINITIONS.map((agent, index) => {
                const finding = findingsByAgent.get(agent.id);
                const status: AgentStatus = error ? "error" : isAnalyzing ? "thinking" : finding ? "complete" : "idle";
                return <AgentCard key={agent.id} index={index} name={agent.name} agentId={agent.id} status={status} finding={finding} />;
              })}
            </section>

            <DiagnosisPanel result={result} error={error} isAnalyzing={isAnalyzing} />
          </section>
        </div>
      </section>
    </main>
  );
}

function SignalRain() {
  return <div className="signal-rain" aria-hidden="true">{RAIN_COLUMNS.map((column, index) => <span key={index} style={{ left: column.left, "--speed": column.speed, "--delay": column.delay } as React.CSSProperties} />)}</div>;
}

function TopNav({ elapsedMs, isAnalyzing }: { elapsedMs?: number; isAnalyzing: boolean }) {
  return (
    <nav className="room-nav fixed left-1/2 top-4 z-50 flex h-14 w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 items-center justify-between rounded-full px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(41,255,210,0.28)] bg-[rgba(41,255,210,0.09)] text-[var(--bugroom-cyan)]">✹</div>
        <div className="leading-none">
          <p className="mono-copy text-sm font-semibold tracking-[-0.04em] text-white">BugRoom</p>
          <p className="mt-1 hidden text-[10px] text-[var(--bugroom-muted)] sm:block">Gemma 4 incident swarm</p>
        </div>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-[rgba(41,255,210,0.12)] bg-[rgba(41,255,210,0.045)] px-3 py-1.5 sm:flex">
        <span className={`h-1.5 w-1.5 rounded-full ${isAnalyzing ? "bg-[var(--bugroom-ember)]" : "bg-[var(--bugroom-cyan)]"}`} />
        <span className="mono-copy text-[11px] text-[var(--bugroom-cyan)]">{isAnalyzing ? "agents active" : "backend armed"}</span>
      </div>
      <div className="mono-copy rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-white/80">{elapsedMs ? `${elapsedMs}ms` : "ready"}</div>
    </nav>
  );
}

function UploadPanel(props: {
  imageDataUri?: string;
  previewName: string;
  isDragOver: boolean;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <section className="room-panel rounded-[var(--radius-panel)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="mono-copy text-sm font-medium text-white">Screen capture</h2>
          <p className="mt-1 text-xs text-[var(--bugroom-muted)]">PNG, JPG, or WebP. Converted to Base64 locally.</p>
        </div>
        {props.imageDataUri ? <button type="button" onClick={props.onClear} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-[rgba(255,79,114,0.45)] hover:text-white">Clear</button> : null}
      </div>
      <label
        onDragOver={props.onDragOver}
        onDragLeave={props.onDragLeave}
        onDrop={props.onDrop}
        className={`demo-image-frame flex min-h-[280px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-4 text-center transition ${props.isDragOver ? "border-[rgba(41,255,210,0.7)] bg-[rgba(41,255,210,0.06)]" : "border-white/15 hover:border-[rgba(41,255,210,0.38)]"}`}
      >
        <input className="sr-only" type="file" accept="image/*" onChange={props.onFileChange} />
        {props.imageDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.imageDataUri} alt="Uploaded screenshot preview" className="max-h-[330px] w-full object-contain" />
        ) : (
          <div className="flex max-w-xs flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(41,255,210,0.24)] bg-[rgba(41,255,210,0.08)] text-2xl text-[var(--bugroom-cyan)]">⇪</div>
            <div>
              <p className="mono-copy text-sm font-medium text-white">Drop a screenshot here</p>
              <p className="mt-2 text-xs leading-5 text-[var(--bugroom-muted)]">or click to browse. {props.previewName}</p>
            </div>
          </div>
        )}
      </label>
    </section>
  );
}

function StatusStrip({ isAnalyzing, completedCount, elapsedMs, result }: { isAnalyzing: boolean; completedCount: number; elapsedMs?: number; result: AnalysisResult | null }) {
  return (
    <section className="room-panel rounded-[var(--radius-panel)] p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="state" value={isAnalyzing ? "ANALYZING" : result ? "CONSENSUS" : "STANDBY"} accent={isAnalyzing ? "ember" : "cyan"} />
        <Metric label="agents" value={`${completedCount}/4`} />
        <Metric label="latency" value={elapsedMs ? `${elapsedMs}ms` : "—"} />
        <Metric label="model" value={result?.timing.model ?? "gemma-4-31b"} />
      </div>
    </section>
  );
}

function Metric({ label, value, accent = "cyan" }: { label: string; value: string; accent?: "cyan" | "ember" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="terminal-label text-[var(--bugroom-muted)]">{label}</p>
      <p className={`mono-copy mt-2 truncate text-sm font-semibold ${accent === "ember" ? "text-[var(--bugroom-ember)]" : "text-[var(--bugroom-cyan)]"}`}>{value}</p>
    </div>
  );
}

function AgentCard({ name, agentId, status, finding, index }: { name: string; agentId: string; status: AgentStatus; finding?: AgentFinding; index: number }) {
  const meta = AGENT_META[agentId] ?? AGENT_META.vision;
  const label = status === "thinking" ? "ANALYZING" : status === "complete" ? "COMPLETE" : status === "error" ? "ERROR" : "IDLE";
  return (
    <article className={`room-panel rounded-[var(--radius-panel)] p-4 transition ${status === "thinking" ? "agent-thinking" : ""}`} style={{ animationDelay: `${index * 0.18}s` }}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-lg" style={{ borderColor: `${meta.color}4d`, background: `${meta.color}14`, color: meta.color }}>{meta.icon}</div>
          <div>
            <h3 className="mono-copy text-sm font-medium text-white">{name}</h3>
            <p className="mt-1 text-xs text-[var(--bugroom-muted)]">{meta.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: status === "idle" ? "rgba(255,255,255,0.22)" : meta.color, boxShadow: status === "idle" ? "none" : `0 0 10px ${meta.color}` }} />
          <span className="terminal-label text-[10px]" style={{ color: status === "idle" ? "var(--bugroom-muted)" : meta.color }}>{label}</span>
        </div>
      </div>
      {finding ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-5 text-white">{finding.headline}</p>
            <span className="mono-copy shrink-0 text-xs text-[var(--bugroom-lime)]">{Math.round(finding.confidence * 100)}%</span>
          </div>
          <p className="text-sm leading-6 text-[var(--bugroom-muted)]">{finding.details}</p>
        </div>
      ) : (
        <p className={`text-sm leading-6 text-[var(--bugroom-muted)] ${status === "thinking" ? "cursor-blink" : ""}`}>{status === "thinking" ? "Inspecting screen context and waiting for consensus" : "Waiting for incident input."}</p>
      )}
    </article>
  );
}

function DiagnosisPanel({ result, error, isAnalyzing }: { result: AnalysisResult | null; error: string | null; isAnalyzing: boolean }) {
  return (
    <section className="room-panel-strong rounded-[24px] p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="mono-copy text-xl font-medium tracking-[-0.04em] text-white">Final diagnosis</h2>
          <p className="mt-1 text-sm text-[var(--bugroom-muted)]">Consensus output and exportable incident report.</p>
        </div>
        {result ? <span className="neon-pill rounded-full px-3 py-1.5 text-[10px] terminal-label">report ready</span> : null}
      </div>

      {error ? <p className="rounded-2xl border border-[rgba(255,79,114,0.35)] bg-[rgba(255,79,114,0.09)] p-4 text-sm leading-6 text-rose-100">{error}</p> : null}
      {!result && !error ? <p className={`rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[var(--bugroom-muted)] ${isAnalyzing ? "cursor-blink" : ""}`}>{isAnalyzing ? "Agents are debating the screen context" : "Run a demo or upload a screenshot. The diagnosis will lock in here."}</p> : null}

      {result ? (
        <div className="space-y-5">
          <section>
            <p className="terminal-label text-[var(--bugroom-muted)]">summary</p>
            <p className="mt-2 text-lg font-semibold leading-7 text-white">{result.summary}</p>
          </section>
          <section>
            <p className="terminal-label text-[var(--bugroom-muted)]">root cause</p>
            <p className="mt-2 text-sm leading-6 text-[var(--bugroom-muted)]">{result.rootCause}</p>
          </section>
          <section>
            <p className="terminal-label text-[var(--bugroom-muted)]">suggested fix</p>
            <pre className="mono-copy mt-2 overflow-auto rounded-2xl border border-[rgba(41,255,210,0.14)] bg-black/45 p-4 text-xs leading-5 text-[var(--bugroom-cyan)]">{result.suggestedFix}</pre>
          </section>
          <section>
            <p className="terminal-label text-[var(--bugroom-muted)]">next steps</p>
            <ol className="mt-2 space-y-2">
              {result.nextSteps.map((step, index) => <li className="flex gap-3 text-sm leading-6 text-white/82" key={step}><span className="mono-copy text-[var(--bugroom-cyan)]">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
            </ol>
          </section>
          <ReportPanel markdown={result.reportMarkdown} />
        </div>
      ) : null}
    </section>
  );
}

function SpeedBadge({ elapsedMs, model, tokensPerSecond }: { elapsedMs?: number; model: string; tokensPerSecond?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-[rgba(41,255,210,0.22)] bg-[rgba(41,255,210,0.07)] px-4 py-3 text-sm text-[var(--bugroom-cyan)]">
      <span className="mono-copy font-semibold">Cerebras speed</span>
      <span className="text-white/70">{elapsedMs ? `${elapsedMs}ms` : "ready"}</span>
      <span className="text-white/70">{model}</span>
      {tokensPerSecond ? <span className="text-white/70">{Math.round(tokensPerSecond)} tok/s</span> : null}
    </div>
  );
}

function ReportPanel({ markdown }: { markdown: string }) {
  async function copyReport() {
    await navigator.clipboard.writeText(markdown);
  }

  function downloadReport() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bugroom-incident-report.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="mono-copy text-sm font-medium text-white">Incident report</p>
        <div className="flex gap-2">
          <button type="button" onClick={copyReport} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-[rgba(41,255,210,0.32)]">Copy</button>
          <button type="button" onClick={downloadReport} className="rounded-xl border border-[rgba(201,255,98,0.28)] bg-[rgba(201,255,98,0.12)] px-3 py-2 text-xs font-bold text-[var(--bugroom-lime)] transition hover:bg-[rgba(201,255,98,0.18)]">Download .md</button>
        </div>
      </div>
      <pre className="mono-copy max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-black/45 p-4 text-xs leading-5 text-white/65">{markdown}</pre>
    </section>
  );
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read screenshot"));
    reader.readAsDataURL(file);
  });
}

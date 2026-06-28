"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { AGENT_DEFINITIONS, type AgentFinding, type AnalysisResult } from "@/lib/types";
import { DEMO_PRESETS } from "@/lib/presets";

type AgentStatus = "idle" | "thinking" | "complete" | "error";

export default function Home() {
  const [prompt, setPrompt] = useState("What is wrong with this screen, what is the root cause, and what should I do next?");
  const [imageDataUri, setImageDataUri] = useState<string | undefined>();
  const [previewName, setPreviewName] = useState<string>("No screenshot selected");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [clientElapsedMs, setClientElapsedMs] = useState<number | null>(null);

  const findingsByAgent = useMemo(() => {
    const map = new Map<string, AgentFinding>();
    result?.agents.forEach((agent) => map.set(agent.agentId, agent));
    return map;
  }, [result]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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

  return (
    <main className="signal-grid min-h-screen px-5 py-6 text-slate-100 sm:px-8 lg:px-12">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="glass-card overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                Cerebras x Google Gemma 4 Hackathon
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
                BugRoom
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                A real-time AI incident room for your screen. Upload a screenshot or run the judge demo, then Gemma 4 on Cerebras returns a visible multi-agent diagnosis and exportable report.
              </p>
            </div>
            <SpeedBadge
              elapsedMs={speedMs}
              model={result?.timing.model ?? "gemma-4-31b"}
              tokensPerSecond={result?.timing.outputTokensPerSecond}
            />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Screen input</h2>
                <p className="mt-1 text-sm text-slate-400">Send a Base64 screenshot to Gemma 4 or run a demo-safe scenario.</p>
              </div>
              <span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-semibold text-lime-200">Live backend ready</span>
            </div>

            <label className="block rounded-2xl border border-dashed border-cyan-300/40 bg-cyan-300/5 p-5 text-center transition hover:border-cyan-200">
              <input className="sr-only" type="file" accept="image/*" onChange={handleFileChange} />
              <span className="block text-sm font-semibold text-cyan-100">Upload screenshot</span>
              <span className="mt-1 block text-xs text-slate-400">PNG, JPG, or WebP. Hosted image URLs are not used.</span>
            </label>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {imageDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageDataUri} alt="Uploaded screenshot preview" className="max-h-64 w-full object-contain" />
              ) : (
                <div className="flex h-48 items-center justify-center px-6 text-center text-sm text-slate-500">
                  {previewName}
                </div>
              )}
            </div>

            <label className="mt-5 block text-sm font-semibold text-slate-200" htmlFor="prompt">
              Question for the incident swarm
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-6 text-white outline-none ring-cyan-300/30 transition focus:ring-4"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => runAnalysis()}
                disabled={isAnalyzing}
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? "Agents analyzing..." : "Analyze with Gemma 4"}
              </button>
              <button
                type="button"
                onClick={() => runPresetDemo("vite-error")}
                disabled={isAnalyzing}
                className="rounded-2xl border border-lime-300/30 px-5 py-3 text-sm font-bold text-lime-100 transition hover:bg-lime-300/10 disabled:opacity-60"
              >
                Run 60-second demo
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => runPresetDemo(preset.id)}
                  disabled={isAnalyzing}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/5 disabled:opacity-60"
                >
                  <span className="block font-semibold text-white">{preset.title}</span>
                  <span className="mt-1 block text-sm text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {AGENT_DEFINITIONS.map((agent) => {
                const finding = findingsByAgent.get(agent.id);
                const status: AgentStatus = error ? "error" : isAnalyzing ? "thinking" : finding ? "complete" : "idle";
                return <AgentCard key={agent.id} name={agent.name} status={status} finding={finding} />;
              })}
            </div>

            <section className="glass-card rounded-3xl p-5 sm:p-6">
              <h2 className="text-xl font-bold text-white">Final diagnosis</h2>
              {error ? <p className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">{error}</p> : null}
              {!result && !error ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">Run the demo or upload a screenshot. The final report will appear here.</p>
              ) : null}
              {result ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Summary</p>
                    <p className="mt-1 text-lg font-semibold text-white">{result.summary}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Root cause</p>
                    <p className="mt-1 text-slate-300">{result.rootCause}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Suggested fix</p>
                    <pre className="mt-2 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-cyan-100">{result.suggestedFix}</pre>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Next steps</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {result.nextSteps.map((step) => <li key={step}>{step}</li>)}
                    </ul>
                  </div>
                  <ReportPanel markdown={result.reportMarkdown} />
                </div>
              ) : null}
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

function AgentCard({ name, status, finding }: { name: string; status: AgentStatus; finding?: AgentFinding }) {
  const label = status === "thinking" ? "Analyzing" : status === "complete" ? "Complete" : status === "error" ? "Error" : "Standby";
  return (
    <article className="glass-card rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-bold text-white">{name}</h3>
        <span className="rounded-full border border-cyan-300/30 px-2 py-1 text-[11px] uppercase tracking-wide text-cyan-100">{label}</span>
      </div>
      {finding ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-white">{finding.headline}</p>
            <span className="text-xs font-bold text-lime-200">{Math.round(finding.confidence * 100)}%</span>
          </div>
          <p className="text-sm leading-6 text-slate-300">{finding.details}</p>
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">{status === "thinking" ? "Reading the incident context..." : "Waiting for screen context."}</p>
      )}
    </article>
  );
}

function SpeedBadge({ elapsedMs, model, tokensPerSecond }: { elapsedMs?: number; model: string; tokensPerSecond?: number }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-3 text-sm text-lime-100">
      <span className="font-black">Cerebras speed</span>
      <span>{elapsedMs ? `${elapsedMs}ms` : "ready"}</span>
      <span>{model}</span>
      {tokensPerSecond ? <span>{Math.round(tokensPerSecond)} tok/s</span> : null}
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-white">Exportable incident report</p>
        <div className="flex gap-2">
          <button type="button" onClick={copyReport} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10">Copy</button>
          <button type="button" onClick={downloadReport} className="rounded-xl bg-lime-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-lime-200">Download .md</button>
        </div>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-xs leading-5 text-slate-300">{markdown}</pre>
    </div>
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

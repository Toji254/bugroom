"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from 'react';
import Script from 'next/script';
import Link from 'next/link';

import {
  AGENT_DEFINITIONS,
  DEFAULT_INCIDENT_SETTINGS,
  type CreateIncidentResponse,
  type Incident,
  type IncidentSettings,
  type WatcherCapture,
  type AgentRun,
} from '@/lib/types';
import { DEMO_PRESETS } from '@/lib/presets';
import FlashOverlay from '@/components/FlashOverlay';
import ReportModal from '@/components/ReportModal';
import SpeedBadge from '@/components/SpeedBadge';
import UploadPanel from '@/components/UploadPanel';
import DemoPresetCard from '@/components/DemoPresetCard';
import SwarmTimeline from '@/components/SwarmTimeline';
import PlaybookPanel from '@/components/PlaybookPanel';
import ConsensusPanel from '@/components/ConsensusPanel';
import AnalysisReportView from '@/components/AnalysisReportView';
import WatcherIntakePanel from '@/components/WatcherIntakePanel';
import AsciiMoonCanvas from '@/components/AsciiMoonCanvas';
import SwarmVisualizer from '@/components/SwarmVisualizer';

import {
  siteConfig,
  navigationConfig,
  heroConfig,
  manifestoConfig,
  facilitiesConfig,
  observationConfig,
  archivesConfig,
  footerConfig,
} from '@/config';

const DEFAULT_PROMPT = 'What is wrong with this screen, what is the root cause, and what should I do next?';

type WatcherState = {
  watchDir: string | null;
  captures: WatcherCapture[];
};

// Analog clock helper component - updated to support dark mode with white stroke
function AnalogClock({ utcOffset = 0, theme = 'dark' }: { utcOffset?: number; theme?: 'dark' | 'light' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 48;
    canvas.width = size * 2;
    canvas.height = size * 2;

    const strokeColor = theme === 'dark' ? '#ffffff' : '#000000';
    const tickColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

    const draw = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const localTime = new Date(utc + utcOffset * 3600000);

      ctx.clearRect(0, 0, size * 2, size * 2);
      ctx.save();
      ctx.translate(size, size);
      ctx.scale(2, 2);

      // Outer dial
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hour ticks
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const inner = 18;
        const outer = 21;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.strokeStyle = tickColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Hour hand
      const hr = localTime.getHours() % 12;
      const hrAngle = ((hr + localTime.getMinutes() / 60) * Math.PI) / 6 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(hrAngle) * 11, Math.sin(hrAngle) * 11);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Minute hand
      const minAngle = ((localTime.getMinutes() + localTime.getSeconds() / 60) * Math.PI) / 30 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(minAngle) * 15, Math.sin(minAngle) * 15);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Second hand
      const secAngle = (localTime.getSeconds() * Math.PI) / 30 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(secAngle) * 17, Math.sin(secAngle) * 17);
      ctx.strokeStyle = theme === 'dark' ? '#1EF7C1' : '#e88d39'; // neon accent
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [utcOffset, theme]);

  return <canvas ref={canvasRef} style={{ width: '48px', height: '48px', marginBottom: '16px' }} />;
}

// FacilityAgentRun displays live Swarm status inside Facilities cards (Dark-themed)
function FacilityAgentRun({ run, children }: { run?: AgentRun; children: AgentRun[] }) {
  if (!run) {
    return (
      <div style={{ marginTop: 'auto', marginBottom: '24px', fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.36)' }}>Status: queued</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 'auto', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', background: 'rgba(255,255,255,0.02)', fontFamily: "var(--font-ibm-plex-mono), monospace", color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{
          fontSize: '9px',
          textTransform: 'uppercase',
          border: '1px solid #1EF7C1',
          padding: '2px 8px',
          borderRadius: '12px',
          fontWeight: 500,
          background: run.status === 'running' ? '#1EF7C1' : 'transparent',
          color: run.status === 'running' ? '#000' : '#1EF7C1',
        }}>
          {run.status}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1EF7C1' }}>
          {run.confidence !== undefined ? `${Math.round(run.confidence * 100)}%` : '—'}
        </span>
      </div>

      <p style={{ fontSize: '11px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px 0' }}>
        {run.summary ?? 'Waiting for dispatch...'}
      </p>

      {run.headline && (
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#fff', margin: '0 0 12px 0' }}>
          Finding: {run.headline}
        </p>
      )}

      {children.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
          <p style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
            Subagents ({children.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {children.map((child) => (
              <div key={child.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{child.displayName}</span>
                  <span style={{ color: '#2dd4bf' }}>{child.status}</span>
                </div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {child.summary ?? child.goal}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [settings, setSettings] = useState<IncidentSettings>(DEFAULT_INCIDENT_SETTINGS);
  const [imageDataUri, setImageDataUri] = useState<string | undefined>();
  const [previewName, setPreviewName] = useState('No screenshot selected');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'report'>('console');
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [flashOrigin, setFlashOrigin] = useState({ x: 0.5, y: 0.5 });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [watcher, setWatcher] = useState<WatcherState>({ watchDir: null, captures: [] });

  // GSAP Scripts Dynamic Loading State
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [scrollTriggerLoaded, setScrollTriggerLoaded] = useState(false);

  // Live monitor drift state
  const [coords, setCoords] = useState({
    lat: observationConfig.initialLat,
    lon: observationConfig.initialLon,
  });

  const result = incident?.result ?? null;
  const activePreset = useMemo(
    () => DEMO_PRESETS.find((preset) => preset.id === activePresetId) ?? null,
    [activePresetId],
  );
  const previewSrc = imageDataUri ?? activePreset?.imagePath;
  const previewAlt = activePreset ? `${activePreset.title} demo scenario screenshot` : 'Uploaded screenshot preview';
  const pendingCapture = useMemo(
    () => watcher.captures.find((capture) => capture.status === 'pending') ?? null,
    [watcher.captures],
  );
  const pendingWatcherCount = useMemo(
    () => watcher.captures.filter((capture) => capture.status === 'pending').length,
    [watcher.captures],
  );

  const notes = heroConfig.supportingNotes.slice(0, 3);
  const vaultImages = archivesConfig.items;

  // GSAP Refs
  const manifestoSectionRef = useRef<HTMLElement>(null);
  const manifestoTextRef = useRef<HTMLParagraphElement>(null);
  const manifestoVideoRef = useRef<HTMLDivElement>(null);

  const facilitiesSectionRef = useRef<HTMLElement>(null);
  const facilitiesGridRef = useRef<HTMLDivElement>(null);

  const observationSectionRef = useRef<HTMLElement>(null);
  const observationVideoRef = useRef<HTMLDivElement>(null);

  const archivesWrapperRef = useRef<HTMLElement>(null);
  const archivesCarouselRef = useRef<HTMLDivElement>(null);
  const archivesPreviewRef = useRef<HTMLDivElement>(null);
  const archivesScrollTlRef = useRef<any>(null);
  const [vaultOpen, setVaultOpen] = useState(false);

  // Live coordinates generator loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCoords((prev) => ({
        lat: parseFloat((prev.lat + (Math.random() - 0.5) * 0.02).toFixed(2)),
        lon: parseFloat((prev.lon + (Math.random() - 0.5) * 0.03).toFixed(2)),
      }));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Sync coords initial value
  useEffect(() => {
    setCoords({
      lat: observationConfig.initialLat,
      lon: observationConfig.initialLon,
    });
  }, [observationConfig.initialLat, observationConfig.initialLon]);

  // Paste handler
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'));
      if (file) {
        event.preventDefault();
        await setImageFromFile(file);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Watcher refresher
  useEffect(() => {
    void refreshWatcher();
    const interval = window.setInterval(() => {
      void refreshWatcher();
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  // Cleanup eventsource
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  // Register GSAP ScrollTrigger once script is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gsap && (window as any).ScrollTrigger) {
      (window as any).gsap.registerPlugin((window as any).ScrollTrigger);
    }
  }, [gsapLoaded, scrollTriggerLoaded]);

  // Ported GSAP Animations for Manifesto
  useEffect(() => {
    if (!gsapLoaded || !scrollTriggerLoaded) return;
    if (!manifestoSectionRef.current || !manifestoTextRef.current || !manifestoVideoRef.current) return;

    const gsap = (window as any).gsap;
    
    const mCtx = gsap.context(() => {
      gsap.fromTo(
        manifestoVideoRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: manifestoSectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        manifestoTextRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: manifestoSectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, manifestoSectionRef);

    return () => mCtx.revert();
  }, [gsapLoaded, scrollTriggerLoaded]);

  // Ported GSAP Animations for Roster (Facilities)
  useEffect(() => {
    if (!gsapLoaded || !scrollTriggerLoaded) return;
    if (!facilitiesSectionRef.current || !facilitiesGridRef.current) return;

    const gsap = (window as any).gsap;
    const cols = facilitiesGridRef.current.children;

    const fCtx = gsap.context(() => {
      gsap.fromTo(
        Array.from(cols),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: facilitiesSectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, facilitiesSectionRef);

    return () => fCtx.revert();
  }, [gsapLoaded, scrollTriggerLoaded]);

  // Ported GSAP Animations for Live Observation Video
  useEffect(() => {
    if (!gsapLoaded || !scrollTriggerLoaded) return;
    if (!observationSectionRef.current || !observationVideoRef.current) return;

    const gsap = (window as any).gsap;

    const oCtx = gsap.context(() => {
      gsap.fromTo(
        observationVideoRef.current,
        { opacity: 0, scale: 0.97 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: observationSectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, observationSectionRef);

    return () => oCtx.revert();
  }, [gsapLoaded, scrollTriggerLoaded]);

  // GSAP 3D Archives Carousel setup
  const setupCarouselCells = useCallback(() => {
    if (!archivesCarouselRef.current) return;
    const cells = archivesCarouselRef.current.querySelectorAll<HTMLElement>(`.carousel__cell`);
    const count = cells.length;
    if (!count) return;
    const radius = 450;
    const angleStep = 360 / count;

    cells.forEach((cell, index) => {
      cell.style.transform = `rotateY(${index * angleStep}deg) translateZ(${radius}px)`;
    });
  }, []);

  const createScrollTimeline = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).gsap || !(window as any).ScrollTrigger) return;
    if (!archivesWrapperRef.current || !archivesCarouselRef.current) return;

    const gsap = (window as any).gsap;
    const carousel = archivesCarouselRef.current;
    const cards = carousel.querySelectorAll<HTMLElement>(`.carousel__cell img`);

    const tl = gsap.timeline({
      defaults: { ease: 'sine.inOut' },
      scrollTrigger: {
        trigger: archivesWrapperRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    tl.fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0);
    tl.fromTo(carousel, { rotationZ: 2, rotationX: 2 }, { rotationZ: -2, rotationX: -2 }, 0);
    tl.fromTo(cards, { filter: 'brightness(200%)' }, { filter: 'brightness(80%)', ease: 'power3' }, 0);
    tl.fromTo(cards, { rotationZ: 5 }, { rotationZ: -5, ease: 'none' }, 0);

    archivesScrollTlRef.current = tl;
  }, []);

  const burstGridIn = useCallback((items: NodeListOf<HTMLElement> | HTMLElement[]) => {
    if (typeof window === 'undefined' || !(window as any).gsap) return;
    const gsap = (window as any).gsap;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    Array.from(items).forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elX = rect.left + rect.width / 2;
      const elY = rect.top + rect.height / 2;
      const dx = centerX - elX;
      const dy = centerY - elY;
      const dist = Math.hypot(dx, dy);
      const delay = (dist / window.innerWidth) * 0.1;
      const isLeft = elX < centerX;

      gsap.fromTo(
        element,
        {
          autoAlpha: 0,
          y: dy * 0.4,
          scale: 0.6,
          rotationY: isLeft ? 80 : -80,
          z: -2000,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotationY: 0,
          z: 0,
          duration: 0.5,
          ease: 'power2.out',
          delay: delay + 0.05,
        }
      );
    });
  }, []);

  const activateVault = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).gsap) {
      // Fallback if GSAP is not loaded
      setVaultOpen(true);
      return;
    }
    if (!archivesCarouselRef.current || !archivesPreviewRef.current) return;

    const gsap = (window as any).gsap;
    const carousel = archivesCarouselRef.current;
    const cards = carousel.querySelectorAll<HTMLElement>(`.carousel__cell img`);
    const previewGridItems = archivesPreviewRef.current.querySelectorAll<HTMLElement>(`.grid__item`);

    if (archivesScrollTlRef.current) {
      archivesScrollTlRef.current.scrollTrigger?.kill();
      archivesScrollTlRef.current.kill();
    }

    setVaultOpen(true);

    const tl = gsap.timeline({
      defaults: { duration: 1.2, ease: 'power2.inOut' },
    });

    tl.to(carousel, { rotationX: 90, rotationY: -360, z: -1500 }, 0);
    tl.to(carousel, { duration: 2.0, ease: 'power3.inOut', z: 1200, rotationZ: 270 }, 0.5);
    tl.to(cards, { rotationZ: 0 }, 0);
    tl.add(() => {
      // Set grid items to visible before bursting
      previewGridItems.forEach(el => el.style.visibility = 'visible');
      burstGridIn(previewGridItems);
    }, '<+=1.5');
  }, [burstGridIn]);

  const closeVault = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).gsap) {
      setVaultOpen(false);
      return;
    }
    if (!archivesPreviewRef.current || !archivesCarouselRef.current) return;

    const gsap = (window as any).gsap;
    const previewGridItems = archivesPreviewRef.current.querySelectorAll<HTMLElement>(`.grid__item`);

    gsap.to(Array.from(previewGridItems), {
      autoAlpha: 0,
      scale: 0.8,
      z: -800,
      duration: 0.4,
      ease: 'power2.in',
      stagger: 0.02,
      onComplete: () => {
        setVaultOpen(false);

        gsap.set(archivesCarouselRef.current, {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          z: 0,
        });

        previewGridItems.forEach(el => el.style.visibility = 'hidden');

        createScrollTimeline();
      },
    });
  }, [createScrollTimeline]);

  useEffect(() => {
    if (gsapLoaded && scrollTriggerLoaded) {
      setupCarouselCells();
      createScrollTimeline();
    }

    return () => {
      if (archivesScrollTlRef.current) {
        archivesScrollTlRef.current.scrollTrigger?.kill();
        archivesScrollTlRef.current.kill();
      }
    };
  }, [gsapLoaded, scrollTriggerLoaded, setupCarouselCells, createScrollTimeline]);

  const eventSourceRef = useRef<EventSource | null>(null);

  const metrics = useMemo(() => {
    const runs = incident?.runs ?? [];
    const primaries = runs.filter((run) => run.kind === 'primary');
    const subagents = runs.filter((run) => run.kind === 'subagent');
    const integrated = subagents.filter((run) => run.status === 'integrated').length;
    const discarded = subagents.filter((run) => run.status === 'discarded').length;
    return {
      primaryCount: primaries.length,
      subagentCount: subagents.length,
      integrated,
      discarded,
    };
  }, [incident]);

  async function refreshWatcher() {
    try {
      const response = await fetch('/api/watcher', { cache: 'no-store' });
      const data = (await response.json()) as {
        watcher?: { watchDir: string };
        captures?: WatcherCapture[];
      };
      setWatcher({
        watchDir: data.watcher?.watchDir ?? null,
        captures: data.captures ?? [],
      });
    } catch {
      // silent poll failure
    }
  }

  async function setImageFromFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a screenshot image file.');
      return;
    }

    const dataUri = await fileToDataUri(file);
    setImageDataUri(dataUri);
    setPreviewName(file.name);
    setActivePresetId(null);
    setIncident(null);
    setShowModal(false);
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

  function triggerFlashFromEvent(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = 1.0 - (rect.top + rect.height / 2) / window.innerHeight;
    setFlashOrigin({ x, y });
    setFlashTrigger((prev) => prev + 1);
  }

  function triggerCenterFlash() {
    setFlashOrigin({ x: 0.5, y: 0.45 });
    setFlashTrigger((prev) => prev + 1);
  }

  async function createIncident(nextPrompt = prompt, nextImageDataUri = imageDataUri, screenshotLabel = previewName) {
    if (!nextImageDataUri) {
      setError('Arm the room with a screenshot first. Upload an image, paste from clipboard, or launch a real preset.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setIncident(null);
    setShowModal(false);
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: nextPrompt,
          imageDataUri: nextImageDataUri,
          screenshotLabel,
          settings,
        }),
      });
      const data = (await response.json()) as CreateIncidentResponse & { error?: string };
      if (!response.ok || !data.incident) {
        throw new Error(data.error ?? 'Could not create incident');
      }

      setIncident(data.incident);
      setActiveTab('console');
      attachIncidentStream(data.incident.id);
    } catch (err) {
      setIsAnalyzing(false);
      if (err instanceof Error && err.message === 'Failed to fetch') {
        setError('Could not reach the incident room API. If the dev server just restarted, wait a second and dispatch again.');
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not create incident');
    }
  }

  function attachIncidentStream(incidentId: string) {
    const source = new EventSource(`/api/incidents/${incidentId}/events`);
    eventSourceRef.current = source;

    source.addEventListener('snapshot', (event) => {
      const nextIncident = JSON.parse((event as MessageEvent).data) as Incident;
      setIncident(nextIncident);
      if (nextIncident.status === 'failed' && nextIncident.error) {
        setError(nextIncident.error);
      }
      if (nextIncident.status === 'completed' || nextIncident.status === 'failed') {
        setIsAnalyzing(false);
        if (nextIncident.status === 'completed') {
          setActiveTab('report');
        }
        source.close();
        if (eventSourceRef.current === source) {
          eventSourceRef.current = null;
        }
      }
    });

    source.onerror = () => {
      setError('Live room stream dropped. Refresh or rerun the incident.');
      setIsAnalyzing(false);
      source.close();
      if (eventSourceRef.current === source) {
        eventSourceRef.current = null;
      }
    };
  }

  async function runPresetDemo(presetId: string, event?: MouseEvent<HTMLButtonElement>) {
    const preset = DEMO_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    if (event) {
      triggerFlashFromEvent(event);
    }

    setPrompt(preset.prompt);
    setPreviewName(`${preset.title} demo scenario`);
    setActivePresetId(presetId);
    setError(null);

    try {
      const presetDataUri = await imageUrlToDataUri(preset.imagePath);
      setImageDataUri(presetDataUri);
      await createIncident(preset.prompt, presetDataUri, `${preset.title} demo scenario`);
    } catch {
      setError(`Could not load demo image for ${preset.title}.`);
      setIsAnalyzing(false);
    }
  }

  function handleClearCapture() {
    setImageDataUri(undefined);
    setPreviewName('No screenshot selected');
    setActivePresetId(null);
    setIncident(null);
    setError(null);
    setShowModal(false);
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setIsAnalyzing(false);
  }

  async function handlePromoteCandidate(candidateId: string) {
    if (!incident) return;
    try {
      const response = await fetch(`/api/incidents/${incident.id}/candidates/${candidateId}/promote`, {
        method: 'POST',
      });
      const data = (await response.json()) as { incident?: Incident; error?: string };
      if (!response.ok || !data.incident) {
        throw new Error(data.error ?? 'Could not promote playbook');
      }
      setIncident(data.incident);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not promote playbook');
    }
  }

  async function handleContinueWatcherCapture() {
    if (!pendingCapture || isAnalyzing) return;
    try {
      triggerCenterFlash();
      const response = await fetch(`/api/watcher/${pendingCapture.id}/import`, { method: 'POST' });
      const data = (await response.json()) as { imageDataUri?: string; screenshotLabel?: string; error?: string };
      if (!response.ok || !data.imageDataUri || !data.screenshotLabel) {
        throw new Error(data.error ?? 'Could not import watcher capture');
      }
      setImageDataUri(data.imageDataUri);
      setPreviewName(data.screenshotLabel);
      setActivePresetId(null);
      await refreshWatcher();
      await createIncident(prompt, data.imageDataUri, data.screenshotLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import watcher capture');
    }
  }

  async function handleOpenWatcherCapture() {
    if (!pendingCapture || isAnalyzing) return;
    try {
      const response = await fetch(`/api/watcher/${pendingCapture.id}/open`, { method: 'POST' });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not open watcher capture');
      }
      await refreshWatcher();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open watcher capture');
    }
  }

  async function handleDismissWatcherCapture() {
    if (!pendingCapture || isAnalyzing) return;
    try {
      const response = await fetch(`/api/watcher/${pendingCapture.id}/dismiss`, { method: 'POST' });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not dismiss watcher capture');
      }
      await refreshWatcher();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not dismiss watcher capture');
    }
  }

  const primaryRuns = useMemo(() => (incident?.runs ?? []).filter((run) => run.kind === 'primary'), [incident]);
  const subagentRuns = useMemo(() => (incident?.runs ?? []).filter((run) => run.kind === 'subagent'), [incident]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-transparent text-white">
      {/* Dynamic script loading for GSAP & ScrollTrigger */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
        strategy="lazyOnload"
        onLoad={() => setGsapLoaded(true)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"
        strategy="lazyOnload"
        onLoad={() => setScrollTriggerLoaded(true)}
      />

      <FlashOverlay trigger={flashTrigger} originX={flashOrigin.x} originY={flashOrigin.y} />

      {/* Section 1: Hero */}
      <section
        id="hero"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Column */}
        <div
          style={{
            position: 'relative',
            width: '40%',
            minWidth: '360px',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
            boxSizing: 'border-box',
          }}
        >
          {/* Navigation - Made relative to left column to prevent floating overlap */}
          <nav
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              zIndex: 10,
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              marginBottom: '60px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 400,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {navigationConfig.brandName}
            </span>
            <div style={{ display: 'flex', gap: '24px' }}>
              {navigationConfig.links.map((item, index) => (
                <div key={`${item.label}-${item.href}`} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <a
                    href={item.href}
                    style={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: '#fff',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      letterSpacing: '0.08em',
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.2s',
                      paddingBottom: '2px',
                    }}
                  >
                    {item.label}
                  </a>
                  {index < navigationConfig.links.length - 1 && (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>·</span>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Hero Title & Vertical Flow Paragraphs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: '11px',
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.42)',
                margin: '0 0 16px 0',
              }}
            >
              {heroConfig.eyebrow}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-ibm-plex-mono), var(--font-geist-mono), monospace",
                fontSize: 'clamp(36px, 4.8vw, 64px)',
                fontWeight: 400,
                lineHeight: 1.1,
                color: '#fff',
                textTransform: 'uppercase',
                margin: '0 0 48px 0',
                letterSpacing: '0.015em',
              }}
            >
              {heroConfig.titleLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < heroConfig.titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>

            {/* Structured Vertical Layout for Paragraphs - No absolute coordinates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '440px' }}>
              <p
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: '12px',
                  fontWeight: 400,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,0.65)',
                  margin: 0,
                }}
              >
                {heroConfig.leadText}
              </p>

              {notes.map((noteText, idx) => (
                <p
                  key={`note-${idx}`}
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: '12px',
                    fontWeight: 400,
                    lineHeight: 1.8,
                    color: 'rgba(255,255,255,0.45)',
                    margin: 0,
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    paddingLeft: '16px',
                  }}
                >
                  {noteText}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column containing redesigned unique 3D ASCII Cyber-Bug core */}
        <div
          style={{
            position: 'relative',
            width: '60%',
            flex: '1 1 400px',
            background: 'transparent',
            overflow: 'hidden',
            minHeight: '500px',
          }}
        >
          <AsciiMoonCanvas />
        </div>
      </section>

      {/* Section 2: Manifesto - Spacing tightened to reduce useless space */}
      <section
        ref={manifestoSectionRef}
        id="manifesto"
        style={{
          background: 'transparent',
          color: '#ffffff',
          padding: '80px 40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1360px',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 46%) minmax(320px, 1fr)',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {manifestoConfig.videoPath ? (
            <div ref={manifestoVideoRef} style={{ opacity: 0 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  overflow: 'hidden',
                  background: '#000',
                }}
              >
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                >
                  <source src={manifestoConfig.videoPath} type="video/mp4" />
                </video>
              </div>
            </div>
          ) : (
            <div ref={manifestoVideoRef} />
          )}

          <p
            ref={manifestoTextRef}
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '25px',
              maxWidth: '680px',
              textAlign: 'left',
              margin: 0,
              opacity: 0,
            }}
          >
            {manifestoConfig.text}
          </p>
        </div>
      </section>

      {/* Section 3: Primary Agent Roster (Facilities) - Redesigned to blend into dark UI */}
      <section
        ref={facilitiesSectionRef}
        id="agents"
        style={{
          background: 'transparent',
          color: '#ffffff',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div
          style={{
            padding: '60px 40px 20px',
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: '17.5px',
              fontWeight: 400,
              lineHeight: '22px',
              textTransform: 'uppercase',
              color: '#fff',
              margin: '0 0 20px 0',
              letterSpacing: '0.08em',
            }}
          >
            {facilitiesConfig.sectionLabel}
          </h3>
        </div>

        <div
          ref={facilitiesGridRef}
          className="facilities-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {facilitiesConfig.items.map((facility, index) => {
            const agentIdMap: Record<string, string> = {
              'ui-analyzer': 'vision',
              'log-parser': 'debug',
              'state-inspector': 'ux',
              'network-probe': 'fix',
            };
            const agentId = agentIdMap[facility.slug];
            const run = primaryRuns.find((item) => item.agentId === agentId);
            const children = subagentRuns.filter((item) => item.parentRunId === run?.id);

            return (
              <div
                key={facility.slug || `${facility.name}-${index}`}
                style={{
                  borderRight: index === facilitiesConfig.items.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '40px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '100%',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <Link
                  href={`/facility/${facility.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: '#fff',
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: '18px',
                      fontWeight: 400,
                      lineHeight: '24px',
                      textTransform: 'uppercase',
                      margin: '0 0 4px 0',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {facility.name}
                    {facility.code ? `, ${facility.code}` : ''}
                  </h2>
                </Link>

                <div style={{ marginTop: '20px' }}>
                  <AnalogClock utcOffset={facility.utcOffset} theme="dark" />
                </div>

                {facility.address && (
                  <p
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: '11px',
                      fontWeight: 400,
                      lineHeight: '18px',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: '0 0 12px 0',
                    }}
                  >
                    {facility.address}
                  </p>
                )}

                {facility.status && (
                  <p
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: '11px',
                      fontWeight: 400,
                      lineHeight: '18px',
                      color: '#2dd4bf',
                      margin: '0 0 12px 0',
                      fontStyle: 'italic',
                    }}
                  >
                    {facility.status}
                  </p>
                )}

                <p
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: '0 0 4px 0',
                  }}
                >
                  {facility.email}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: '0 0 24px 0',
                  }}
                >
                  {facility.phone}
                </p>

                {/* Inject live agent workspace status inside column */}
                <FacilityAgentRun run={run} children={children} />

                {facility.ctaText && (
                  <Link
                    href={`/facility/${facility.slug}`}
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                      fontSize: '11px',
                      fontWeight: 400,
                      textTransform: 'uppercase',
                      color: '#1EF7C1',
                      textDecoration: 'none',
                      borderBottom: '1px solid #1EF7C1',
                      paddingBottom: '2px',
                      display: 'inline-block',
                      marginBottom: '32px',
                      width: 'fit-content',
                    }}
                  >
                    {facility.ctaText}
                  </Link>
                )}

                {facility.image && (
                  <div style={{ marginTop: 'auto', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img
                      src={facility.image}
                      alt={facility.name}
                      style={{
                        width: '100%',
                        aspectRatio: '3 / 4',
                        objectFit: 'cover',
                        display: 'block',
                        filter: 'grayscale(100%) opacity(70%)',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Live Observation Feed */}
      <section
        ref={observationSectionRef}
        id="feed"
        style={{
          background: 'transparent',
          color: '#fff',
          padding: '80px 40px 40px 40px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: '17.5px',
            fontWeight: 400,
            lineHeight: '22px',
            textTransform: 'uppercase',
            color: '#fff',
            margin: '0 0 32px 0',
            alignSelf: 'flex-start',
            letterSpacing: '0.08em',
          }}
        >
          {observationConfig.sectionLabel}
        </h3>

        {/* Video Monitor Frame */}
        <div
          ref={observationVideoRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            marginBottom: '40px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <SwarmVisualizer incident={incident} isAnalyzing={isAnalyzing} />

          {/* Coordinate Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: '11px',
              fontWeight: 400,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'rgba(0,0,0,0.7)',
              padding: '6px 10px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {observationConfig.latLabel} {coords.lat.toFixed(2)}, {observationConfig.lonLabel} {coords.lon.toFixed(2)}
          </div>

          {/* Status Overlay */}
          {observationConfig.statusText && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: '11px',
                fontWeight: 400,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0,0,0,0.7)',
                padding: '6px 10px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#1EF7C1',
                  display: 'inline-block',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              {observationConfig.statusText}
            </div>
          )}
        </div>

        {result && (
          <div className="w-full max-w-[1200px] mb-6 flex border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`pb-3 px-6 font-mono-technical text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === 'console'
                  ? 'border-[#1EF7C1] text-[#1EF7C1]'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              Operator Console
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`pb-3 px-6 font-mono-technical text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'border-[#1EF7C1] text-[#1EF7C1] font-bold'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              Analysis Report
            </button>
          </div>
        )}

        {result && activeTab === 'report' ? (
          <div className="w-full max-w-[1200px] min-h-[60vh] animate-fade-in">
            <AnalysisReportView
              result={result}
              question={prompt}
              onClose={() => setActiveTab('console')}
            />
          </div>
        ) : (
          <div className="w-full max-w-[1200px] grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5">
            <WatcherIntakePanel
              capture={pendingCapture}
              queueCount={pendingWatcherCount}
              watchDir={watcher.watchDir}
              isBusy={isAnalyzing}
              onContinue={() => {
                void handleContinueWatcherCapture();
              }}
              onOpenViewer={() => {
                void handleOpenWatcherCapture();
              }}
              onDismiss={() => {
                void handleDismissWatcherCapture();
              }}
            />

            <UploadPanel
              previewSrc={previewSrc}
              previewAlt={previewAlt}
              previewName={previewName}
              isDragOver={isDragOver}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              onClear={handleClearCapture}
            />

            <section className="room-panel border border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/42 font-mono-console">Operator console</p>
                  <p className="mt-2 text-[11px] leading-6 text-white/58 font-mono-console">
                    All inputs feed the same real room. Paste from clipboard, drag a screenshot, run a preset, or continue from the watcher queue.
                  </p>
                </div>
                <span className="border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/42 font-mono-console">
                  {settings.autonomy}
                </span>
              </div>

              <label className="sr-only" htmlFor="prompt">Query string</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="mt-4 min-h-32 w-full resize-none border border-white/10 bg-black/40 p-3 text-[11px] leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-white/30 font-mono-console"
                placeholder="What should the organization solve?"
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="space-y-1 text-left font-mono-console">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/42">Autonomy</span>
                  <select
                    value={settings.autonomy}
                    onChange={(event) => setSettings((current) => ({ ...current, autonomy: event.target.value as IncidentSettings['autonomy'] }))}
                    className="w-full border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white outline-none font-mono-console"
                  >
                    <option value="observe">Observe</option>
                    <option value="analyze">Analyze</option>
                    <option value="propose">Propose</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>

                <label className="space-y-1 text-left font-mono-console">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/42">Max subagents / seat</span>
                  <select
                    value={settings.maxSubagentsPerPrimary}
                    onChange={(event) => setSettings((current) => ({ ...current, maxSubagentsPerPrimary: Number(event.target.value) }))}
                    className="w-full border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white outline-none font-mono-console"
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setSettings((current) => ({ ...current, allowSubagents: !current.allowSubagents }))}
                className={`mt-3 w-full border px-3 py-2 text-[10px] uppercase tracking-[0.22em] font-mono-console ${settings.allowSubagents ? 'border-white bg-white text-black' : 'border-white/10 bg-black/30 text-white/60'}`}
              >
                Subagents {settings.allowSubagents ? 'enabled' : 'disabled'}
              </button>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <button
                  type="button"
                  onClick={(event) => {
                    triggerFlashFromEvent(event);
                    void createIncident();
                  }}
                  disabled={isAnalyzing}
                  className="border border-white bg-white px-3 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 font-mono-console"
                >
                  {isAnalyzing ? 'Room active' : 'Dispatch room'}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    void runPresetDemo('vite-error', event);
                  }}
                  disabled={isAnalyzing}
                  className="border border-white/10 bg-black/30 px-3 py-3 text-[11px] uppercase tracking-[0.22em] text-white/80 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50 font-mono-console"
                >
                  60s demo
                </button>
              </div>

              {error ? <p className="mt-3 border border-red-500/30 bg-red-500/10 p-3 text-[11px] leading-6 text-red-200 font-mono-console">{error}</p> : null}
            </section>

            <section className="room-panel border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/42 font-mono-console">Scenario presets</p>
                  <p className="mt-1 text-[11px] leading-6 text-white/58 font-mono-console">Real screenshots that submit through the same incident API.</p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-mono-console">{DEMO_PRESETS.length}</span>
              </div>
              <div className="mt-4 grid gap-2.5">
                {DEMO_PRESETS.map((preset, index) => (
                  <DemoPresetCard
                    key={preset.id}
                    preset={preset}
                    index={index}
                    isActive={activePresetId === preset.id}
                    isAnalyzing={isAnalyzing}
                    onClick={(event) => {
                      void runPresetDemo(preset.id, event);
                    }}
                  />
                ))}
              </div>
            </section>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="border border-white/10 bg-black/25 p-4 backdrop-blur flex justify-between items-center flex-wrap gap-4">
              <Metric label="Source" value={activePreset ? activePreset.title : imageDataUri ? 'Custom capture' : pendingCapture ? 'Watcher queue' : 'Awaiting capture'} />
              <Metric label="Primaries" value={incident ? String(metrics.primaryCount) : String(AGENT_DEFINITIONS.length)} />
              <Metric label="Subagents" value={incident ? String(metrics.subagentCount) : '0'} />
              <Metric label="Latency" value={result?.timing.elapsedMs ? `${result.timing.elapsedMs}ms` : 'ready'} />
              <SpeedBadge
                elapsedMs={result?.timing.elapsedMs}
                model={result?.timing.model}
                tokensPerSecond={result?.timing.outputTokensPerSecond}
              />
            </div>

            <ConsensusPanel
              incident={incident}
              result={result}
              error={error}
              onOpenReport={() => setActiveTab('report')}
            />

            <SwarmTimeline incident={incident} />

            <div className="grid gap-5 lg:grid-cols-2">
              <PlaybookPanel incident={incident} onPromote={handlePromoteCandidate} isBusy={isAnalyzing} />
              <section className="room-panel border border-white/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/42 font-mono-console">Room outcomes</p>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <Metric label="Integrated" value={String(metrics.integrated)} />
                  <Metric label="Discarded" value={String(metrics.discarded)} />
                  <Metric label="Confidence" value={result ? `${Math.round(result.confidence * 100)}%` : '—'} />
                  <Metric label="Latency" value={result?.timing.elapsedMs ? `${result.timing.elapsedMs}ms` : '—'} />
                </div>
              </section>
            </div>
          </div>
        </div>
        )}
      </section>

      {/* Section 5: Archives - Spacing reduced from 200vh to 110vh to fix useless space */}
      <section
        ref={archivesWrapperRef}
        id="archives"
        style={{
          background: 'transparent',
          color: '#fff',
          minHeight: '110vh',
          position: 'relative',
        }}
      >
        <div style={{ padding: '60px 40px 20px', position: 'relative', zIndex: 10 }}>
          <h3
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: '17.5px',
              fontWeight: 400,
              lineHeight: '22px',
              textTransform: 'uppercase',
              color: '#fff',
              margin: 0,
              letterSpacing: '0.08em',
            }}
          >
            {archivesConfig.sectionLabel}
          </h3>
        </div>

        <div
          className="scene"
          style={{
            perspective: '900px',
            position: 'sticky',
            top: 0,
            height: '80vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {archivesConfig.vaultTitle && (
            <button
              onClick={activateVault}
              style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: '12px',
                fontWeight: 400,
                textTransform: 'uppercase',
                color: '#fff',
                background: 'transparent',
                border: '1px solid #fff',
                borderRadius: '26px',
                padding: '10px 28px',
                cursor: 'pointer',
                letterSpacing: '0.08em',
                transition: 'background 0.2s, color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = '#fff';
                el.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = 'transparent';
                el.style.color = '#fff';
              }}
            >
              {archivesConfig.vaultTitle}
            </button>
          )}

          <div
            ref={archivesCarouselRef}
            className="carousel"
            style={{
              width: '320px',
              height: '400px',
              position: 'absolute',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              transform: 'translateZ(-480px) rotateY(0deg)',
            }}
          >
            {vaultImages.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="carousel__cell"
                style={{
                  position: 'absolute',
                  width: '280px',
                  height: '350px',
                  left: '20px',
                  top: '25px',
                  transformStyle: 'preserve-3d',
                }}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: 'grayscale(100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize: '10px',
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    color: '#fff',
                    letterSpacing: '0.05em',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fully Functional Grid overlay for Archive vault details */}
      <div
        ref={archivesPreviewRef}
        className="preview"
        style={{
          position: 'fixed',
          inset: 0,
          padding: '10vh 12vw',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '32px',
          alignContent: 'center',
          justifyItems: 'center',
          opacity: vaultOpen ? 1 : 0,
          pointerEvents: vaultOpen ? 'auto' : 'none',
          zIndex: 100,
          background: 'rgba(13,13,13,0.98)',
          transition: 'opacity 0.4s ease-in-out',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        {archivesConfig.closeText && (
          <button
            onClick={closeVault}
            style={{
              position: 'absolute',
              top: '32px',
              right: '40px',
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: '12px',
              fontWeight: 400,
              textTransform: 'uppercase',
              color: '#fff',
              background: 'transparent',
              border: '1px solid #fff',
              borderRadius: '26px',
              padding: '8px 20px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              zIndex: 110,
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = '#fff';
              el.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = 'transparent';
              el.style.color = '#fff';
            }}
          >
            {archivesConfig.closeText}
          </button>
        )}

        {vaultImages.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="grid__item"
            style={{
              willChange: 'transform, clip-path',
              position: 'relative',
              transformStyle: 'preserve-3d',
              visibility: vaultOpen ? 'visible' : 'hidden',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '16px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '440px',
              transition: 'transform 0.2s, border-color 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'rgba(30,247,193,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
            onClick={() => {
              // Set clicked image as the active custom screenshot to analyze!
              imageUrlToDataUri(item.src)
                .then(uri => {
                  setImageDataUri(uri);
                  setPreviewName(item.label);
                  setActivePresetId(null);
                  setIncident(null);
                  closeVault();
                  // Scroll back to observation feed smoothly
                  const feedEl = document.getElementById('feed');
                  if (feedEl) {
                    feedEl.scrollIntoView({ behavior: 'smooth' });
                  }
                })
                .catch(() => {
                  setError("Could not load image from vault.");
                });
            }}
          >
            <img
              src={item.src}
              alt={item.label}
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '16/10',
                objectFit: 'cover',
                display: 'block',
                filter: 'grayscale(100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '12px',
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#fff',
                margin: '0 0 4px 0',
                letterSpacing: '0.05em',
              }}
            >
              {item.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize: '10px',
                color: 'rgba(255,255,255,0.4)',
                margin: 0,
              }}
            >
              Click to load screenshot into active war room
            </p>
          </div>
        ))}
      </div>

      {/* Section 6: Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent',
          padding: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        <span>{footerConfig.copyrightText}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1EF7C1' }} />
          <span>{footerConfig.statusText}</span>
        </div>
      </footer>

      {showModal && result ? <ReportModal result={result} question={prompt} onClose={() => setShowModal(false)} /> : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/35 px-3 py-3 rounded-md">
      <p className="text-[8px] uppercase tracking-[0.22em] text-white/42 font-mono-console">{label}</p>
      <p className="mt-2 break-words text-[11px] uppercase tracking-[0.03em] text-white/84 font-mono-console">{value}</p>
    </div>
  );
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read screenshot'));
    reader.readAsDataURL(file);
  });
}

async function imageUrlToDataUri(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${imageUrl}`);
  }

  const blob = await response.blob();
  return fileToDataUri(
    new File([blob], imageUrl.split('/').pop() ?? 'preset-image.png', {
      type: blob.type || 'image/png',
    }),
  );
}
"use client";

import React from 'react';

interface PresetSVGProps {
  presetId: string;
}

export function ViteErrorSVG() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0d0708', minHeight: 280 }}>
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: '#1e1416', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="ml-2 text-[9px] text-white/50 font-mono">vite-error-console : 3000</span>
      </div>
      
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3 font-mono">
        <div className="p-3 rounded-lg border border-red-500/25 bg-red-500/5 text-left">
          <span className="text-[10px] text-red-500 font-bold block">[vite] Internal Server Error (500)</span>
          <span className="text-[10px] text-white block mt-1">Failed to resolve import &quot;./Button&quot; from &quot;./src/App.tsx&quot;</span>
        </div>
        
        <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] text-left text-[9px] text-white/40 flex-1 flex flex-col gap-1.5">
          <div>1 | import React from &quot;react&quot;;</div>
          <div>2 | import Header from &quot;./components/Header&quot;;</div>
          <div className="text-red-400 font-semibold bg-red-500/10 py-0.5 px-1 rounded">- 3 | import Button from &quot;./Button&quot;;</div>
          <div className="text-green-400 font-semibold bg-green-500/10 py-0.5 px-1 rounded">+ 3 | import Button from &quot;./components/Button&quot;;</div>
          <div>4 | </div>
          <div>5 | export default function App() &#123;</div>
        </div>
      </div>
    </div>
  );
}

export function DashboardUISVG() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#04060b', minHeight: 280 }}>
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: '#0c101c', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <span className="ml-2 text-[9px] text-white/40 font-mono">Admin Portal / Dashboard</span>
      </div>
      
      {/* Grid */}
      <div className="p-3 flex-1 flex gap-3">
        {/* Sidebar */}
        <div className="w-12 rounded-lg bg-[#0c101c]/60 p-2 flex flex-col gap-2">
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3">
          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg border border-white/5 bg-white/[0.01] text-left relative">
              <span className="text-[7px] text-white/40 block">CPU</span>
              <span className="text-xs text-red-400 font-bold block mt-1">98.2%</span>
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>
            <div className="p-2 rounded-lg border border-white/5 bg-white/[0.01] text-left relative">
              <span className="text-[7px] text-white/40 block">LATENCY</span>
              <span className="text-xs text-yellow-500 font-bold block mt-1">1432ms</span>
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
            </div>
            <div className="p-2 rounded-lg border border-white/5 bg-white/[0.01] text-left">
              <span className="text-[7px] text-white/40 block">MEMORY</span>
              <span className="text-xs text-white/90 font-bold block mt-1">4.2GB</span>
            </div>
          </div>
          
          {/* Graphic */}
          <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-lg p-2 flex flex-col gap-1.5 relative overflow-hidden">
            <span className="text-[7px] text-white/40 text-left block">Metrics Overlap Error</span>
            
            <div className="flex-1 flex items-end gap-1.5 justify-center relative">
              <div className="w-5 bg-red-500/40 border border-red-500" style={{ height: '70%' }} />
              {/* Overlapping bar */}
              <div className="w-5 bg-teal-500/40 border border-teal-500 absolute" style={{ height: '85%', left: 'calc(50% - 4px)' }} />
              <div className="w-5 bg-teal-500/40 border border-teal-500" style={{ height: '85%' }} />
            </div>
            
            <span className="text-[7px] text-red-400 font-mono absolute bottom-1 right-2">OVERLAP WARNING</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsChartSVG() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#040809', minHeight: 280 }}>
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: '#0e1718', borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <div className="w-2 h-2 rounded-full bg-white/20" />
        <span className="ml-2 text-[9px] text-white/40 font-mono">Swarm Telemetry Analytics</span>
      </div>
      
      {/* Chart Layout */}
      <div className="p-3 flex-1 flex flex-col gap-2 relative">
        {/* Graph area */}
        <div className="flex-1 border border-white/5 bg-white/[0.01] rounded-lg p-3 relative flex items-end">
          {/* Overlapping labels / lines */}
          <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-20 pointer-events-none">
            <div className="border-b border-white/25 w-full" />
            <div className="border-b border-white/25 w-full" />
            <div className="border-b border-white/25 w-full" />
            <div className="border-b border-white/25 w-full" />
          </div>
          
          {/* SVG line */}
          <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 300 150">
            <path d="M 10,120 Q 50,30 100,80 T 200,130 T 290,40" fill="none" stroke="#2DD4BF" strokeWidth="2" />
            {/* Dip alert */}
            <circle cx="200" cy="130" r="4" fill="#ef4444" />
            <line x1="200" y1="130" x2="200" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
          </svg>
          
          {/* Dip Flag */}
          <div className="absolute top-12 left-[150px] bg-red-500/90 text-white font-mono text-[7px] px-1.5 py-0.5 rounded shadow z-20">
            DIP ALERT
          </div>
        </div>
        
        {/* X Axis labels overlapping */}
        <div className="flex justify-between font-mono text-[7px] text-white/30 px-2 mt-1 relative h-6">
          <div>01:00</div>
          <div className="text-red-400 absolute left-[38%]">01:15</div>
          <div className="absolute left-[44%]">01:30</div>
          <div>01:45</div>
          <div>02:00</div>
          <span className="text-[6px] text-red-400 absolute bottom-0 right-2">OVERLAPPING AXIS LABELS</span>
        </div>
      </div>
    </div>
  );
}

export default function PresetSVG({ presetId }: PresetSVGProps) {
  if (presetId === 'vite-error') return <ViteErrorSVG />;
  if (presetId === 'dashboard-ui') return <DashboardUISVG />;
  if (presetId === 'analytics-chart') return <AnalyticsChartSVG />;
  return null;
}

"use client";

import { useEffect, useRef } from 'react';

const CHARS_CORE = " []{}()<>/\u005C|!I1t7JfjuxzCrYXP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
const LOG_MESSAGES = [
  "SYSTEM_OK",
  "SWARM_INIT_OK",
  "UI_ANALYZER_ACTIVE",
  "LOG_PARSER_ACTIVE",
  "STATE_INSPECTOR_ACTIVE",
  "NETWORK_PROBE_ACTIVE",
  "ANALYZING_DOM_TREE...",
  "PARSING_STACK_TRACE...",
  "AUDITING_REDUX_STORE...",
  "PROBING_API_LATENCY...",
  "CONFLICT_RESOLVED",
  "CONSENSUS_LOCKED",
  "THREAT_LEVEL_0",
  "PORT_3000_OPEN",
  "INCIDENT_DETECTED",
  "DISPATCHING_ROOM...",
  "LATENCY_82MS",
  "CONFIDENCE_98%",
  "MEM_USAGE_42%",
  "PROCESSOR_LOAD_18%"
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function AsciiMoonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let time = 0;
    let rafId = 0;
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      width = canvas.parentElement?.offsetWidth ?? 0;
      height = canvas.parentElement?.offsetHeight ?? 0;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      cols = width < 768 ? 80 : 110;
      const cellW = width / cols;
      const cellH = cellW * 1.2;
      rows = Math.ceil(height / cellH);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      time += 0.015;

      const cellW = width / cols;
      const cellH = cellW * 1.2;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      
      // Radius of the main diagnostic sphere
      const coreRadius = Math.min(width, height) * 0.22;

      ctx.font = `${cellH * 0.88}px var(--font-ibm-plex-mono), monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 3D rotation angles
      const rotX = time * 0.4;
      const rotY = time * 0.6;

      for (let r = 0; r < rows; r++) {
        const y = r * cellH + cellH / 2;

        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;

          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.hypot(dx, dy);

          let char = ' ';
          let opacity = 0;
          let color = '#fff';

          // Mouse interaction field
          const mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
          const mouseField = Math.exp(-mouseDist * 0.005);

          // 1. Scrolling System Logs on Left & Right Edges
          const isLeftLog = c < 15;
          const isRightLog = c > cols - 16;
          if (isLeftLog || isRightLog) {
            const colOffset = isLeftLog ? c : (cols - 1 - c);
            const scrollSpeed = 0.15;
            const scrollY = (y + time * 60 * scrollSpeed) % height;
            
            // Generate a deterministic message index based on row and scroll
            const msgRowIndex = Math.floor((y + time * 60 * scrollSpeed) / 32) % LOG_MESSAGES.length;
            const msg = LOG_MESSAGES[msgRowIndex] || "OK";
            
            const charIndex = Math.floor(x / cellW) % (msg.length + 4);
            if (charIndex < msg.length && colOffset > 2) {
              char = msg[charIndex];
              opacity = clamp(0.12 - colOffset * 0.01, 0.02, 0.2) + mouseField * 0.15;
              color = '#2dd4bf'; // teal accent for logs
            } else if (colOffset === 1) {
              char = '|';
              opacity = 0.08;
            }
          }

          // 2. Central 3D Cyber-Sphere Matrix
          if (dist < coreRadius) {
            // Project 3D sphere coordinates
            const nx = dx / coreRadius;
            const ny = -dy / coreRadius;
            const r2 = nx * nx + ny * ny;
            const nz = Math.sqrt(Math.max(0, 1.0 - r2));

            // Apply 3D Rotation
            const x3d = nx * Math.cos(rotY) - nz * Math.sin(rotY);
            const z3d = nx * Math.sin(rotY) + nz * Math.cos(rotY);
            const y3d = ny * Math.cos(rotX) - z3d * Math.sin(rotX);

            // Create a wireframe grid pattern on the sphere
            const gridSpacing = 8;
            const gridX = Math.abs(Math.sin(x3d * gridSpacing));
            const gridY = Math.abs(Math.sin(y3d * gridSpacing));
            const gridZ = Math.abs(Math.sin(z3d * gridSpacing));

            const isWireframe = gridX < 0.12 || gridY < 0.12 || gridZ < 0.12;

            if (isWireframe) {
              const val = (gridX + gridY + gridZ) / 3;
              const idx = Math.floor((1 - val) * (CHARS_CORE.length - 1));
              char = CHARS_CORE[clamp(idx, 0, CHARS_CORE.length - 1)];
              opacity = clamp(0.35 + nz * 0.65, 0.3, 1.0) - mouseField * 0.2;
              color = '#1ef7c1'; // bright neon green/teal for sphere
            }

            // Draw a central digital "BUG" symbol inside the core
            const bugRadius = coreRadius * 0.35;
            if (dist < bugRadius) {
              // Mathematical bug shape overlay
              const angle = Math.atan2(dy, dx);
              const leg1 = Math.abs(Math.sin(angle * 3 + time)) > 0.92;
              const leg2 = Math.abs(Math.sin(angle * 2 - time)) > 0.95;
              
              if (leg1 || leg2 || dist < bugRadius * 0.4) {
                char = Math.random() > 0.5 ? '0' : '1';
                opacity = 0.8 + Math.sin(time * 10) * 0.2; // pulse
                color = '#e88d39'; // orange alert color for the bug
              }
            }
          }

          // 3. Radar Sweep & Target Crosshairs
          const radarSweepAngle = (time * 1.2) % (Math.PI * 2);
          const cellAngle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
          const angleDiff = Math.abs(cellAngle - radarSweepAngle);
          
          // Radar Sweep Line
          if (dist > coreRadius && dist < coreRadius * 1.4) {
            if (angleDiff < 0.15) {
              char = '*';
              opacity = (1.0 - angleDiff / 0.15) * 0.4;
              color = '#2dd4bf';
            }
          }

          // Target Crosshairs [ ] at four corners of the core
          const cornerDist = Math.abs(dist - coreRadius * 1.15);
          if (cornerDist < 4) {
            const angleDeg = (cellAngle * 180) / Math.PI;
            const isCorner = Math.abs(angleDeg % 90) < 4;
            if (isCorner) {
              char = '+';
              opacity = 0.7 + Math.sin(time * 8) * 0.2;
              color = '#e88d39';
            }
          }

          // Render character if active
          if (char !== ' ' && opacity > 0.01) {
            ctx.fillStyle = color === '#fff' ? `rgba(255,255,255,${opacity})` : color.startsWith('rgba') ? color : hexToRgba(color, opacity);
            
            // Add slight hover glitch displacement
            let drawX = x;
            let drawY = y;
            if (mouseField > 0.1) {
              drawX += (Math.random() - 0.5) * mouseField * 12;
              drawY += (Math.random() - 0.5) * mouseField * 6;
            }
            ctx.fillText(char, drawX, drawY);
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    // Helper to convert Hex to RGBA
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    document.fonts.ready.then(() => {
      resize();
      draw();
    });

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

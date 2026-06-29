"use client";

import { useEffect, useRef, useState } from 'react';

interface FlashOverlayProps {
  trigger: number; // increment to trigger
  originX: number;
  originY: number;
}

export default function FlashOverlay({ trigger, originX, originY }: FlashOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger === 0 || trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    setVisible(true);

    // Resize canvas
    const resize = () => {
      if (typeof window === 'undefined') return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    // Vertex shader
    const vertSrc = `
      attribute vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Fragment shader
    const fragSrc = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_res;
      uniform vec2 u_clickPos;
      uniform float u_intensity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 6; i++) {
          sum += amp * noise(p * freq);
          amp *= 0.5;
          freq *= 2.0;
        }
        return sum;
      }

      float plume(vec2 p, float t) {
        float f = fbm(p * 2.0 + vec2(0.0, t * 0.8));
        float f2 = fbm(p * 3.0 + vec2(f, f) + vec2(0.0, t * 0.5));
        return smoothstep(0.3, 0.7, f2) * smoothstep(0.0, 0.2, p.y + 0.5);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / u_res.y;
        float t = u_time;
        float intensity = u_intensity;
        vec2 origin = (u_clickPos - 0.5) * vec2(u_res.x / u_res.y, 1.0);

        vec3 colorAmber = vec3(0.91, 0.55, 0.22);
        vec3 colorCyan = vec3(0.12, 0.97, 0.76);

        vec3 col = vec3(0.0);

        // Central flash
        float flash = exp(-t * 5.0);
        col += (colorAmber + colorCyan) * flash * intensity;

        // Plume
        float pl = plume(uv - origin, t);
        float dissipate = exp(-t * 1.5) * (1.0 - smoothstep(0.0, 2.0, t));
        col += pl * colorAmber * dissipate * intensity;

        // Cyan ring
        float ring = smoothstep(0.1, 0.15, abs(length(uv - origin) - t * 0.3));
        ring *= smoothstep(0.0, 0.5, t) * smoothstep(1.5, 0.5, t);
        col += colorCyan * ring * 0.4 * intensity;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // Compile shader helper
    const compile = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(vertSrc, gl.VERTEX_SHADER));
    gl.attachShader(prog, compile(fragSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uClickPos = gl.getUniformLocation(prog, 'u_clickPos');
    const uIntensity = gl.getUniformLocation(prog, 'u_intensity');

    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uClickPos, originX, originY);
    gl.uniform1f(uIntensity, 1.0);

    // Animation
    const startTime = performance.now();
    const duration = 3000;

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Fade out canvas
      const progress = elapsed / (duration / 1000);
      canvas.style.opacity = progress > 0.5 ? String(1 - (progress - 0.5) * 2) : '1';

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        setVisible(false);
      }
    };

    rafRef.current = requestAnimationFrame(render);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger, originX, originY]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  );
}

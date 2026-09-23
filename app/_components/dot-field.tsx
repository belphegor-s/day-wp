'use client';

import { useEffect, useRef } from 'react';

// A quiet lattice of dots behind the page. A slow tide swells them in passing,
// the cursor lifts the ones nearby, and now and then a single dot warms to red:
// the wallpaper's "today", scattered across the background.

const vert = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const frag = `
precision mediump float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uFg;
uniform vec3 uAccent;
uniform float uStrength;
uniform float uLane;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 px = gl_FragCoord.xy / uDpr;
  float cell = 26.0;
  vec2 id = floor(px / cell);
  vec2 gv = fract(px / cell) - 0.5;

  // Slow diagonal tide plus drifting noise.
  float tide = 0.5 + 0.5 * sin((id.x * 0.6 + id.y * 0.9) * 0.18 - uTime * 0.35);
  float drift = noise(id * 0.09 + vec2(uTime * 0.025, -uTime * 0.018));
  float swell = smoothstep(0.3, 1.0, tide * 0.5 + drift * 0.7);

  float near = smoothstep(220.0, 0.0, distance(px, uMouse)) * uHover;

  float r = 0.05 + swell * 0.055 + near * 0.07;
  float aa = 1.0 / cell;
  float dotMask = 1.0 - smoothstep(r - aa, r + aa, length(gv));

  float a = 0.03 + swell * 0.07 + near * 0.14;

  // A rare dot warms to red and cools again, each on its own clock.
  float seed = hash(id + 7.31);
  float pulse = sin(uTime * (0.25 + seed * 0.2) + seed * 40.0);
  float today = step(0.992, seed) * smoothstep(0.6, 1.0, pulse);
  vec3 col = mix(uFg, uAccent, today);
  a = mix(a, 0.38, today);

  // Even across the whole viewport, softening only toward the edges.
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float fade = mix(1.0, 0.55, smoothstep(0.35, 1.1, length(q)));

  // Quiet reading lane under the content column; the field lives in the margins.
  float fromCenter = abs(px.x - uRes.x / uDpr * 0.5);
  fade *= mix(0.3, 1.0, smoothstep(uLane - 60.0, uLane + 140.0, fromCenter));

  float alpha = dotMask * a * fade * uStrength;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function rgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: true });
    if (!canvas || !gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u('uRes'),
      uDpr = u('uDpr'),
      uTime = u('uTime'),
      uMouse = u('uMouse'),
      uHover = u('uHover'),
      uFg = u('uFg'),
      uAccent = u('uAccent'),
      uStrength = u('uStrength'),
      uLane = u('uLane');

    const dark = matchMedia('(prefers-color-scheme: dark)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');

    const setColors = () => {
      const css = getComputedStyle(document.documentElement);
      gl.uniform3fv(uFg, rgb(css.getPropertyValue('--fg') || '#ededea'));
      gl.uniform3fv(uAccent, rgb(css.getPropertyValue('--accent') || '#ef4444'));
      // Dark dots on light paper read heavier; ease them back.
      gl.uniform1f(uStrength, dark.matches ? 1.0 : 0.7);
    };

    let w = 0,
      h = 0,
      dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
      // Half the content column (max-w 880px), in CSS pixels.
      gl.uniform1f(uLane, Math.min(440, w / 2));
    };

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, hover: 0, target: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mouse.tx = e.clientX;
      mouse.ty = h - e.clientY;
      if (mouse.x < -999) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      mouse.target = 1;
    };
    const onLeave = () => (mouse.target = 0);

    let raf = 0;
    let shown = false;
    const start = performance.now();
    const draw = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      mouse.hover += (mouse.target - mouse.hover) * 0.05;
      gl.uniform1f(uTime, still.matches ? 12 : (now - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHover, mouse.hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) {
        shown = true;
        canvas.style.opacity = '1';
      }
      if (!still.matches && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    const onTheme = () => {
      setColors();
      kick();
    };
    const onResize = () => {
      resize();
      kick();
    };

    setColors();
    resize();
    kick();

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', kick);
    dark.addEventListener('change', onTheme);
    still.addEventListener('change', kick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', kick);
      dark.removeEventListener('change', onTheme);
      still.removeEventListener('change', kick);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-1500" />;
}

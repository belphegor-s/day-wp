'use client';

import { useEffect, useMemo, useState } from 'react';
import { devices } from '../_lib/devices';

type Theme = 'dark' | 'light';

const field = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[13px] text-fg outline-none transition-colors focus:border-muted';

export function Builder() {
  const [deviceId, setDeviceId] = useState<string>('iphone-16');
  const [custom, setCustom] = useState({ w: 1179, h: 2556 });
  const [tz, setTz] = useState('');
  const [theme, setTheme] = useState<Theme>('dark');
  const [origin, setOrigin] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Browser-only values; read once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    setOrigin(window.location.origin);
    setZones(Intl.supportedValuesOf?.('timeZone') ?? []);
  }, []);

  const device = devices.find((d) => d.id === deviceId);
  const w = device?.w ?? custom.w;
  const h = device?.h ?? custom.h;

  const query = useMemo(() => new URLSearchParams({ w: String(w), h: String(h), tz: tz || 'UTC', theme }).toString(), [w, h, tz, theme]);
  const url = `${origin}/wallpaper?${query}`;
  const preview = `/wallpaper?${new URLSearchParams({ w: String(Math.round(w / 3)), h: String(Math.round(h / 3)), tz: tz || 'UTC', theme })}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="grid items-start gap-12 md:grid-cols-[1fr_auto] md:gap-16">
      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Device</span>
          <select className={field} value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} · {d.w}×{d.h}
              </option>
            ))}
            <option value="custom">Custom size</option>
          </select>
        </label>

        {!device && (
          <div className="grid grid-cols-2 gap-3">
            {(['w', 'h'] as const).map((k) => (
              <label key={k} className="flex flex-col gap-2">
                <span className="text-[13px] text-muted">{k === 'w' ? 'Width' : 'Height'} (px)</span>
                <input type="number" min={200} max={4096} className={field} value={custom[k]} onChange={(e) => setCustom((c) => ({ ...c, [k]: Number(e.target.value) }))} />
              </label>
            ))}
          </div>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Time zone</span>
          <input className={field} list="zones" value={tz} placeholder="UTC" spellCheck={false} onChange={(e) => setTz(e.target.value)} />
          <datalist id="zones">
            {zones.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">Theme</span>
          <div className="inline-flex w-fit rounded-lg border border-line bg-surface p-1">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-md px-4 py-1.5 font-mono text-[13px] transition-colors ${theme === t ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <span className="text-[13px] text-muted">Your URL</span>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-line bg-surface">
            <code className="min-w-0 flex-1 overflow-x-auto px-3 py-2.5 font-mono text-[13px] whitespace-nowrap text-fg">{origin ? url : '…'}</code>
            <button type="button" onClick={copy} className="border-l border-line px-4 font-mono text-[13px] text-muted transition-colors hover:text-fg">
              {copied ? 'copied' : 'copy'}
            </button>
          </div>
        </div>
      </div>

      <Phone src={tz ? preview : null} light={theme === 'light'} ratio={w / h} />
    </div>
  );
}

function Phone({ src, light, ratio }: { src: string | null; light: boolean; ratio: number }) {
  const [loaded, setLoaded] = useState<string | null>(null);
  return (
    <div className="mx-auto w-[220px] rounded-[38px] border border-line bg-surface p-[7px] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)]">
      <div className={`relative overflow-hidden rounded-[31px] ${light ? 'bg-white' : 'bg-black'}`} style={{ aspectRatio: ratio }}>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt="Live preview of the wallpaper"
            onLoad={() => setLoaded(src)}
            className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${loaded === src ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <div className={`absolute top-[9px] left-1/2 h-[18px] w-[62px] -translate-x-1/2 rounded-full ${light ? 'bg-black' : 'bg-[#1a1a1a]'}`} />
      </div>
    </div>
  );
}

export function YearMeter() {
  const [state, setState] = useState<{ day: number; total: number } | null>(null);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const day = Math.floor((now.getTime() - new Date(y, 0, 0).getTime()) / 86400000);
    const total = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ day, total });
  }, []);

  return (
    <span className="font-mono text-[12px] text-muted tabular-nums">
      {state ? (
        <>
          day {state.day} <span className="opacity-50">/</span> {state.total}
        </>
      ) : (
        ' '
      )}
    </span>
  );
}

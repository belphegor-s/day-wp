'use client';

import { useEffect, useMemo, useState } from 'react';
import { devices } from '../_lib/devices';
import { Phone } from './phone';
import { Select, type Group } from './select';

type Theme = 'dark' | 'light';

const deviceGroups: Group[] = [{ options: devices.map((d) => ({ value: d.id, label: d.label, hint: `${d.w}×${d.h}` })) }, { options: [{ value: 'custom', label: 'Custom size' }] }];

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
    setOrigin(window.location.origin);
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const all = Intl.supportedValuesOf?.('timeZone') ?? [];
    // Some engines list neither UTC nor the resolved local zone; always offer both.
    setZones([...new Set(['UTC', local, ...all])]);
    setTz(local);
  }, []);

  const zoneGroups = useMemo<Group[]>(() => {
    const groups = new Map<string, string[]>();
    for (const z of zones) {
      const region = z.includes('/') ? z.split('/')[0] : 'Other';
      groups.set(region, [...(groups.get(region) ?? []), z]);
    }
    return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([label, list]) => ({ label, options: list.map((z) => ({ value: z, label: z.replace(/_/g, ' ') })) }));
  }, [zones]);

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
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-12 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span id="device-label" className="text-[13px] text-muted">
            Device
          </span>
          <Select value={deviceId} onChange={setDeviceId} groups={deviceGroups} labelledBy="device-label" />
        </div>

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

        <div className="flex flex-col gap-2">
          <span id="tz-label" className="text-[13px] text-muted">
            Time zone
          </span>
          <Select value={tz} onChange={setTz} groups={zoneGroups} labelledBy="tz-label" placeholder="Detecting…" disabled={!tz} />
        </div>

        <div className="flex flex-col gap-2">
          <span id="theme-label" className="text-[13px] text-muted">
            Theme
          </span>
          <div role="radiogroup" aria-labelledby="theme-label" className="relative grid w-fit grid-cols-2 rounded-lg border border-line bg-surface p-1">
            {/* One pill slides between equal-width halves. */}
            <span
              aria-hidden
              className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-fg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                theme === 'light' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme === t}
                tabIndex={theme === t ? 0 : -1}
                onClick={() => setTheme(t)}
                onKeyDown={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                    const next = theme === 'dark' ? 'light' : 'dark';
                    setTheme(next);
                    (e.currentTarget.parentElement?.querySelector(`[data-theme="${next}"]`) as HTMLElement | null)?.focus();
                  }
                }}
                data-theme={t}
                className={`relative z-10 px-4 py-1.5 text-center font-mono text-[13px] transition-colors duration-300 ${theme === t ? 'text-bg' : 'text-muted hover:text-fg'}`}
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
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? 'Copied' : 'Copy URL'}
              className="grid shrink-0 border-l border-line px-4 font-mono text-[13px] text-muted transition-colors hover:text-fg"
            >
              {/* Both labels share one cell so the button never changes width. */}
              <span className={`col-start-1 row-start-1 self-center transition-opacity duration-200 ${copied ? 'opacity-0' : 'opacity-100'}`}>copy</span>
              <span className={`col-start-1 row-start-1 self-center text-fg transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0'}`}>copied</span>
            </button>
          </div>
        </div>
      </div>

      <Phone preview={tz ? preview : null} full={`/wallpaper?${query}`} light={theme === 'light'} ratio={w / h} caption={`${w}×${h} · ${tz || 'UTC'} · ${theme}`} />
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

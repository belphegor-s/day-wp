'use client';

import { useEffect, useRef, useState } from 'react';

type ScreenProps = { src: string | null; placeholder?: string; light: boolean; ratio: number; alt: string };

// Stacks the previous image under the next one and fades the new one in once it
// has loaded, so changing theme or device never flashes an empty screen.
function Screen({ src, placeholder, light, ratio, alt }: ScreenProps) {
  const [layers, setLayers] = useState<string[]>(() => [placeholder, src].filter((s): s is string => !!s));
  const [ready, setReady] = useState<Record<string, true>>({});

  if (src && layers[layers.length - 1] !== src) setLayers([...layers.slice(-1), src]);

  return (
    // Outer element is the size container; cqw below resolves against it.
    <div className="@container">
      <div className={`relative overflow-hidden rounded-[15cqw] transition-colors duration-500 ${light ? 'bg-white' : 'bg-black'}`} style={{ aspectRatio: ratio }}>
        {layers.map((s, i) => {
          const top = i === layers.length - 1;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s}
              src={s}
              alt={top ? alt : ''}
              aria-hidden={!top}
              draggable={false}
              onLoad={() => setReady((r) => ({ ...r, [s]: true }))}
              onTransitionEnd={() => top && layers.length > 1 && setLayers([s])}
              className={`absolute inset-0 h-full w-full transition-opacity duration-500 ease-out ${ready[s] ? 'opacity-100' : 'opacity-0'}`}
            />
          );
        })}
        <div className={`absolute top-[4cqw] left-1/2 h-[8.2cqw] w-[28cqw] -translate-x-1/2 rounded-full transition-colors duration-500 ${light ? 'bg-black' : 'bg-[#1a1a1a]'}`} />
      </div>
    </div>
  );
}

type PhoneProps = { preview: string | null; full: string; light: boolean; ratio: number; caption: string };

export function Phone({ preview, full, light, ratio, caption }: PhoneProps) {
  // Expanded frame: as large as fits the viewport, capped for desktop.
  const W = `min(calc(100vw - 2rem), calc((100dvh - 9rem) * ${ratio}), 440px)`;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div className="mx-auto flex flex-col items-center gap-4">
        <button
          type="button"
          disabled={!preview}
          onClick={() => setOpen(true)}
          aria-label="Open full-screen preview"
          aria-haspopup="dialog"
          className="group w-[220px] cursor-zoom-in rounded-[38px] border border-line bg-surface p-[7px] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)] transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none hover:-translate-y-1 hover:border-muted/50 focus-visible:border-muted disabled:cursor-default disabled:hover:translate-y-0"
        >
          <Screen src={preview} light={light} ratio={ratio} alt="Live preview of the wallpaper" />
        </button>
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">tap to expand</span>
      </div>

      <dialog
        ref={dialog}
        aria-label="Wallpaper preview"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-fg backdrop:bg-bg/85 backdrop:backdrop-blur-md open:flex open:animate-[fade_220ms_ease-out] open:flex-col open:items-center open:justify-center open:gap-5"
      >
        {open && (
          <>
            <div
              className="animate-[rise_320ms_cubic-bezier(0.32,0.72,0,1)] border border-line bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)]"
              style={{ width: W, padding: `calc(${W} * 0.032)`, borderRadius: `calc(${W} * 0.173)` }}
            >
              <Screen src={full} placeholder={preview ?? undefined} light={light} ratio={ratio} alt="Full-size wallpaper preview" />
            </div>
            <div className="flex items-center gap-4 font-mono text-[12px] text-muted">
              <span className="tabular-nums">{caption}</span>
              <a href={full} target="_blank" rel="noopener" className="text-fg underline decoration-line underline-offset-4 transition-colors hover:decoration-muted">
                open image
              </a>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close preview"
          autoFocus
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full border border-line bg-surface text-muted transition-colors outline-none hover:text-fg focus-visible:border-muted sm:top-6 sm:right-6"
        >
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
            <path d="M2.5 2.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </dialog>
    </>
  );
}

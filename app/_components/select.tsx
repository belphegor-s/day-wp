'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type Option = { value: string; label: string; hint?: string };
export type Group = { label?: string; options: Option[] };

type Props = {
  value: string;
  onChange: (value: string) => void;
  groups: Group[];
  labelledBy: string;
  placeholder?: string;
  disabled?: boolean;
};

const PAGE = 10;

// A select-only combobox (WAI-ARIA APG pattern). Focus stays on the trigger;
// the listbox is driven through aria-activedescendant, like a native <select>.
export function Select({ value, onChange, groups, labelledBy, placeholder = 'Select…', disabled }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  const flat = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const offsets = useMemo(() => groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.options.length, 0)), [groups]);
  const selectedIndex = flat.findIndex((o) => o.value === value);
  const selected = flat[selectedIndex];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const [maxH, setMaxH] = useState(288);

  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });

  function show() {
    if (disabled || !flat.length) return;
    const rect = trigger.current!.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const flip = below < 300 && rect.top > below;
    setUp(flip);
    // Never taller than the room left on screen (small phones, landscape).
    setMaxH(Math.max(140, Math.min(288, (flip ? rect.top : below) - 16)));
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  function commit(i: number) {
    const o = flat[i];
    if (o && o.value !== value) onChange(o.value);
    hide();
  }

  // Keep the active option in view; center the selected one on open.
  useLayoutEffect(() => {
    if (!open) return;
    const el = document.getElementById(optionId(active));
    el?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  useLayoutEffect(() => {
    if (!open || !list.current) return;
    const el = document.getElementById(optionId(Math.max(selectedIndex, 0)));
    if (el) list.current.scrollTop = el.offsetTop - list.current.clientHeight / 2 + el.clientHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) hide();
    };
    const onResize = () => hide();
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  // Native-style type-ahead: consecutive keys within 600ms build a prefix;
  // repeating one letter cycles through matches.
  function typeahead(key: string) {
    const now = Date.now();
    const t = typed.current;
    t.text = now - t.at > 600 ? key : t.text + key;
    t.at = now;
    const q = t.text.toLowerCase();
    const cycling = q.length > 1 && [...q].every((c) => c === q[0]);
    const needle = cycling ? q[0] : q;
    const from = open ? active : Math.max(selectedIndex, 0);
    const start = cycling || q.length === 1 ? from + 1 : from;
    for (let k = 0; k < flat.length; k++) {
      const i = (start + k) % flat.length;
      if (flat[i].label.toLowerCase().startsWith(needle)) return i;
    }
    return -1;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = flat.length - 1;
    const typing = Date.now() - typed.current.at < 600 && typed.current.text.length > 0;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) || (e.altKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        show();
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        commit(e.key === 'Home' ? 0 : last);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = typeahead(e.key);
        if (i >= 0) commit(i);
      }
      return;
    }

    const move = (i: number) => {
      e.preventDefault();
      setActive(Math.min(Math.max(i, 0), last));
    };

    switch (e.key) {
      case 'ArrowDown':
        return move(active + 1);
      case 'ArrowUp':
        if (e.altKey) {
          e.preventDefault();
          return commit(active);
        }
        return move(active - 1);
      case 'Home':
        return move(0);
      case 'End':
        return move(last);
      case 'PageDown':
        return move(active + PAGE);
      case 'PageUp':
        return move(active - PAGE);
      case 'Enter':
        e.preventDefault();
        return commit(active);
      case ' ':
        if (typing) break;
        e.preventDefault();
        return commit(active);
      case 'Escape':
        e.preventDefault();
        return hide();
      case 'Tab':
        return commit(active);
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const i = typeahead(e.key);
      if (i >= 0) setActive(i);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-labelledby={labelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!root.current?.contains(e.relatedTarget as Node)) hide();
        }}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-surface px-3 py-2.5 text-left font-mono text-[13px] text-fg transition-colors outline-none disabled:cursor-default disabled:text-muted ${
          open ? 'border-muted' : 'border-line hover:border-muted/60 focus-visible:border-muted'
        }`}
      >
        <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        <span className="flex shrink-0 items-center gap-3">
          {selected?.hint && <span className="text-muted tabular-nums">{selected.hint}</span>}
          <svg viewBox="0 0 12 12" className={`size-3 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden>
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div
        ref={list}
        id={listId}
        role="listbox"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        hidden={!open}
        // Keep focus on the trigger when clicking options or dragging the scrollbar.
        onPointerDown={(e) => e.preventDefault()}
        style={{ maxHeight: maxH }}
        className={`scroll-thin absolute inset-x-0 z-30 overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-line bg-surface p-1 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] ${
          up ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
        } ${open ? 'animate-[pop_140ms_ease-out]' : ''}`}
      >
        {groups.map((g, gi) => (
          <div key={g.label ?? gi} role={g.label ? 'group' : undefined} aria-label={g.label} className={gi > 0 && !g.label ? 'mt-1 border-t border-line pt-1' : undefined}>
            {g.label && <div className="sticky -top-1 z-10 bg-surface px-2.5 pt-2.5 pb-1 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{g.label}</div>}
            {g.options.map((o, oi) => {
              const i = offsets[gi] + oi;
              const isSelected = o.value === value;
              return (
                <div
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => i !== active && setActive(i)}
                  onClick={() => commit(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-1.5 font-mono text-[13px] ${i === active ? 'bg-line text-fg' : isSelected ? 'text-fg' : 'text-muted'}`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`size-1.5 shrink-0 rounded-full ${isSelected ? 'bg-accent' : 'bg-transparent'}`} aria-hidden />
                    <span className="truncate">{o.label}</span>
                  </span>
                  {o.hint && <span className="shrink-0 text-muted tabular-nums">{o.hint}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

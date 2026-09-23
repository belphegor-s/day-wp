import Link from 'next/link';
import { Builder, YearMeter } from './_components/builder';
import { DotField } from './_components/dot-field';
import { devices } from './_lib/devices';

const repo = 'https://github.com/belphegor-s/day-wp';
const author = 'https://github.com/belphegor-s';

const params = [
  { name: 'w', type: 'integer', default: '1179', desc: 'Image width in pixels. Clamped to 200–4096.' },
  { name: 'h', type: 'integer', default: '2556', desc: 'Image height in pixels. Clamped to 200–4096.' },
  { name: 'tz', type: 'IANA zone', default: 'UTC', desc: 'Decides when your day starts and how far today’s dot has filled. e.g. Asia/Kolkata, America/New_York. Unknown zones fall back to UTC.' },
  { name: 'theme', type: 'dark | light', default: 'dark', desc: 'Black canvas with white days, or white canvas with black days.' },
];

function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" className="fill-fg" />
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => {
          const i = row * 3 + col;
          const cx = 16.76 + col * 15.24;
          const cy = 16.76 + row * 15.24;
          if (i === 4) {
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="5.49" className="fill-bg opacity-25" />
                <path d="M32 32L32 26.51A5.49 5.49 0 1 1 27.37 34.91Z" className="fill-accent" />
              </g>
            );
          }
          return <circle key={i} cx={cx} cy={cy} r="5.49" className={i < 4 ? 'fill-bg' : 'fill-bg opacity-25'} />;
        }),
      )}
    </svg>
  );
}

function Dot({ kind }: { kind: 'past' | 'today' | 'ahead' }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0" aria-hidden>
      <circle cx="6" cy="6" r="6" className={kind === 'past' ? 'fill-fg' : 'fill-pending'} />
      {kind === 'today' && <path d="M6 6L6 0A6 6 0 1 1 0.94 9.2Z" className="fill-accent" />}
    </svg>
  );
}

const footerLink = 'text-fg underline decoration-line underline-offset-4 transition-colors hover:decoration-muted';

function Label({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-8 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">{children}</h2>;
}

export default function Home() {
  return (
    <>
      <DotField />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[880px] flex-col px-4 sm:px-8">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Mark className="size-6" />
            <span className="font-serif text-[22px] leading-none">Day</span>
          </Link>
          <YearMeter />
        </header>

        <main className="flex-1">
          <section className="pt-20 pb-24 sm:pt-28">
            <h1 className="font-serif text-[clamp(44px,9vw,84px)] leading-[0.98] tracking-[-0.01em]">
              The year,
              <br />
              <em>one dot at a time.</em>
            </h1>
            <p className="mt-8 max-w-[34rem] text-[17px] leading-relaxed text-muted">
              A lock-screen wallpaper that redraws itself. Every day of the year is a dot. The ones behind you are filled in, and today fills by the hour. No app, just a URL your phone fetches.
            </p>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[14px] text-muted">
              <li className="flex items-center gap-2.5">
                <Dot kind="past" /> lived
              </li>
              <li className="flex items-center gap-2.5">
                <Dot kind="today" /> today, by the hour
              </li>
              <li className="flex items-center gap-2.5">
                <Dot kind="ahead" /> still ahead
              </li>
            </ul>
          </section>

          <section className="border-t border-line py-20">
            <Label>Make yours</Label>
            <Builder />
          </section>

          <section className="border-t border-line py-20">
            <Label>Endpoint</Label>
            <div className="rounded-lg border border-line bg-surface px-4 py-3 font-mono text-[14px]">
              <span className="text-accent">GET</span> /wallpaper<span className="text-muted">?w=&amp;h=&amp;tz=&amp;theme=</span>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Returns a PNG rendered at request time. Responses are sent with <code className="font-mono text-[13px] text-fg">Cache-Control: no-store</code>, so every fetch is current. All parameters
              are optional.
            </p>

            <div className="mt-10 divide-y divide-line border-y border-line">
              {params.map((p) => (
                <div key={p.name} className="grid gap-2 py-5 sm:grid-cols-[120px_1fr] sm:gap-8">
                  <div className="font-mono text-[14px]">{p.name}</div>
                  <div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12px] text-muted">
                      <span>{p.type}</span>
                      <span>
                        default <span className="text-fg">{p.default}</span>
                      </span>
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-14 mb-5 text-[15px]">Common sizes</h3>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {devices.map((d) => (
                <div key={d.id} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-[14px]">
                  <span className="text-muted">{d.label}</span>
                  <span className="shrink-0 font-mono text-[13px] tabular-nums">
                    {d.w}×{d.h}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="mt-14 mb-5 text-[15px]">Examples</h3>
            <div className="flex flex-col gap-2 font-mono text-[13px]">
              {['/wallpaper', '/wallpaper?tz=Asia/Kolkata', '/wallpaper?w=1320&h=2868&tz=Europe/Berlin', '/wallpaper?theme=light&tz=America/New_York'].map((ex) => (
                <a key={ex} href={ex} target="_blank" className="w-fit text-muted underline decoration-line underline-offset-4 transition-colors hover:text-fg hover:decoration-muted">
                  {ex}
                </a>
              ))}
            </div>
          </section>

          <section className="border-t border-line py-20">
            <Label>Set it once</Label>
            <div className="grid gap-12 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 text-[15px]">iPhone · Shortcuts</h3>
                <ol className="flex list-decimal flex-col gap-3 pl-5 text-[15px] leading-relaxed text-muted marker:font-mono marker:text-[12px]">
                  <li>Open Shortcuts → Automation → New → Time of Day. Pick 00:01, repeat daily, run immediately.</li>
                  <li>
                    Add <span className="text-fg">Get Contents of URL</span> and paste your URL.
                  </li>
                  <li>
                    Add <span className="text-fg">Set Wallpaper Photo</span>, choose Lock Screen, turn off Crop to Subject and Show Preview.
                  </li>
                  <li>Want today’s dot to fill through the day? Add a few more times. Every few hours works well.</li>
                </ol>
              </div>
              <div>
                <h3 className="mb-4 text-[15px]">Android</h3>
                <ol className="flex list-decimal flex-col gap-3 pl-5 text-[15px] leading-relaxed text-muted marker:font-mono marker:text-[12px]">
                  <li>Use any automation app that can fetch an image and set it as wallpaper: MacroDroid, Tasker or Automate.</li>
                  <li>Trigger on a daily schedule, download your URL, then set it as the lock screen.</li>
                </ol>
              </div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-3 border-t border-line py-8 font-mono text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Open source.{' '}
            <a href={repo} target="_blank" rel="noopener" title="Read the source on GitHub" className={footerLink}>
              belphegor-s/day-wp
            </a>
          </span>
          <span>
            Made by{' '}
            <a href={author} target="_blank" rel="noopener author" title="Ayush Sharma on GitHub" className={footerLink}>
              Ayush Sharma
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}

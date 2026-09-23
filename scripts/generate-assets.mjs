// Generates every static asset in public/assets from the SVG sources below.
// Run: node scripts/generate-assets.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'assets');

const INK = '#0B0B0A';
const PAPER = '#EDEDEA';
const PENDING = '#2A2A28';
const ACTIVE = '#EF4444';

// Minimal element factory so this runs as plain Node without a JSX step.
const h = (type, props, ...children) => ({ type, props: { ...props, children: children.length > 1 ? children : children[0] } });

// A 3×3 slice of the wallpaper: four days lived, today two-thirds through, four ahead.
function mark({ size = 64, rounded = true, pad = 0 } = {}) {
  const s = 64;
  const inner = s - pad * 2;
  const step = inner / 4.2;
  const r = step * 0.36;
  const c = s / 2;
  const pos = [c - step, c, c + step];

  const progress = 0.66;
  const a = ((progress * 360 - 90) * Math.PI) / 180;
  const ex = (c + r * Math.cos(a)).toFixed(3);
  const ey = (c + r * Math.sin(a)).toFixed(3);

  const dots = [];
  let i = 0;
  for (const y of pos) {
    for (const x of pos) {
      if (i === 4) {
        dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${PENDING}"/>`);
        dots.push(`<path d="M${c} ${c}L${c} ${(c - r).toFixed(3)}A${r} ${r} 0 1 1 ${ex} ${ey}Z" fill="${ACTIVE}"/>`);
      } else {
        dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${i < 4 ? PAPER : PENDING}"/>`);
      }
      i++;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}"><rect width="${s}" height="${s}" rx="${rounded ? 15 : 0}" fill="${INK}"/>${dots.join('')}</svg>`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * (size / 64) * 2 })
    .resize(size, size)
    .png()
    .toBuffer();

// ICO with embedded PNG frames (supported by every modern browser).
function ico(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const dir = Buffer.alloc(16 * frames.length);
  let offset = 6 + dir.length;
  frames.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...frames.map((f) => f.data)]);
}

async function googleFont(family, weight = 400, italic = false) {
  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axis}`)).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Font not found: ${family}`);
  return (await fetch(url)).arrayBuffer();
}

async function og() {
  const [serif, serifItalic, mono] = await Promise.all([googleFont('Instrument Serif'), googleFont('Instrument Serif', 400, true), googleFont('Geist Mono')]);

  const cols = 25;
  const total = 365;
  const today = 266;
  const gap = 19;
  const r = 5.5;
  const rows = Math.ceil(total / cols);
  const dots = [];
  for (let d = 1; d <= total; d++) {
    const cx = r + ((d - 1) % cols) * gap;
    const cy = r + Math.floor((d - 1) / cols) * gap;
    if (d === today) {
      const a = ((0.66 * 360 - 90) * Math.PI) / 180;
      dots.push(h('circle', { cx, cy, r, fill: PENDING }));
      dots.push(h('path', { d: `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}Z`, fill: ACTIVE }));
    } else {
      dots.push(h('circle', { cx, cy, r, fill: d < today ? PAPER : PENDING }));
    }
  }
  const gw = (cols - 1) * gap + r * 2;
  const gh = (rows - 1) * gap + r * 2;

  const muted = { display: 'flex', fontFamily: 'Mono', color: '#8A8A85' };
  const res = new ImageResponse(
    h(
      'div',
      { style: { width: 1200, height: 630, background: INK, display: 'flex', padding: 80, justifyContent: 'space-between', alignItems: 'center' } },
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', width: 540, height: '100%', justifyContent: 'space-between' } },
        h('div', { style: { ...muted, fontSize: 18, letterSpacing: 2 } }, 'DAY · WALLPAPER'),
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          h('div', { style: { display: 'flex', fontFamily: 'Serif', fontSize: 84, lineHeight: 1, color: PAPER } }, 'The year,'),
          h('div', { style: { display: 'flex', fontFamily: 'SerifItalic', fontSize: 84, lineHeight: 1.05, color: PAPER } }, 'one dot at a time.'),
          h('div', { style: { ...muted, marginTop: 28, fontSize: 20, lineHeight: 1.5 } }, 'A lock screen that redraws itself. Every day lived, today filling by the hour.'),
        ),
      ),
      h('svg', { width: gw, height: gh, viewBox: `0 0 ${gw} ${gh}` }, ...dots),
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Serif', data: serif, weight: 400, style: 'normal' },
        { name: 'SerifItalic', data: serifItalic, weight: 400, style: 'italic' },
        { name: 'Mono', data: mono, weight: 400, style: 'normal' },
      ],
    },
  );
  return Buffer.from(await res.arrayBuffer());
}

async function write(name, data) {
  const file = join(out, name);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, data);
  console.log('✓', name);
}

const rounded = mark();
const square = mark({ rounded: false });
const maskable = mark({ rounded: false, pad: 10 });

await write('icon.svg', rounded);
await write('icon-maskable.svg', maskable);
await write('favicon.svg', rounded);
await write('favicon-16x16.png', await png(rounded, 16));
await write('favicon-32x32.png', await png(rounded, 32));
await write('favicon-48x48.png', await png(rounded, 48));
await write('favicon.ico', ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })))));
await write('apple-touch-icon.png', await png(square, 180));
await write('icon-192.png', await png(rounded, 192));
await write('icon-512.png', await png(rounded, 512));
await write('icon-1024.png', await png(rounded, 1024));
await write('icon-maskable-512.png', await png(maskable, 512));

const ogPng = await og();
await write('og.png', ogPng);
await write('og.jpg', await sharp(ogPng).jpeg({ quality: 90 }).toBuffer());
await write('twitter.png', ogPng);

await write(
  'site.webmanifest',
  JSON.stringify(
    {
      name: 'Day Wallpaper',
      short_name: 'Day',
      description: 'A lock-screen wallpaper that counts the year, one dot per day.',
      start_url: '/',
      display: 'standalone',
      background_color: INK,
      theme_color: INK,
      icons: [
        { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/assets/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/assets/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    },
    null,
    2,
  ) + '\n',
);

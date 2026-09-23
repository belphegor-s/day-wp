import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const sans = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

const title = 'Day — the year, one dot at a time';
const description = 'A lock-screen wallpaper that redraws itself. Every day of the year is a dot: the ones behind you filled, today filling by the hour. One URL, no app.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: '%s · Day' },
  description,
  applicationName: 'Day Wallpaper',
  authors: [{ name: 'Ayush Sharma' }],
  creator: 'Ayush Sharma',
  keywords: ['wallpaper', 'year progress', 'lock screen', 'iPhone wallpaper', 'dot calendar', 'memento mori', 'iOS Shortcuts'],
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/assets/favicon.ico', sizes: '48x48' },
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/assets/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/assets/site.webmanifest',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Day Wallpaper',
    title,
    description,
    images: [{ url: '/assets/og.png', width: 1200, height: 630, alt: 'A grid of 365 dots, most filled, one half-filled in red for today.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/assets/twitter.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0B0A' },
    { media: '(prefers-color-scheme: light)', color: '#F6F5F1' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}>{children}</body>
    </html>
  );
}

import type { NextConfig } from 'next';

// The wallpaper used to be served from `/`. Keep existing Shortcuts/automations
// working by forwarding any wallpaper query to its new home.
const legacyParams = ['w', 'h', 'tz', 'theme'];

const nextConfig: NextConfig = {
  async redirects() {
    return legacyParams.map((key) => ({
      source: '/',
      has: [{ type: 'query' as const, key }],
      destination: '/wallpaper',
      permanent: true,
    }));
  },
};

export default nextConfig;

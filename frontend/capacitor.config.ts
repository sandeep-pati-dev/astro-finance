import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sandeep.astrofinance',
  appName: 'Astro Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

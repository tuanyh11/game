import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuanyh.game',
  appName: 'Pixel Empires',
  webDir: 'dist',
  ios: {
    // Force landscape orientation
    preferredContentMode: 'mobile',
    backgroundColor: '#000000',
  },
  // ⚡ Live Reload — iOS app connects to Vite dev server
  // Uncomment the 'server' block below during development,
  // comment it out before production build.
  server: {
    // Replace with your Mac's local IP (run: ipconfig getifaddr en0)
    url: 'http://localhost:5173',
    cleartext: true, // Allow HTTP (not HTTPS)
  },
};

export default config;

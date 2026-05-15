import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surakshasetu.app',
  appName: 'Suraksha-Setu',
  webDir: 'dist/client',
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
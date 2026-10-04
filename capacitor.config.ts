import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abubakacarrentservice.app',
  appName: 'Abubakar Car Rental Service',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

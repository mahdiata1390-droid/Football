import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.schoolfootball.app',
  appName: 'School Football',
  webDir: 'public',
  server: {
    url: 'https://school-football.vercel.app',
    cleartext: false
  },
  android: {
    backgroundColor: '#07111f'
  }
};

export default config;

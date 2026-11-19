import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.forastha.player',
  appName: 'for astha',
  webDir: 'dist',
  backgroundColor: '#e5e5e5',
  android: {
    backgroundColor: '#e5e5e5',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
      style: 'LIGHT',
    },
  },
}

export default config

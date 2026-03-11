import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import checker from 'vite-plugin-checker'
import { getLicenseBanner } from './build-utils/license'
import pkg from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: `"${pkg.version}"`,
  },
  server: {
    cors: false,
  },
  plugins: [
    checker({
      typescript: {
        tsconfigPath: './tsconfig.worker.json',
      },
    }),
    cloudflare(),
  ],
  esbuild: {
    banner: getLicenseBanner('Cloudflare Worker Proxy Integration'),
  },
})

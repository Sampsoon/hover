import { defineConfig, mergeConfig } from 'vite';
import { crx, ManifestV3Export } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';
import baseConfig from './vite.config.base';

export default defineConfig(
  mergeConfig(baseConfig, {
    plugins: [
      crx({
        manifest: manifest as ManifestV3Export,
        browser: 'chrome',
      }),
    ],
    build: {
      outDir: 'dist_chrome',
    },
  }),
);

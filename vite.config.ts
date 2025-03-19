import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        onUserDictateWorker: resolve(__dirname, 'src/serviceWorkers/onUserDictateWorker.ts'),
        keyListener: resolve(__dirname, 'src/contentScripts/keyListener.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const serviceWorkers = ['onUserDictateWorker'];
          const contentScripts = ['keyListener'];

          if (serviceWorkers.includes(chunkInfo.name)) {
            return 'serviceWorkers/[name].js';
          } else if (contentScripts.includes(chunkInfo.name)) {
            return 'contentScripts/[name].js';
          } else {
            return 'assets/[name]-[hash].js';
          }
        },
      },
    },
    copyPublicDir: true,
  },
});

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
        // TODO: make this dynamic
        onUserDictateWorker: resolve(__dirname, 'src/onUserDictateWorker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const serviceWorkers = ['onUserDictateWorker'];
          return serviceWorkers.includes(chunkInfo.name) ? '[name].js' : 'assets/[name]-[hash].js';
        },
      },
    },
    copyPublicDir: true,
  },
});

import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: './',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8096,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    allowedHosts: true,
    fs: {
      allow: ['../..'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

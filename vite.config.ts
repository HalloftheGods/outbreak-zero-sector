import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';
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
    port: 8094,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    fs: {
      allow: ['../..'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

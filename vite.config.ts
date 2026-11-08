import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// in development, forward /api calls to the node server (npm run dev:server)
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:3000' } },
  build: { outDir: 'dist' },
});

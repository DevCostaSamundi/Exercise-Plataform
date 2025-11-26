// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // liga em 0.0.0.0 para Codespaces / hosts remotos
    port: 5173,
    proxy: {
      // encaminha /api para o backend (HTTP)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // encaminha socket.io (WebSocket)
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    },
  },
});
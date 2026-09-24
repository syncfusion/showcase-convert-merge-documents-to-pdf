import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read .env values (VITE_PROXY_TARGET etc.) in the dev server config.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    server: {
      port: 5173,
      open: true,
      // Dev proxy: /Merge → backend. Target is read from .env (VITE_PROXY_TARGET).
      proxy: {
        '/Merge': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:5183',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

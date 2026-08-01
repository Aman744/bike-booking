import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        'shared': path.resolve(__dirname, '../shared/src/index.ts'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});

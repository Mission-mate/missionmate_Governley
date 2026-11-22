import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Data adapter shared with the Supabase edge functions (one copy of the code).
      '@b44': fileURLToPath(new URL('./supabase/functions/_shared/b44', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 4000,
  },
});

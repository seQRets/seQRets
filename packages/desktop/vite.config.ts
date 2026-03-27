import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', '@seqrets/crypto', 'shamir-secret-sharing'],
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      external: ['html2canvas'],
      output: {
        manualChunks(id) {
          // Exclude html2canvas (jsPDF optional dep, unused)
          if (id.includes('html2canvas')) return undefined;
          // PDF generation (lazy-loaded via inheritance page)
          if (id.includes('jspdf') || id.includes('fflate') || id.includes('fast-png')) return 'pdf';
          // Crypto libs
          if (id.includes('@seqrets/crypto') || id.includes('shamir-secret-sharing') || id.includes('@noble/')) return 'crypto';
          // React core
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) return 'ui';
          // Google Generative AI (Bob chat)
          if (id.includes('@google/generative-ai')) return 'gemini';
          // DOMPurify
          if (id.includes('dompurify')) return 'sanitize';
        },
      },
    },
  },
});

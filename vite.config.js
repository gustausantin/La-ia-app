
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries - más granular
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'clsx'],
          'vendor-logging': ['winston', 'winston-daily-rotate-file']
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name && chunkInfo.name.startsWith('vendor-')) {
            return 'vendor/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        }
      }
    },
    chunkSizeWarningLimit: 500 // Mantener límite estricto para chunks grandes
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true
  }
});

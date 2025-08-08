
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: "0.0.0.0",
    allowedHosts: true,
    hmr: {
      port: 5000,
      host: "0.0.0.0",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5000,
    host: "0.0.0.0",
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  },
});

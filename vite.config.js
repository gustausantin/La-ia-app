
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: ["7fa71e82-53a4-4e1e-82a1-c655249eb89b-00-2wl7uivadzug4.kirk.replit.dev", "localhost", "0.0.0.0", ".replit.dev"],
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  preview: {
    port: 5173,
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

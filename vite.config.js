
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 🚀 OPTIMIZACIÓN AVANZADA DE CHUNKS
          
          // Vendor libraries críticas - cargar primero
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react-core';
          }
          
          // Router y navegación
          if (id.includes('react-router')) {
            return 'vendor-navigation';
          }
          
          // Charts y visualización - lazy load
          if (id.includes('recharts') || id.includes('chart.js') || id.includes('d3')) {
            return 'vendor-charts';
          }
          
          // UI y animaciones
          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast')) {
            return 'vendor-ui-animations';
          }
          
          // Formularios y validación
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'vendor-forms';
          }
          
          // Supabase y networking
          if (id.includes('@supabase') || id.includes('supabase')) {
            return 'vendor-supabase';
          }
          
          // Utilidades de fecha y formato
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('classnames')) {
            return 'vendor-utils';
          }
          
          // Analytics y IA (lazy load)
          if (id.includes('analytics') || id.includes('ai') || id.includes('tensorflow')) {
            return 'vendor-ai';
          }
          
          // Componentes grandes - separar en chunks independientes
          if (id.includes('/pages/Analytics')) return 'page-analytics';
          if (id.includes('/pages/Comunicacion')) return 'page-comunicacion';
          if (id.includes('/pages/Dashboard')) return 'page-dashboard';
          if (id.includes('/pages/Mesas')) return 'page-mesas';
          if (id.includes('/pages/Reservas')) return 'page-reservas';
          
          // Componentes de comunicación
          if (id.includes('/components/comunicacion')) return 'component-comunicacion';
          if (id.includes('/components/analytics')) return 'component-analytics';
          
          // Node modules genéricos
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          
          // Chunks por feature
          if (id.includes('/stores/')) return 'stores';
          if (id.includes('/hooks/')) return 'hooks';
          if (id.includes('/utils/')) return 'utils';
        },
        chunkFileNames: (chunkInfo) => {
          // 📁 ESTRUCTURA OPTIMIZADA DE ARCHIVOS
          const name = chunkInfo.name;
          
          if (name.startsWith('vendor-')) {
            return 'assets/vendor/[name]-[hash].js';
          }
          if (name.startsWith('page-')) {
            return 'assets/pages/[name]-[hash].js';
          }
          if (name.startsWith('component-')) {
            return 'assets/components/[name]-[hash].js';
          }
          
          return 'assets/chunks/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          // 🎨 ORGANIZAR ASSETS POR TIPO
          const extType = assetInfo.name.split('.').pop();
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/css/i.test(extType)) {
            return 'assets/styles/[name]-[hash][extname]';
          }
          if (/woff2?|ttf|eot/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          
          return 'assets/misc/[name]-[hash][extname]';
        }
      }
    },
    chunkSizeWarningLimit: 500, // Mantener límite estricto
    
    // 🔧 OPTIMIZACIONES ADICIONALES
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.logs en producción
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn']
      },
      mangle: {
        safari10: true
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    // 🛡️ Headers de seguridad para desarrollo
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
});

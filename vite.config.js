
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
                // 🚀 BUNDLE SPLITTING SIMPLIFICADO - EVITA ERRORES
                
                // Separar solo las librerías más grandes
                if (id.includes('node_modules')) {
                  if (id.includes('react') || id.includes('react-dom')) {
                    return 'vendor-react';
                  }
                  if (id.includes('recharts') || id.includes('chart')) {
                    return 'vendor-charts';
                  }
                  if (id.includes('@supabase') || id.includes('supabase')) {
                    return 'vendor-supabase';
                  }
                  // Todas las demás dependencias en un chunk
                  return 'vendor';
                }
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

// Configuración FORZADA de Supabase para Vercel
// Este archivo garantiza que las credenciales siempre estén disponibles

export const SUPABASE_CONFIG = {
  url: 'https://ktsqwvhqamedpmzkzjaz.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU'
};

// Función para obtener la configuración con prioridad
export function getSupabaseConfig() {
  // Intentar variables de entorno primero
  const envUrl = typeof window === 'undefined' 
    ? process.env.SUPABASE_URL 
    : import.meta.env.VITE_SUPABASE_URL;
    
  const envKey = typeof window === 'undefined'
    ? process.env.SUPABASE_ANON_KEY
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Si las variables de entorno existen, usarlas
  if (envUrl && envKey) {
    console.log('✅ Usando variables de entorno');
    return {
      url: envUrl,
      anonKey: envKey
    };
  }

  // Si no, usar configuración hardcoded
  console.log('⚠️ Variables de entorno no encontradas, usando configuración hardcoded');
  return {
    url: SUPABASE_CONFIG.url,
    anonKey: SUPABASE_CONFIG.anonKey
  };
}

// lib/supabase.js - Configuración avanzada para La-IA
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { log } from "../utils/logger.js";

// Configuración de variables de entorno con fallback hardcoded temporal
let supabaseUrl, supabaseKey;

if (typeof window === 'undefined') {
  // Estamos en el servidor (Node.js) - usar variables sin prefijo VITE_
  supabaseUrl = process.env.SUPABASE_URL || 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
  supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';

  log.debug('🔍 Variables del servidor:');
  log.debug('SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Falta');
  log.debug('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Presente' : '❌ Falta');
} else {
  // Estamos en el cliente (browser) - usar variables con prefijo VITE_ con fallback
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';
}

if (!supabaseUrl || !supabaseKey) {
  log.error("❌ Fallan credenciales de Supabase");
  if (typeof window === 'undefined') {
    log.error("Servidor necesita: SUPABASE_URL y SUPABASE_ANON_KEY en .env");
  } else {
    log.error("Cliente necesita: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
  }
  // No lanzar error, usar las credenciales hardcoded
}

// Cliente con configuración enterprise
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configuración enterprise para tokens
    storageKey: 'la-ia-auth-token',
    flowType: 'pkce',
    // Evitar errores de refresh en production
    debug: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  }
});

// Verificación silenciosa de conexión
supabase
  .from('restaurants')
  .select('count', { count: 'exact', head: true })
  .then(() => {
    if (typeof window !== 'undefined') {
      log.info('🚀 Supabase conectado correctamente');
    }
  })
  .catch((error) => {
    if (typeof window !== 'undefined') {
      log.error('❌ Error conectando Supabase:', error.message);
    }
  });

export default supabase;
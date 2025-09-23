// lib/supabase.js - Configuración avanzada para La-IA
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { log } from "../utils/logger.js";

// Configuración de variables de entorno
let supabaseUrl, supabaseKey;

if (typeof window === 'undefined') {
  // Estamos en el servidor (Node.js) - usar variables sin prefijo VITE_
  supabaseUrl = process.env.SUPABASE_URL;
  supabaseKey = process.env.SUPABASE_ANON_KEY;

  log.debug('🔍 Variables del servidor:');
  log.debug('SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Falta');
  log.debug('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Presente' : '❌ Falta');
} else {
  // Estamos en el cliente (browser) - usar variables con prefijo VITE_
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  log.error("❌ Fallan credenciales de Supabase");
  if (typeof window === 'undefined') {
    log.error("Servidor necesita: SUPABASE_URL y SUPABASE_ANON_KEY en .env");
  } else {
    log.error("Cliente necesita: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
  }
  throw new Error("Supabase credentials are missing");
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
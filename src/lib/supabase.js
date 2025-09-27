// lib/supabase.js - Configuración avanzada para La-IA
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { log } from "../utils/logger.js";
import { getSupabaseConfig } from "../config/supabase-config.js";

// Obtener configuración garantizada
const config = getSupabaseConfig();
const supabaseUrl = config.url;
const supabaseKey = config.anonKey;

log.debug('🔍 Configuración Supabase:');
log.debug('URL:', supabaseUrl ? '✅ Configurada' : '❌ Falta');
log.debug('Key:', supabaseKey ? '✅ Configurada' : '❌ Falta');

// Cliente con configuración enterprise y headers forzados
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configuración enterprise para tokens
    storageKey: 'la-ia-auth-token',
    flowType: 'pkce',
    // Evitar errores de refresh en production
    debug: true // Activamos debug para ver qué pasa
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
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
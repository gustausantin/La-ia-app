// lib/supabase.js - Configuración avanzada para La-IA
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

// Configuración de variables de entorno
let supabaseUrl, supabaseKey;

if (typeof window === 'undefined') {
  // Estamos en el servidor (Node.js) - usar variables sin prefijo VITE_
  supabaseUrl = process.env.SUPABASE_URL;
  supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('🔍 Variables del servidor:');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Presente' : '❌ Falta');
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ Presente' : '❌ Falta');
} else {
  // Estamos en el cliente (browser) - usar variables con prefijo VITE_
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Fallan credenciales de Supabase");
  if (typeof window === 'undefined') {
    console.error("Servidor necesita: SUPABASE_URL y SUPABASE_ANON_KEY en .env");
  } else {
    console.error("Cliente necesita: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env");
  }
  throw new Error("Supabase credentials are missing");
}

// Crear cliente Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // PKCE flow para mayor seguridad
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "X-Client-Info": "la-ia@1.0.0",
    },
  },
});

// Verificar conexión al inicializar
supabase
  .from("restaurants")
  .select("count", { count: "exact", head: true })
  .then(() => {
    console.log("🚀 La-IA: Cliente Supabase inicializado correctamente");
  })
  .catch((error) => {
    console.error("❌ Error al conectar con Supabase:", error);
    if (typeof window !== 'undefined') {
      toast.error("Error de conexión con la base de datos");
    }
  });

export default supabase;
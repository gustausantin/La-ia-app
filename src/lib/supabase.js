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

// Cliente simple
export const supabase = createClient(supabaseUrl, supabaseKey);

// Verificación silenciosa de conexión
supabase
  .from('restaurants')
  .select('count', { count: 'exact', head: true })
  .then(() => {
    if (typeof window !== 'undefined') {
      console.log('🚀 Supabase conectado correctamente');
    }
  })
  .catch((error) => {
    if (typeof window !== 'undefined') {
      console.error('❌ Error conectando Supabase:', error.message);
    }
  });

export default supabase;
// Interceptor para asegurar autenticación en todas las requests
import { supabase } from './supabase.js';

// Función para asegurar que todas las queries tengan autenticación
export function createAuthenticatedQuery() {
  return {
    // Wrapper para queries que requieren autenticación
    async query(table, options = {}) {
      try {
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError);
        }

        // Crear query base
        let query = supabase.from(table);
        
        // Aplicar opciones de select
        if (options.select) {
          query = query.select(options.select);
        }
        
        // Aplicar filtros
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (key.includes('eq.')) {
              const [field] = key.split('.');
              query = query.eq(field, value);
            }
          });
        }

        // Ejecutar query con headers forzados
        const result = await query;
        
        if (result.error) {
          console.error(`❌ Error en query ${table}:`, result.error);
          
          // Si es error 401, intentar refrescar sesión
          if (result.error.code === '401' || result.error.message?.includes('JWT')) {
            console.log('🔄 Intentando refrescar sesión...');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('❌ Error refrescando sesión:', refreshError);
            } else {
              console.log('✅ Sesión refrescada, reintentando query...');
              // Reintentar la query
              return await query;
            }
          }
        }

        return result;
      } catch (error) {
        console.error(`💥 Error crítico en query ${table}:`, error);
        return { data: null, error };
      }
    },

    // Wrapper para RPC calls
    async rpc(functionName, params = {}) {
      try {
        const result = await supabase.rpc(functionName, params);
        
        if (result.error) {
          console.error(`❌ Error en RPC ${functionName}:`, result.error);
          
          // Si es error 401, intentar refrescar sesión
          if (result.error.code === '401' || result.error.message?.includes('JWT')) {
            console.log('🔄 Intentando refrescar sesión para RPC...');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (!refreshError) {
              console.log('✅ Sesión refrescada, reintentando RPC...');
              return await supabase.rpc(functionName, params);
            }
          }
        }

        return result;
      } catch (error) {
        console.error(`💥 Error crítico en RPC ${functionName}:`, error);
        return { data: null, error };
      }
    }
  };
}

// Instancia global del interceptor
export const authQuery = createAuthenticatedQuery();

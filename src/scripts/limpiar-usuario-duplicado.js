// Script para limpiar usuarios duplicados y permitir registro limpio
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://ktsqwvhqamedpmzkzjaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function limpiarUsuariosDuplicados() {
  console.log('🧹 LIMPIANDO USUARIOS DUPLICADOS');
  console.log('=====================================');
  
  const emailsALimpiar = [
    'gustausantin@gmail.com',
    'frontend-test-1758533694614@example.com',
    'test-1758533618950@example.com'
  ];

  for (const email of emailsALimpiar) {
    try {
      console.log(`\n🔍 Buscando usuario: ${email}`);
      
      // 1. Buscar el usuario por email
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.log('❌ Error listando usuarios:', listError.message);
        continue;
      }

      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        console.log('✅ Usuario no encontrado - ya limpio');
        continue;
      }

      console.log('👤 Usuario encontrado:', user.id);

      // 2. Eliminar relaciones usuario-restaurante
      const { error: mappingError } = await supabaseAdmin
        .from('user_restaurant_mapping')
        .delete()
        .eq('auth_user_id', user.id);

      if (mappingError) {
        console.log('⚠️  Error eliminando mapping:', mappingError.message);
      } else {
        console.log('✅ Mapping eliminado');
      }

      // 3. Buscar restaurantes asociados y eliminarlos
      const { data: restaurants, error: restError } = await supabaseAdmin
        .from('restaurants')
        .select('id, name')
        .eq('email', email);

      if (restaurants && restaurants.length > 0) {
        for (const restaurant of restaurants) {
          console.log(`🏪 Eliminando restaurante: ${restaurant.name} (${restaurant.id})`);
          
          const { error: delRestError } = await supabaseAdmin
            .from('restaurants')
            .delete()
            .eq('id', restaurant.id);

          if (delRestError) {
            console.log('⚠️  Error eliminando restaurante:', delRestError.message);
          } else {
            console.log('✅ Restaurante eliminado');
          }
        }
      }

      // 4. Eliminar el usuario
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.log('❌ Error eliminando usuario:', deleteError.message);
      } else {
        console.log('✅ Usuario eliminado completamente');
      }

    } catch (error) {
      console.log(`❌ Error procesando ${email}:`, error.message);
    }
  }

  console.log('\n=====================================');
  console.log('🏁 LIMPIEZA COMPLETADA');
  console.log('✅ Ahora puedes registrarte sin problemas');
}

// Ejecutar limpieza
limpiarUsuariosDuplicados().catch(console.error);

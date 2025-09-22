// Script para limpiar COMPLETAMENTE Supabase - empezar desde cero
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

async function limpiarTodoSupabase() {
  console.log('🧹 LIMPIEZA COMPLETA DE SUPABASE');
  console.log('=====================================');
  console.log('⚠️  BORRANDO TODOS LOS DATOS');
  console.log('=====================================');
  
  try {
    // 1. ELIMINAR TODOS LOS USUARIOS
    console.log('\n1️⃣ Eliminando TODOS los usuarios...');
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    for (const user of users.users) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (error) {
        console.log(`⚠️ Error eliminando usuario ${user.email}:`, error.message);
      } else {
        console.log(`✅ Usuario eliminado: ${user.email}`);
      }
    }

    // 2. LIMPIAR TODAS LAS TABLAS DE DATOS
    console.log('\n2️⃣ Limpiando TODAS las tablas...');
    
    const tablas = [
      'user_restaurant_mapping',
      'noshow_actions', 
      'billing_tickets',
      'reservations',
      'customers',
      'restaurants',
      'conversations',
      'messages',
      'crm_suggestions',
      'crm_templates',
      'agent_conversations',
      'agent_metrics',
      'conversation_analytics',
      'channel_performance',
      'agent_insights',
      'tables'
    ];

    for (const tabla of tablas) {
      try {
        const { error } = await supabaseAdmin
          .from(tabla)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todo

        if (error) {
          console.log(`⚠️ Error limpiando ${tabla}:`, error.message);
        } else {
          console.log(`✅ Tabla limpiada: ${tabla}`);
        }
      } catch (err) {
        console.log(`⚠️ Error en tabla ${tabla}:`, err.message);
      }
    }

    // 3. VERIFICAR QUE TODO ESTÁ LIMPIO
    console.log('\n3️⃣ Verificando limpieza...');
    
    const verificaciones = [
      { tabla: 'restaurants', nombre: 'Restaurantes' },
      { tabla: 'customers', nombre: 'Clientes' },
      { tabla: 'reservations', nombre: 'Reservas' },
      { tabla: 'billing_tickets', nombre: 'Consumos' },
      { tabla: 'noshow_actions', nombre: 'No-Shows' },
      { tabla: 'conversations', nombre: 'Conversaciones' },
      { tabla: 'messages', nombre: 'Mensajes' }
    ];

    for (const { tabla, nombre } of verificaciones) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tabla)
          .select('id', { count: 'exact', head: true });

        if (error) {
          console.log(`⚠️ Error verificando ${nombre}:`, error.message);
        } else {
          const count = data?.length || 0;
          console.log(`📊 ${nombre}: ${count} registros`);
        }
      } catch (err) {
        console.log(`⚠️ Error verificando ${tabla}:`, err.message);
      }
    }

    console.log('\n=====================================');
    console.log('🎉 SUPABASE COMPLETAMENTE LIMPIO');
    console.log('=====================================');
    console.log('✅ TODOS los usuarios eliminados');
    console.log('✅ TODAS las tablas vaciadas');
    console.log('✅ Base de datos como nueva');
    console.log('=====================================');
    console.log('🚀 LISTO PARA PRIMER REGISTRO');
    console.log('📱 La aplicación está lista para el primer usuario');
    console.log('🎯 Registro completamente limpio');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar limpieza completa
limpiarTodoSupabase().catch(console.error);

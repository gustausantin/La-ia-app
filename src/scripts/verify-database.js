#!/usr/bin/env node

/**
 * 🔍 VERIFICADOR DE BASE DE DATOS SUPABASE
 * Script para verificar conexión y estado de tablas
 */

import { createClient } from '@supabase/supabase-js';

// Variables de entorno - cambiar por las tuyas
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key';

console.log('🔍 Verificando conexión a Supabase...\n');

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Lista de tablas requeridas
const requiredTables = [
  'profiles',
  'restaurants', 
  'tables',
  'customers',
  'reservations',
  'conversations',
  'messages',
  'notifications',
  'daily_metrics',
  'analytics_historical',
  'staff',
  'inventory_items',
  'message_templates',
  'restaurant_settings'
];

async function verifyConnection() {
  try {
    console.log('📡 Probando conexión...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión exitosa a Supabase');
    return true;
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

async function verifyTables() {
  console.log('\n📋 Verificando tablas...');
  
  const results = [];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        results.push({ table, exists: false, error: error.message });
      } else {
        console.log(`✅ ${table}: OK`);
        results.push({ table, exists: true, recordCount: data?.length || 0 });
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      results.push({ table, exists: false, error: error.message });
    }
  }
  
  return results;
}

async function verifyAuth() {
  console.log('\n🔐 Verificando autenticación...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Error de autenticación:', error.message);
      return false;
    }
    
    if (session) {
      console.log('✅ Usuario autenticado:', session.user.email);
    } else {
      console.log('ℹ️ No hay sesión activa (normal para verificación)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error verificando autenticación:', error.message);
    return false;
  }
}

async function checkRealtime() {
  console.log('\n⚡ Verificando tiempo real...');
  
  try {
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('✅ Tiempo real funcionando:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal de tiempo real suscrito');
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Error en canal de tiempo real');
        }
      });
      
    return true;
  } catch (error) {
    console.log('❌ Error verificando tiempo real:', error.message);
    return false;
  }
}

async function testBasicOperations() {
  console.log('\n🧪 Probando operaciones básicas...');
  
  try {
    // Test SELECT
    console.log('📖 Probando SELECT...');
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*')
      .limit(5);
    console.log(`✅ SELECT: ${restaurants?.length || 0} restaurantes encontrados`);
    
    // Test INSERT (solo si hay restaurantes)
    if (restaurants && restaurants.length > 0) {
      console.log('📝 Probando INSERT...');
      const testCustomer = {
        restaurant_id: restaurants[0].id,
        first_name: 'Test',
        last_name: 'Customer',
        email: `test-${Date.now()}@example.com`,
        phone: '+34123456789'
      };
      
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert(testCustomer)
        .select()
        .single();
        
      if (error) {
        console.log('❌ INSERT fallido:', error.message);
      } else {
        console.log('✅ INSERT exitoso');
        
        // Limpiar test data
        await supabase
          .from('customers')
          .delete()
          .eq('id', newCustomer.id);
        console.log('🧹 Test data limpiado');
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error en operaciones básicas:', error.message);
    return false;
  }
}

async function generateReport(tableResults) {
  console.log('\n📊 REPORTE DE VERIFICACIÓN');
  console.log('=' .repeat(50));
  
  const existingTables = tableResults.filter(r => r.exists);
  const missingTables = tableResults.filter(r => !r.exists);
  
  console.log(`✅ Tablas existentes: ${existingTables.length}/${requiredTables.length}`);
  console.log(`❌ Tablas faltantes: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n❌ TABLAS FALTANTES:');
    missingTables.forEach(table => {
      console.log(`   - ${table.table}: ${table.error}`);
    });
    
    console.log('\n💡 SOLUCIÓN:');
    console.log('1. Ejecuta el script SQL: src/scripts/database-setup.sql');
    console.log('2. En tu panel de Supabase: SQL Editor');
    console.log('3. Pega y ejecuta el contenido completo del archivo');
  }
  
  if (existingTables.length === requiredTables.length) {
    console.log('\n🎉 ¡BASE DE DATOS COMPLETAMENTE CONFIGURADA!');
    console.log('✅ Todas las tablas están presentes');
    console.log('✅ La aplicación está lista para usar');
  }
  
  console.log('\n🔧 CONFIGURACIÓN ACTUAL:');
  console.log(`SUPABASE_URL: ${SUPABASE_URL ? '✅ Configurada' : '❌ Falta'}`);
  console.log(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta'}`);
}

// Ejecutar verificación completa
async function main() {
  console.log('🚀 LA-IA APP - Verificación de Base de Datos');
  console.log('=' .repeat(50));
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Variables de entorno faltantes:');
    if (!SUPABASE_URL) console.log('   - VITE_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) console.log('   - VITE_SUPABASE_ANON_KEY');
    console.log('\n💡 Configura estas variables en tu archivo .env');
    process.exit(1);
  }
  
  const connectionOk = await verifyConnection();
  if (!connectionOk) {
    console.log('\n❌ No se pudo conectar a Supabase');
    process.exit(1);
  }
  
  const tableResults = await verifyTables();
  await verifyAuth();
  await checkRealtime();
  await testBasicOperations();
  
  await generateReport(tableResults);
  
  const allTablesExist = tableResults.every(r => r.exists);
  
  if (allTablesExist) {
    console.log('\n🎯 ESTADO: LISTO PARA LANZAMIENTO ✅');
    process.exit(0);
  } else {
    console.log('\n⚠️ ESTADO: CONFIGURACIÓN PENDIENTE');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { verifyConnection, verifyTables, verifyAuth, checkRealtime };

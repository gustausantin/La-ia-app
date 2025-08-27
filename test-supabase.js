// Script para verificar conexión con Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odfebfqyhklasrniqgvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZmViZnF5aGtsYXNybmlxZ3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTcwODMsImV4cCI6MjA2ODc5MzA4M30.0zejXrpAJ84R7Jkaap9vG-uALCC6d_leLiuuca7P7l4';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando conexión con Supabase...');

// Test 1: Verificar conexión básica
async function testConnection() {
  try {
    console.log('📡 Testing conexión básica...');
    const { data, error } = await supabase
      .from('restaurants')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    console.log('✅ Conexión exitosa a Supabase');
    return true;
  } catch (err) {
    console.error('❌ Error crítico:', err.message);
    return false;
  }
}

// Test 2: Verificar tablas existentes
async function testTables() {
  try {
    console.log('📊 Verificando tablas...');
    const tables = ['restaurants', 'reservations', 'customers', 'tables'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn(`⚠️ Tabla ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: OK`);
      }
    }
  } catch (err) {
    console.error('❌ Error verificando tablas:', err.message);
  }
}

// Test 3: Verificar función ROI
async function testROIFunction() {
  try {
    console.log('🧮 Verificando función calculate_restaurant_roi...');
    const { data, error } = await supabase.rpc('calculate_restaurant_roi', {
      target_restaurant_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      console.warn('⚠️ Función ROI:', error.message);
    } else {
      console.log('✅ Función ROI: Disponible');
    }
  } catch (err) {
    console.error('❌ Error función ROI:', err.message);
  }
}

// Ejecutar todas las verificaciones
async function runAllTests() {
  console.log('🚀 Iniciando verificación completa de Supabase...\n');
  
  const connectionOK = await testConnection();
  if (connectionOK) {
    await testTables();
    await testROIFunction();
  }
  
  console.log('\n📋 Verificación completada.');
}

runAllTests().catch(console.error);

// Script para crear restaurant para usuario existente
// Ejecutar: node src/scripts/create-restaurant-for-user.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ktsqwvhqamedpmzkzjaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY'
);

async function createRestaurantForUser() {
  const userId = 'd0bc9b56-9a0b-44e1-bb96-b21fa13e34c8';
  const email = 'gustausantin@gmail.com';
  
  console.log('🔧 Creando restaurant para usuario existente...');
  
  try {
    // Primero autenticarse con el usuario
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'gustausantin@gmail.com',
      password: 'TU_PASSWORD_AQUI' // 👈 CAMBIAR AQUÍ
    });
    
    if (loginError) {
      console.error('❌ Error login:', loginError);
      console.log('💡 Ve a Supabase SQL Editor y ejecuta el script manual');
      return;
    }
    
    console.log('✅ Login exitoso');
    
    // Ahora crear restaurant con la función RPC
    const { data: restaurantData, error: restaurantError } = await supabase
      .rpc('create_restaurant_securely', {
        restaurant_data: {
          name: 'Mi Restaurante Demo',
          email: email,
          phone: '+34 600 000 000',
          city: 'Madrid',
          plan: 'trial',
          active: true
        },
        user_profile: {
          email: email,
          full_name: 'Mi Restaurante Demo'
        }
      });
    
    if (restaurantError) {
      console.error('❌ Error restaurant:', restaurantError);
    } else {
      console.log('✅ Restaurant creado exitosamente:', restaurantData);
      console.log('🎉 ¡LISTO! Recarga la página en el navegador.');
    }
    
    // Cerrar sesión
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('💥 Error general:', error);
    console.log('💡 Ve a Supabase SQL Editor y ejecuta el script SQL manual');
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  createRestaurantForUser();
}

module.exports = { createRestaurantForUser };

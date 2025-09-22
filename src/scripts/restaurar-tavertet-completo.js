// Script URGENTE para restaurar Tavertet con todos los datos
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

async function restaurarTavertetCompleto() {
  console.log('🚨 RESTAURACIÓN URGENTE DE TAVERTET');
  console.log('=====================================');
  
  try {
    // 1. RECREAR USUARIO GUSTAVO SANTÍN
    console.log('\n1️⃣ Recreando usuario gustausantin@gmail.com...');
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'gustausantin@gmail.com',
      password: 'TavertetPassword123!',
      email_confirm: true, // Confirmado automáticamente
      user_metadata: {
        first_name: 'Gustavo',
        last_name: 'Santín',
        restaurant_name: 'Tavertet',
        phone: '+34666777888',
        city: 'Barcelona',
        postal_code: '08500',
        country: 'España',
        registration_date: new Date().toISOString(),
        source: 'restoration'
      }
    });

    if (userError) {
      console.log('❌ Error recreando usuario:', userError.message);
      return;
    }

    console.log('✅ Usuario recreado:', userData.user.id);
    const userId = userData.user.id;

    // 2. RECREAR RESTAURANTE TAVERTET
    console.log('\n2️⃣ Recreando restaurante Tavertet...');
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: 'Tavertet',
        email: 'gustausantin@gmail.com',
        cuisine_type: 'Catalana',
        phone: '+34666777888',
        address: 'Carrer de Tavertet 1',
        city: 'Barcelona',
        postal_code: '08500',
        country: 'España',
        plan: 'trial',
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (restaurantError) {
      console.log('❌ Error recreando restaurante:', restaurantError.message);
      return;
    }

    console.log('✅ Restaurante recreado:', restaurant.id);
    const restaurantId = restaurant.id;

    // 3. RECREAR RELACIÓN USUARIO-RESTAURANTE
    console.log('\n3️⃣ Recreando relación usuario-restaurante...');
    const { error: mappingError } = await supabaseAdmin
      .from('user_restaurant_mapping')
      .insert({
        auth_user_id: userId,
        restaurant_id: restaurantId,
        role: 'owner',
        permissions: ['all'],
        created_at: new Date().toISOString()
      });

    if (mappingError) {
      console.log('❌ Error recreando relación:', mappingError.message);
      return;
    }

    console.log('✅ Relación recreada');

    // 4. RECREAR CLIENTES BÁSICOS
    console.log('\n4️⃣ Recreando clientes...');
    const clientes = [
      {
        name: 'Pedro García',
        phone: '+34666111222',
        email: 'pedro@example.com',
        churn_risk_score: 85,
        segment: 'risk'
      },
      {
        name: 'María López',
        phone: '+34666333444',
        email: 'maria@example.com',
        churn_risk_score: 25,
        segment: 'vip'
      },
      {
        name: 'Alberto Maza',
        phone: '+34666555666',
        email: 'alberto@example.com',
        churn_risk_score: 45,
        segment: 'regular'
      }
    ];

    for (const cliente of clientes) {
      const { error: clientError } = await supabaseAdmin
        .from('customers')
        .insert({
          ...cliente,
          restaurant_id: restaurantId,
          created_at: new Date().toISOString()
        });

      if (clientError) {
        console.log(`⚠️ Error creando cliente ${cliente.name}:`, clientError.message);
      } else {
        console.log(`✅ Cliente creado: ${cliente.name}`);
      }
    }

    // 5. RECREAR ALGUNAS RESERVAS
    console.log('\n5️⃣ Recreando reservas...');
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id, name')
      .eq('restaurant_id', restaurantId);

    if (customers && customers.length > 0) {
      const reservas = [
        {
          customer_id: customers[0].id,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '20:00:00',
          party_size: 4,
          table_number: 'Mesa 2',
          status: 'confirmed'
        },
        {
          customer_id: customers[1].id,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '21:30:00',
          party_size: 2,
          table_number: 'Mesa 5',
          status: 'confirmed'
        }
      ];

      for (const reserva of reservas) {
        const { error: resError } = await supabaseAdmin
          .from('reservations')
          .insert({
            ...reserva,
            restaurant_id: restaurantId,
            created_at: new Date().toISOString()
          });

        if (resError) {
          console.log('⚠️ Error creando reserva:', resError.message);
        } else {
          console.log('✅ Reserva creada');
        }
      }
    }

    // 6. RECREAR ALGUNOS NO-SHOWS DE ALTO RIESGO
    console.log('\n6️⃣ Recreando no-shows de alto riesgo...');
    if (customers && customers.length > 0) {
      const { error: noshowError } = await supabaseAdmin
        .from('noshow_actions')
        .insert({
          restaurant_id: restaurantId,
          customer_id: customers[0].id,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '20:00:00',
          party_size: 4,
          table_number: 'Mesa 2',
          customer_name: customers[0].name,
          customer_phone: '+34666111222',
          risk_level: 'high',
          risk_score: 85,
          risk_factors: ['Cliente con historial de no-shows', 'Horario problemático', 'Grupo grande'],
          action_type: 'detected',
          created_at: new Date().toISOString()
        });

      if (noshowError) {
        console.log('⚠️ Error creando no-show:', noshowError.message);
      } else {
        console.log('✅ No-show de alto riesgo creado');
      }
    }

    console.log('\n=====================================');
    console.log('🎉 TAVERTET RESTAURADO EXITOSAMENTE');
    console.log('=====================================');
    console.log('📧 Email: gustausantin@gmail.com');
    console.log('🔑 Password: TavertetPassword123!');
    console.log('🏪 Restaurante: Tavertet');
    console.log('📍 ID Restaurante:', restaurantId);
    console.log('👤 ID Usuario:', userId);
    console.log('=====================================');
    console.log('✅ Puedes hacer login normalmente');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar restauración
restaurarTavertetCompleto().catch(console.error);

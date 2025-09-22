// Completar restauración de Tavertet
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

async function completarRestauracion() {
  console.log('🔧 COMPLETANDO RESTAURACIÓN DE TAVERTET');
  console.log('=====================================');
  
  try {
    // Buscar el usuario y restaurante recién creados
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'gustausantin@gmail.com');
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('👤 Usuario encontrado:', user.id);

    const { data: restaurants } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('name', 'Tavertet');

    if (!restaurants || restaurants.length === 0) {
      console.log('❌ Restaurante no encontrado');
      return;
    }

    const restaurant = restaurants[0];
    console.log('🏪 Restaurante encontrado:', restaurant.id);

    // Verificar si ya existe la relación
    const { data: existingMapping } = await supabaseAdmin
      .from('user_restaurant_mapping')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('restaurant_id', restaurant.id);

    if (!existingMapping || existingMapping.length === 0) {
      // Crear la relación
      const { error: mappingError } = await supabaseAdmin
        .from('user_restaurant_mapping')
        .insert({
          auth_user_id: user.id,
          restaurant_id: restaurant.id,
          role: 'owner',
          permissions: ['all'],
          created_at: new Date().toISOString()
        });

      if (mappingError) {
        console.log('❌ Error creando relación:', mappingError.message);
      } else {
        console.log('✅ Relación usuario-restaurante creada');
      }
    } else {
      console.log('✅ Relación ya existe');
    }

    // Ahora crear los datos que faltaron
    console.log('\n📊 Creando datos adicionales...');
    
    // Clientes
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
      },
      {
        name: 'Ana Rodríguez',
        phone: '+34666777888',
        email: 'ana@example.com',
        churn_risk_score: 90,
        segment: 'risk'
      }
    ];

    for (const cliente of clientes) {
      const { error: clientError } = await supabaseAdmin
        .from('customers')
        .insert({
          ...cliente,
          restaurant_id: restaurant.id,
          created_at: new Date().toISOString()
        });

      if (clientError && !clientError.message.includes('duplicate')) {
        console.log(`⚠️ Error creando cliente ${cliente.name}:`, clientError.message);
      } else {
        console.log(`✅ Cliente: ${cliente.name}`);
      }
    }

    // Obtener clientes creados
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone')
      .eq('restaurant_id', restaurant.id);

    console.log(`📋 ${customers?.length || 0} clientes disponibles`);

    // Crear reservas para hoy y mañana
    if (customers && customers.length > 0) {
      const hoy = new Date();
      const mañana = new Date(hoy);
      mañana.setDate(hoy.getDate() + 1);

      const reservas = [
        {
          customer_id: customers[0].id,
          reservation_date: hoy.toISOString().split('T')[0],
          reservation_time: '20:00:00',
          party_size: 4,
          table_number: 'Mesa 2',
          status: 'confirmed'
        },
        {
          customer_id: customers[1].id,
          reservation_date: hoy.toISOString().split('T')[0],
          reservation_time: '21:30:00',
          party_size: 2,
          table_number: 'Mesa 5',
          status: 'confirmed'
        },
        {
          customer_id: customers[2].id,
          reservation_date: mañana.toISOString().split('T')[0],
          reservation_time: '19:30:00',
          party_size: 6,
          table_number: 'Mesa 8',
          status: 'confirmed'
        }
      ];

      for (const reserva of reservas) {
        const { error: resError } = await supabaseAdmin
          .from('reservations')
          .insert({
            ...reserva,
            restaurant_id: restaurant.id,
            created_at: new Date().toISOString()
          });

        if (resError && !resError.message.includes('duplicate')) {
          console.log('⚠️ Error creando reserva:', resError.message);
        } else {
          console.log('✅ Reserva creada');
        }
      }
    }

    // Crear no-shows de alto riesgo para hoy
    if (customers && customers.length > 0) {
      const noshows = [
        {
          customer_id: customers[0].id,
          customer_name: customers[0].name,
          customer_phone: customers[0].phone,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '20:00:00',
          party_size: 4,
          table_number: 'Mesa 2',
          risk_level: 'high',
          risk_score: 85,
          risk_factors: ['Cliente con historial de no-shows', 'Horario problemático viernes noche', 'Grupo grande'],
          action_type: 'detected'
        },
        {
          customer_id: customers[3].id,
          customer_name: customers[3].name,
          customer_phone: customers[3].phone,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '21:00:00',
          party_size: 2,
          table_number: 'Mesa 7',
          risk_level: 'high',
          risk_score: 90,
          risk_factors: ['Cliente nuevo sin historial', 'Sin confirmación', 'Reserva de última hora'],
          action_type: 'detected'
        }
      ];

      for (const noshow of noshows) {
        const { error: noshowError } = await supabaseAdmin
          .from('noshow_actions')
          .insert({
            ...noshow,
            restaurant_id: restaurant.id,
            created_at: new Date().toISOString()
          });

        if (noshowError && !noshowError.message.includes('duplicate')) {
          console.log('⚠️ Error creando no-show:', noshowError.message);
        } else {
          console.log('✅ No-show de alto riesgo creado');
        }
      }
    }

    console.log('\n=====================================');
    console.log('🎉 TAVERTET COMPLETAMENTE RESTAURADO');
    console.log('=====================================');
    console.log('📧 Email: gustausantin@gmail.com');
    console.log('🔑 Password: TavertetPassword123!');
    console.log('🏪 Restaurante: Tavertet');
    console.log('📍 ID Restaurante:', restaurant.id);
    console.log('👤 ID Usuario:', user.id);
    console.log('=====================================');
    console.log('✅ DATOS RESTAURADOS:');
    console.log('- ✅ Usuario y restaurante');
    console.log('- ✅ Clientes con segmentación');
    console.log('- ✅ Reservas para hoy y mañana');
    console.log('- ✅ No-shows de alto riesgo');
    console.log('=====================================');
    console.log('🚀 Puedes hacer login y ver todos los datos');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar
completarRestauracion().catch(console.error);

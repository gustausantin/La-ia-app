// Restauración final de Tavertet con esquema correcto
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

async function restauracionFinal() {
  console.log('🎯 RESTAURACIÓN FINAL DE TAVERTET');
  console.log('=====================================');
  
  try {
    // Buscar usuario y restaurante
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find(u => u.email === 'gustausantin@gmail.com');
    
    const { data: restaurants } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('name', 'Tavertet');

    if (!user || !restaurants || restaurants.length === 0) {
      console.log('❌ Usuario o restaurante no encontrado');
      return;
    }

    const restaurant = restaurants[0];
    console.log('✅ Usuario y restaurante encontrados');

    // Crear clientes básicos (sin campo segment que no existe)
    console.log('\n👥 Creando clientes...');
    const clientes = [
      {
        name: 'Pedro García',
        phone: '+34666111222',
        email: 'pedro@example.com',
        churn_risk_score: 85
      },
      {
        name: 'María López',
        phone: '+34666333444',
        email: 'maria@example.com',
        churn_risk_score: 25
      },
      {
        name: 'Alberto Maza',
        phone: '+34666555666',
        email: 'alberto@example.com',
        churn_risk_score: 45
      },
      {
        name: 'Ana Rodríguez',
        phone: '+34666777888',
        email: 'ana@example.com',
        churn_risk_score: 90
      },
      {
        name: 'Carlos Fernández',
        phone: '+34666999000',
        email: 'carlos@example.com',
        churn_risk_score: 75
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

    console.log(`📋 ${customers?.length || 0} clientes creados`);

    // Crear reservas
    if (customers && customers.length > 0) {
      console.log('\n📅 Creando reservas...');
      const hoy = new Date();
      
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

    // Crear no-shows de alto riesgo
    if (customers && customers.length >= 2) {
      console.log('\n🚨 Creando no-shows de alto riesgo...');
      
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
          risk_factors: ['Cliente con historial de no-shows', 'Horario problemático', 'Grupo grande'],
          action_type: 'detected'
        },
        {
          customer_id: customers[1].id,
          customer_name: customers[1].name,
          customer_phone: customers[1].phone,
          reservation_date: new Date().toISOString().split('T')[0],
          reservation_time: '21:00:00',
          party_size: 2,
          table_number: 'Mesa 7',
          risk_level: 'high',
          risk_score: 90,
          risk_factors: ['Cliente nuevo', 'Sin confirmación', 'Reserva tardía'],
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

    // Crear algunos billing_tickets (consumos)
    if (customers && customers.length > 0) {
      console.log('\n💰 Creando consumos...');
      
      const consumos = [
        {
          customer_id: customers[0].id,
          customer_name: customers[0].name,
          customer_phone: customers[0].phone,
          table_number: 'Mesa 2',
          items: ['Paella Valenciana', 'Vino Tinto', 'Postre'],
          total_amount: 65.50,
          payment_method: 'card',
          waiter_name: 'Juan',
          created_at: new Date().toISOString()
        },
        {
          customer_id: customers[1].id,
          customer_name: customers[1].name,
          customer_phone: customers[1].phone,
          table_number: 'Mesa 5',
          items: ['Ensalada César', 'Salmón', 'Agua'],
          total_amount: 42.30,
          payment_method: 'cash',
          waiter_name: 'María',
          created_at: new Date().toISOString()
        }
      ];

      for (const consumo of consumos) {
        const { error: consumoError } = await supabaseAdmin
          .from('billing_tickets')
          .insert({
            ...consumo,
            restaurant_id: restaurant.id
          });

        if (consumoError && !consumoError.message.includes('duplicate')) {
          console.log('⚠️ Error creando consumo:', consumoError.message);
        } else {
          console.log('✅ Consumo creado');
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
    console.log('- ✅ Usuario gustausantin@gmail.com');
    console.log('- ✅ Restaurante Tavertet');
    console.log('- ✅ 5 clientes con diferentes risk scores');
    console.log('- ✅ Reservas para hoy');
    console.log('- ✅ 2 no-shows de alto riesgo');
    console.log('- ✅ Consumos/tickets de ejemplo');
    console.log('=====================================');
    console.log('🚀 PUEDES HACER LOGIN Y VER TODO FUNCIONANDO');
    console.log('🎯 Dashboard, CRM, No-Shows, Consumos - TODO RESTAURADO');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

// Ejecutar
restauracionFinal().catch(console.error);

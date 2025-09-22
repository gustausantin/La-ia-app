import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU';

// Usar service_role para bypasear RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function crearRestaurante() {
    try {
        console.log('🏢 Creando tu restaurante...\n');
        
        // Crear el restaurante con tu email
        const { data: restaurant, error } = await supabase
            .from('restaurants')
            .insert({
                name: 'Restaurante Gusta',
                email: 'gustausantin@gmail.com',
                phone: '600123456',
                address: 'Calle Principal 123',
                city: 'Barcelona',
                postal_code: '08001',
                country: 'España',
                cuisine_type: 'Mediterránea',
                settings: {
                    notifications: true,
                    auto_confirm: false,
                    advance_days: 30,
                    working_hours: {
                        monday: { open: '13:00', close: '23:00' },
                        tuesday: { open: '13:00', close: '23:00' },
                        wednesday: { open: '13:00', close: '23:00' },
                        thursday: { open: '13:00', close: '23:00' },
                        friday: { open: '13:00', close: '23:30' },
                        saturday: { open: '13:00', close: '23:30' },
                        sunday: { open: '13:00', close: '22:00' }
                    }
                }
            })
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creando restaurante:', error);
            return;
        }
        
        console.log('✅ Restaurante creado exitosamente!');
        console.log('📧 Email:', restaurant.email);
        console.log('🏷️ Nombre:', restaurant.name);
        console.log('🆔 ID:', restaurant.id);
        
        // Ahora generar no-shows de alto riesgo
        console.log('\n🚀 Generando no-shows de alto riesgo para HOY + 30 días...\n');
        
        let totalCreated = 0;
        const startDate = new Date();
        
        for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayOffset);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Generar 5-10 reservas de alto riesgo por día
            const numReservations = 5 + Math.floor(Math.random() * 6);
            
            console.log(`📅 Generando ${numReservations} reservas de alto riesgo para ${dateStr}...`);
            
            for (let i = 0; i < numReservations; i++) {
                const customerIndex = totalCreated + 1;
                
                // Crear cliente con alto riesgo
                const { data: customer } = await supabase
                    .from('customers')
                    .insert({
                        restaurant_id: restaurant.id,
                        name: `Cliente Alto Riesgo ${customerIndex}`,
                        email: `altoriesgo${customerIndex}@test.com`,
                        phone: customerIndex % 3 === 0 ? null : `600${String(customerIndex).padStart(6, '0')}`,
                        visits_count: 10,
                        no_show_count: 4, // 40% tasa de no-show
                        total_spent: 350.00,
                        avg_ticket: 35.00,
                        segment_auto: 'en_riesgo',
                        churn_risk_score: 90
                    })
                    .select()
                    .single();
                
                if (customer) {
                    // Crear reserva de alto riesgo
                    const times = ['21:00', '21:30', '22:00', '13:00', '20:30'];
                    const partySizes = [7, 8, 9, 10];
                    
                    await supabase
                        .from('reservations')
                        .insert({
                            restaurant_id: restaurant.id,
                            customer_id: customer.id,
                            customer_name: customer.name,
                            customer_email: customer.email,
                            customer_phone: customer.phone,
                            reservation_date: dateStr,
                            reservation_time: times[i % times.length],
                            party_size: partySizes[i % partySizes.length],
                            table_number: ((10 + i) % 20) || 1,
                            status: 'confirmed',
                            special_requests: 'Reserva de alto riesgo - Requiere confirmación'
                        });
                    
                    totalCreated++;
                }
            }
        }
        
        console.log('\n========================================');
        console.log('✅ GENERACIÓN COMPLETADA');
        console.log('========================================');
        console.log(`📊 Total reservas de alto riesgo creadas: ${totalCreated}`);
        console.log(`🏢 Para el restaurante: ${restaurant.name}`);
        console.log(`📅 Período: HOY hasta ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
        console.log('\n🎯 AHORA PUEDES:');
        console.log('1. Ir al Dashboard y ver las reservas de alto riesgo');
        console.log('2. Ir a Control No-Shows y gestionar las acciones preventivas');
        console.log('3. El CRM mostrará alertas automáticas para estos clientes');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
crearRestaurante();

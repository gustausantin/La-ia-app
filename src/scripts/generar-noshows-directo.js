import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase con service_role para bypasear RLS
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generarNoShowsDirecto() {
    try {
        console.log('🔍 Buscando tu restaurante Tavertet...\n');
        
        // Buscar directamente en restaurants por email o nombre
        let { data: restaurants } = await supabase
            .from('restaurants')
            .select('*')
            .or('email.eq.gustausantin@gmail.com,name.ilike.%Tavertet%');
        
        if (!restaurants || restaurants.length === 0) {
            // Si no encuentra, buscar TODOS los restaurantes para debug
            const { data: allRestaurants } = await supabase
                .from('restaurants')
                .select('id, name, email')
                .limit(10);
            
            console.log('Restaurantes en la base de datos:');
            allRestaurants?.forEach(r => {
                console.log(`- ${r.name} (${r.email || 'sin email'}) - ID: ${r.id}`);
            });
            
            if (!allRestaurants || allRestaurants.length === 0) {
                console.log('\n❌ No hay restaurantes en la base de datos.');
                console.log('Esto es normal si estás usando autenticación con RLS.');
                return;
            }
            
            // Usar el primero que encuentre
            restaurants = [allRestaurants[0]];
            console.log(`\nUsando: ${restaurants[0].name}`);
        }
        
        const restaurant = restaurants[0];
        console.log('✅ Trabajando con:', restaurant.name);
        console.log('📧 Email:', restaurant.email);
        console.log('🆔 ID:', restaurant.id);
        
        // GENERAR NO-SHOWS DE ALTO RIESGO
        console.log('\n🚀 Generando reservas de ALTO RIESGO (2-3 por día)...\n');
        
        let totalCreated = 0;
        const startDate = new Date();
        
        for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayOffset);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // 2-3 no-shows por día como pediste
            const numNoShows = dayOffset === 0 ? 7 : (2 + Math.floor(Math.random() * 2));
            
            for (let i = 0; i < numNoShows; i++) {
                const customerNum = Date.now() + Math.floor(Math.random() * 10000) + i;
                
                // Crear cliente de alto riesgo (solo campos que existen)
                const { data: customer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        restaurant_id: restaurant.id,
                        name: `Cliente Riesgo ${customerNum}`,
                        email: `riesgo${customerNum}@test.com`,
                        phone: i % 3 === 0 ? null : `600${String(customerNum).slice(-6)}`,
                        visits_count: 10 + Math.floor(Math.random() * 5),
                        total_spent: 200 + Math.random() * 300,
                        avg_ticket: 30 + Math.random() * 20,
                        segment_auto: 'en_riesgo',
                        churn_risk_score: 85 + Math.floor(Math.random() * 15)
                    })
                    .select()
                    .single();
                
                if (customerError) {
                    console.log('Error creando cliente:', customerError.message);
                    continue;
                }
                
                if (customer) {
                    // Crear reserva de alto riesgo
                    const riskyTimes = ['21:00', '21:30', '22:00', '13:00', '20:30'];
                    const largeSizes = [7, 8, 9, 10];
                    
                    const { data: reservation } = await supabase
                        .from('reservations')
                        .insert({
                            restaurant_id: restaurant.id,
                            customer_id: customer.id,
                            customer_name: customer.name,
                            customer_email: customer.email,
                            customer_phone: customer.phone,
                            reservation_date: dateStr,
                            reservation_time: riskyTimes[i % riskyTimes.length],
                            party_size: largeSizes[i % largeSizes.length],
                            table_number: (i % 15) + 1,
                            status: 'confirmed',
                            special_requests: 'Reserva alto riesgo - Confirmar',
                            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                        })
                        .select()
                        .single();
                    
                    if (reservation) {
                        totalCreated++;
                        
                        // Para HOY, crear acción pendiente
                        if (dayOffset === 0) {
                            await supabase
                                .from('noshow_actions')
                                .insert({
                                    restaurant_id: restaurant.id,
                                    reservation_id: reservation.id,
                                    customer_id: customer.id,
                                    customer_name: customer.name,
                                    reservation_date: dateStr,
                                    reservation_time: reservation.reservation_time,
                                    party_size: reservation.party_size,
                                    risk_level: 'high',
                                    risk_score: 90 + Math.floor(Math.random() * 10),
                                    action_type: 'pending',
                                    channel: 'none',
                                    customer_response: 'pending',
                                    final_outcome: 'pending'
                                });
                        }
                    }
                }
            }
            
            console.log(`✅ ${dateStr}: ${numNoShows} reservas de alto riesgo creadas`);
        }
        
        // Verificación final
        const today = new Date().toISOString().split('T')[0];
        const { data: todayHighRisk } = await supabase
            .from('reservations')
            .select('*, customers(*)')
            .eq('restaurant_id', restaurant.id)
            .eq('reservation_date', today)
            .in('status', ['pending', 'confirmed']);
        
        const highRiskCount = todayHighRisk?.filter(r => {
            // Sin no_show_count, usar churn_risk_score como indicador
            const churnRisk = r.customers?.churn_risk_score || 0;
            const hour = parseInt(r.reservation_time?.split(':')[0] || '0');
            
            let score = 0;
            if (churnRisk >= 85) score += 40; // Alto riesgo de churn
            else if (churnRisk >= 60) score += 25; // Riesgo medio
            if (hour >= 20 || hour <= 13) score += 25;
            if (r.party_size > 6) score += 15;
            if (!r.customer_phone || r.customer_phone.length < 9) score += 20;
            if (!r.customers || r.customers.visits_count === 0) score += 15;
            
            return score >= 85;
        }).length || 0;
        
        console.log('\n========================================');
        console.log('✅ GENERACIÓN COMPLETADA');
        console.log('========================================');
        console.log(`📊 Total reservas de alto riesgo: ${totalCreated}`);
        console.log(`🏢 Restaurante: ${restaurant.name}`);
        console.log(`📅 Período: HOY hasta ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
        console.log(`\n🔴 ALTO RIESGO HOY: ${highRiskCount} reservas`);
        console.log('\n🎯 VE A TU APLICACIÓN Y VERÁS:');
        console.log(`- Dashboard: "${highRiskCount}" en Alto riesgo hoy`);
        console.log(`- Control No-Shows: ${highRiskCount} reservas para gestionar`);
        console.log('- Botones para enviar mensajes de confirmación');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
generarNoShowsDirecto();

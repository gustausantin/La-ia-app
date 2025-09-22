import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generarNoShowsParaTavertet() {
    try {
        console.log('🔍 Buscando el restaurante Tavertet...\n');
        
        // Buscar el restaurante Tavertet por nombre
        let { data: restaurants, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, name, email')
            .eq('name', 'Tavertet')
            .single();
        
        if (restaurantError || !restaurants) {
            console.log('No se encontró por nombre, buscando por email...');
            // Intentar buscar por email
            const { data: restaurantByEmail, error: emailError } = await supabase
                .from('restaurants')
                .select('id, name, email')
                .eq('email', 'gustausantin@gmail.com')
                .single();
            
            if (emailError || !restaurantByEmail) {
                console.error('❌ No se encontró el restaurante Tavertet');
                console.error('Por favor, asegúrate de que el restaurante existe en tu cuenta');
                return;
            }
            
            restaurants = restaurantByEmail;
        }
        
        const restaurant = restaurants;
        console.log('✅ Restaurante encontrado!');
        console.log('🏢 Nombre:', restaurant.name);
        console.log('📧 Email:', restaurant.email);
        console.log('🆔 ID:', restaurant.id);
        
        console.log('\n🚀 Generando reservas de ALTO RIESGO para HOY + 30 días...\n');
        
        // Limpiar datos de prueba anteriores SOLO de este restaurante
        console.log('🧹 Limpiando datos de prueba anteriores...');
        
        await supabase
            .from('reservations')
            .delete()
            .eq('restaurant_id', restaurant.id)
            .or('customer_name.like.%Alto Riesgo Test%,customer_name.like.%Riesgo Medio Test%');
        
        await supabase
            .from('customers')
            .delete()
            .eq('restaurant_id', restaurant.id)
            .or('name.like.%Alto Riesgo Test%,name.like.%Riesgo Medio Test%');
        
        let totalCreated = 0;
        const startDate = new Date();
        
        // Generar para HOY + próximos 30 días
        for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayOffset);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Generar entre 5-10 reservas de alto riesgo por día
            const numReservations = dayOffset === 0 ? 7 : (5 + Math.floor(Math.random() * 6)); // HOY = 7 fijo
            
            console.log(`📅 Generando ${numReservations} reservas de alto riesgo para ${dateStr}`);
            
            for (let i = 0; i < numReservations; i++) {
                const customerIndex = totalCreated + 1;
                let customer;
                let riskScore;
                
                // Alternar entre diferentes perfiles de riesgo
                if (customerIndex % 3 === 1) {
                    // PERFIL 1: Cliente con historial problemático
                    const { data: customerData, error } = await supabase
                        .from('customers')
                        .insert({
                            restaurant_id: restaurant.id,
                            name: `Cliente Alto Riesgo ${customerIndex}`,
                            email: `altoriesgo${customerIndex}@test.com`,
                            phone: `600${String(customerIndex).padStart(6, '0')}`,
                            visits_count: 10,
                            no_show_count: 4, // 40% tasa de no-show
                            total_spent: 350.00,
                            avg_ticket: 35.00,
                            segment_auto: 'en_riesgo',
                            churn_risk_score: 90
                        })
                        .select()
                        .single();
                    
                    if (!error) {
                        customer = customerData;
                        riskScore = 95; // Muy alto riesgo
                    }
                    
                } else if (customerIndex % 3 === 2) {
                    // PERFIL 2: Cliente nuevo sin teléfono
                    const { data: customerData, error } = await supabase
                        .from('customers')
                        .insert({
                            restaurant_id: restaurant.id,
                            name: `Cliente Nuevo Riesgo ${customerIndex}`,
                            email: `nuevoriesgo${customerIndex}@test.com`,
                            phone: null, // Sin teléfono
                            visits_count: 0,
                            no_show_count: 0,
                            total_spent: 0,
                            avg_ticket: 0,
                            segment_auto: 'nuevo',
                            churn_risk_score: 60
                        })
                        .select()
                        .single();
                    
                    if (!error) {
                        customer = customerData;
                        riskScore = 85; // Alto riesgo
                    }
                    
                } else {
                    // PERFIL 3: Cliente ocasional con algunos problemas
                    const { data: customerData, error } = await supabase
                        .from('customers')
                        .insert({
                            restaurant_id: restaurant.id,
                            name: `Cliente Riesgo Medio ${customerIndex}`,
                            email: `riesgomedio${customerIndex}@test.com`,
                            phone: `600${String(customerIndex).padStart(6, '0')}`,
                            visits_count: 8,
                            no_show_count: 3, // 37% tasa
                            total_spent: 280.00,
                            avg_ticket: 35.00,
                            segment_auto: 'ocasional',
                            churn_risk_score: 85
                        })
                        .select()
                        .single();
                    
                    if (!error) {
                        customer = customerData;
                        riskScore = 88; // Alto riesgo
                    }
                }
                
                if (customer) {
                    // Horas de alto riesgo
                    const riskyTimes = ['21:00', '21:30', '22:00', '13:00', '20:30'];
                    // Grupos grandes
                    const largeSizes = [7, 8, 9, 10];
                    
                    const { data: reservation, error: resError } = await supabase
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
                            table_number: ((10 + i + dayOffset) % 20) || 1,
                            status: 'confirmed',
                            special_requests: `Alto riesgo (${riskScore} puntos) - Requiere confirmación`,
                            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                        })
                        .select()
                        .single();
                    
                    if (!resError && reservation) {
                        totalCreated++;
                        
                        // Para HOY, crear también registro en noshow_actions
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
                                    risk_score: riskScore,
                                    action_type: 'pending',
                                    channel: 'none',
                                    customer_response: 'pending',
                                    final_outcome: 'pending'
                                });
                        }
                    }
                }
            }
        }
        
        // Verificar lo creado para HOY
        const { data: todayReservations } = await supabase
            .from('reservations')
            .select('*, customers(*)')
            .eq('restaurant_id', restaurant.id)
            .eq('reservation_date', new Date().toISOString().split('T')[0])
            .in('status', ['pending', 'confirmed']);
        
        const highRiskToday = todayReservations?.filter(r => {
            const noShowRate = (r.customers?.no_show_count || 0) / Math.max(1, r.customers?.visits_count || 1);
            const hour = parseInt(r.reservation_time?.split(':')[0] || '0');
            
            let score = 0;
            if (noShowRate > 0.3) score += 40;
            else if (noShowRate > 0.15) score += 25;
            if (hour >= 20 || hour <= 13) score += 25;
            if (r.party_size > 6) score += 15;
            if (!r.customer_phone || r.customer_phone.length < 9) score += 20;
            if (!r.customers || r.customers.visits_count === 0) score += 15;
            
            return score >= 85;
        }).length || 0;
        
        console.log('\n========================================');
        console.log('✅ GENERACIÓN COMPLETADA PARA TAVERTET');
        console.log('========================================');
        console.log(`📊 Total reservas de alto riesgo creadas: ${totalCreated}`);
        console.log(`🏢 Restaurante: ${restaurant.name}`);
        console.log(`📅 Período: HOY hasta ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
        console.log(`\n🔴 ALTO RIESGO HOY: ${highRiskToday} reservas`);
        console.log('\n🎯 AHORA EN TU APLICACIÓN:');
        console.log(`1. Dashboard mostrará: "${highRiskToday}" en Alto riesgo hoy`);
        console.log(`2. Control No-Shows mostrará: ${highRiskToday} reservas para gestionar`);
        console.log('3. Podrás enviar mensajes de confirmación a cada una');
        console.log('4. El CRM generará alertas automáticas');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
generarNoShowsParaTavertet();

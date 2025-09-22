import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarScript() {
    try {
        console.log('🚀 Iniciando generación de no-shows para HOY + 30 días...\n');
        
        // Buscar el restaurante por email
        const { data: restaurants, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id, name, email')
            .eq('email', 'gustausantin@gmail.com')
            .single();
        
        if (restaurantError || !restaurants) {
            console.error('❌ No se encontró el restaurante con email gustausantin@gmail.com');
            console.error('Error:', restaurantError);
            return;
        }
        
        const restaurant = restaurants;
        console.log(`🏢 Restaurante encontrado: ${restaurant.name || restaurant.id}\n`);
        
        // Limpiar datos de prueba anteriores
        console.log('🧹 Limpiando datos de prueba anteriores...');
        
        await supabase
            .from('reservations')
            .delete()
            .or('customer_name.like.%Alto Riesgo Test%,customer_name.like.%Riesgo Medio Test%,customer_email.like.%riesgotest%@test.com');
        
        await supabase
            .from('customers')
            .delete()
            .or('name.like.%Alto Riesgo Test%,name.like.%Riesgo Medio Test%,email.like.%riesgotest%@test.com');
        
        console.log('✅ Limpieza completada\n');
        
        // Generar datos para cada día
        let totalCreated = 0;
        const startDate = new Date();
        
        for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayOffset);
            const dateStr = currentDate.toISOString().split('T')[0];
            
            // Generar 3-7 reservas de alto riesgo por día
            const numReservations = 3 + Math.floor(Math.random() * 5);
            
            console.log(`📅 Generando ${numReservations} reservas para ${dateStr}...`);
            
            for (let i = 0; i < numReservations; i++) {
                const customerIndex = totalCreated + 1;
                let customer;
                let riskScore;
                
                // Alternar entre diferentes tipos de riesgo
                if (customerIndex % 3 === 1) {
                    // TIPO 1: Cliente con historial de no-shows
                    const { data: customerData } = await supabase
                        .from('customers')
                        .upsert({
                            restaurant_id: restaurant.id,
                            name: `Alto Riesgo Test ${customerIndex}`,
                            email: `altoriesgotest${customerIndex}@test.com`,
                            phone: `600${String(customerIndex).padStart(6, '0')}`,
                            visits_count: 12,
                            no_show_count: 5, // 42% tasa de no-show
                            total_spent: 420.00,
                            avg_ticket: 35.00,
                            segment_auto: 'en_riesgo',
                            churn_risk_score: 90,
                            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
                        }, {
                            onConflict: 'restaurant_id,email',
                            ignoreDuplicates: false
                        })
                        .select()
                        .single();
                    
                    customer = customerData;
                    riskScore = 95;
                    
                } else if (customerIndex % 3 === 2) {
                    // TIPO 2: Cliente nuevo sin historial
                    const { data: customerData } = await supabase
                        .from('customers')
                        .upsert({
                            restaurant_id: restaurant.id,
                            name: `Riesgo Medio Test ${customerIndex}`,
                            email: `riesgomediotest${customerIndex}@test.com`,
                            phone: null, // Sin teléfono
                            visits_count: 0,
                            no_show_count: 0,
                            total_spent: 0,
                            avg_ticket: 0,
                            segment_auto: 'nuevo',
                            churn_risk_score: 60,
                            created_at: new Date().toISOString()
                        }, {
                            onConflict: 'restaurant_id,email',
                            ignoreDuplicates: false
                        })
                        .select()
                        .single();
                    
                    customer = customerData;
                    riskScore = 85;
                    
                } else {
                    // TIPO 3: Cliente ocasional con algunos no-shows
                    const { data: customerData } = await supabase
                        .from('customers')
                        .upsert({
                            restaurant_id: restaurant.id,
                            name: `Alto Riesgo Test ${customerIndex}`,
                            email: `altoriesgotest${customerIndex}@test.com`,
                            phone: `600${String(customerIndex).padStart(6, '0')}`,
                            visits_count: 8,
                            no_show_count: 3, // 37% tasa de no-show
                            total_spent: 280.00,
                            avg_ticket: 35.00,
                            segment_auto: 'ocasional',
                            churn_risk_score: 85,
                            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
                        }, {
                            onConflict: 'restaurant_id,email',
                            ignoreDuplicates: false
                        })
                        .select()
                        .single();
                    
                    customer = customerData;
                    riskScore = 88;
                }
                
                if (customer) {
                    // Crear reserva de alto riesgo
                    const times = ['21:00', '21:30', '22:00', '13:00', '20:30'];
                    const partySizes = [7, 8, 9, 10];
                    
                    const { data: reservation } = await supabase
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
                            table_number: ((10 + i + (dayOffset * 10)) % 50) || 1,
                            status: dayOffset === 0 ? 'confirmed' : (i % 3 === 0 ? 'pending' : 'confirmed'),
                            special_requests: `Reserva de alto riesgo - Score: ${riskScore}`,
                            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                        })
                        .select()
                        .single();
                    
                    // Si es para HOY, crear también registro en noshow_actions
                    if (dayOffset === 0 && reservation) {
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
                    
                    totalCreated++;
                }
            }
        }
        
        console.log('\n========================================');
        console.log('✅ GENERACIÓN COMPLETADA');
        console.log('========================================');
        console.log(`📊 Total reservas de alto riesgo creadas: ${totalCreated}`);
        console.log(`📅 Período: HOY hasta ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
        
        // Verificación para HOY
        const { data: todayHighRisk, error: todayError } = await supabase
            .from('reservations')
            .select('*, customers(*)')
            .eq('restaurant_id', restaurant.id)
            .eq('reservation_date', new Date().toISOString().split('T')[0])
            .in('status', ['pending', 'confirmed']);
        
        const highRiskCount = todayHighRisk?.filter(r => {
            const noShowRate = (r.customers?.no_show_count || 0) / Math.max(1, r.customers?.visits_count || 1);
            const hour = parseInt(r.reservation_time?.split(':')[0] || '0');
            const hasRisk = noShowRate > 0.3 || 
                           (hour >= 20 || hour <= 13) || 
                           r.party_size > 6 || 
                           !r.customer_phone || 
                           (r.customers?.visits_count || 0) === 0;
            return hasRisk;
        }).length || 0;
        
        console.log(`\n🔍 VERIFICACIÓN:`);
        console.log(`- Reservas de alto riesgo HOY: ${highRiskCount}`);
        console.log(`- Ve al Dashboard y deberías ver: ${highRiskCount} en "Alto riesgo hoy"`);
        console.log(`- Ve a Control No-Shows y verás todas las reservas con acciones disponibles`);
        
    } catch (error) {
        console.error('❌ Error ejecutando script:', error);
    }
}

// Ejecutar
ejecutarScript();

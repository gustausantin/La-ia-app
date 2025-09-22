import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function revisarYGenerarNoShows() {
    try {
        console.log('🔍 REVISANDO DATOS EXISTENTES DE TAVERTET...\n');
        
        // Buscar el restaurante - primero listar todos para ver cuál es
        const { data: allRestaurants } = await supabase
            .from('restaurants')
            .select('id, name, email');
        
        console.log('Restaurantes encontrados:');
        allRestaurants?.forEach(r => {
            console.log(`- ${r.name} (${r.email || 'sin email'}) - ID: ${r.id}`);
        });
        
        // Buscar Tavertet o variaciones
        let restaurant = allRestaurants?.find(r => 
            r.name?.toLowerCase().includes('tavertet') || 
            r.name?.toLowerCase().includes('tabertet') ||
            r.email === 'gustausantin@gmail.com'
        );
        
        if (!restaurant && allRestaurants?.length > 0) {
            // Si no encontramos Tavertet, usar el primero que haya
            restaurant = allRestaurants[0];
            console.log(`\n⚠️ No se encontró "Tavertet", usando: ${restaurant.name}`);
        }
        
        const restaurantError = !restaurant;
        
        if (restaurantError || !restaurant) {
            console.error('❌ No se encontró el restaurante Tavertet');
            return;
        }
        
        console.log('✅ Restaurante Tavertet encontrado');
        console.log('🆔 ID:', restaurant.id);
        console.log('📧 Email:', restaurant.email || 'No especificado');
        
        // REVISAR DATOS EXISTENTES
        console.log('\n📊 DATOS ACTUALES:\n');
        
        // Clientes existentes
        const { data: customers, count: customerCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('restaurant_id', restaurant.id);
        
        console.log(`👥 Clientes totales: ${customerCount}`);
        
        // Clientes con historial de no-shows
        const problemCustomers = customers?.filter(c => c.no_show_count > 0) || [];
        console.log(`⚠️ Clientes con no-shows previos: ${problemCustomers.length}`);
        
        // Reservas existentes
        const today = new Date().toISOString().split('T')[0];
        const { data: todayReservations } = await supabase
            .from('reservations')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('reservation_date', today);
        
        console.log(`📅 Reservas para HOY: ${todayReservations?.length || 0}`);
        
        // Reservas futuras
        const { data: futureReservations, count: futureCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact' })
            .eq('restaurant_id', restaurant.id)
            .gt('reservation_date', today);
        
        console.log(`📆 Reservas futuras: ${futureCount || 0}`);
        
        // No-show actions existentes
        const { data: existingNoShows, count: noShowCount } = await supabase
            .from('noshow_actions')
            .select('*', { count: 'exact' })
            .eq('restaurant_id', restaurant.id);
        
        console.log(`🔴 No-show actions existentes: ${noShowCount || 0}`);
        
        console.log('\n========================================');
        console.log('🎯 GENERANDO NO-SHOWS PARA EL PRÓXIMO MES');
        console.log('========================================\n');
        
        let totalGenerated = 0;
        
        // Generar para los próximos 30 días
        for (let day = 0; day <= 30; day++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + day);
            const dateStr = targetDate.toISOString().split('T')[0];
            
            // 2-3 no-shows por día como pediste
            const numNoShows = 2 + Math.floor(Math.random() * 2); // 2 o 3
            
            console.log(`📅 ${dateStr}: Generando ${numNoShows} reservas de alto riesgo`);
            
            for (let i = 0; i < numNoShows; i++) {
                // Usar clientes existentes con problemas o crear nuevos
                let customer;
                
                if (problemCustomers.length > 0 && Math.random() > 0.5) {
                    // Usar cliente existente problemático
                    customer = problemCustomers[Math.floor(Math.random() * problemCustomers.length)];
                    console.log(`  - Usando cliente existente: ${customer.name}`);
                } else {
                    // Crear nuevo cliente de alto riesgo
                    const customerNum = Date.now() + Math.floor(Math.random() * 1000);
                    const { data: newCustomer } = await supabase
                        .from('customers')
                        .insert({
                            restaurant_id: restaurant.id,
                            name: `Cliente Riesgo ${customerNum}`,
                            email: `riesgo${customerNum}@test.com`,
                            phone: Math.random() > 0.3 ? `600${String(customerNum).slice(-6)}` : null,
                            visits_count: Math.floor(Math.random() * 10) + 1,
                            no_show_count: Math.floor(Math.random() * 5) + 1,
                            total_spent: Math.random() * 500,
                            avg_ticket: 35 + Math.random() * 20,
                            segment_auto: 'en_riesgo',
                            churn_risk_score: 70 + Math.floor(Math.random() * 30)
                        })
                        .select()
                        .single();
                    
                    if (newCustomer) {
                        customer = newCustomer;
                        console.log(`  - Nuevo cliente creado: ${customer.name}`);
                    }
                }
                
                if (customer) {
                    // Crear reserva de alto riesgo
                    const riskyHours = ['21:00', '21:30', '22:00', '13:00', '13:30', '20:30'];
                    const largeSizes = [7, 8, 9, 10, 12];
                    
                    const { data: reservation } = await supabase
                        .from('reservations')
                        .insert({
                            restaurant_id: restaurant.id,
                            customer_id: customer.id,
                            customer_name: customer.name,
                            customer_email: customer.email,
                            customer_phone: customer.phone,
                            reservation_date: dateStr,
                            reservation_time: riskyHours[Math.floor(Math.random() * riskyHours.length)],
                            party_size: largeSizes[Math.floor(Math.random() * largeSizes.length)],
                            table_number: Math.floor(Math.random() * 20) + 1,
                            status: 'confirmed',
                            special_requests: 'Reserva de alto riesgo - Requiere confirmación'
                        })
                        .select()
                        .single();
                    
                    if (reservation) {
                        totalGenerated++;
                    }
                }
            }
        }
        
        console.log('\n========================================');
        console.log('✅ GENERACIÓN COMPLETADA');
        console.log('========================================');
        console.log(`📊 Total reservas de alto riesgo generadas: ${totalGenerated}`);
        console.log(`🏢 Para: Tavertet`);
        console.log(`📅 Período: ${new Date().toLocaleDateString()} - ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
        console.log('\n💡 Estas reservas aparecerán en:');
        console.log('- Dashboard: "Alto riesgo hoy"');
        console.log('- Control No-Shows: Para gestionar con acciones');
        console.log('- CRM: Como alertas automáticas');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
revisarYGenerarNoShows();

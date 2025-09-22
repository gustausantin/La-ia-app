import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos del restaurante Tavertet
const TAVERTET_ID = '310e1734-381d-4fda-8806-7c338a28c6be';
const TAVERTET_NAME = 'Tavertet';

async function darVidaCompletaTavertet() {
    try {
        console.log('🏢 DANDO VIDA COMPLETA A TAVERTET\n');
        console.log('=' .repeat(50));
        
        // 1. REVISAR ESTADO ACTUAL
        console.log('\n📊 ESTADO ACTUAL DEL RESTAURANTE:\n');
        
        // Clientes
        const { count: clientesCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`👥 Clientes: ${clientesCount || 0}`);
        
        // Reservas
        const { count: reservasCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`📅 Reservas totales: ${reservasCount || 0}`);
        
        // Consumos
        const { count: consumosCount } = await supabase
            .from('billing_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`🍽️ Consumos/Tickets: ${consumosCount || 0}`);
        
        // Comunicaciones
        const { count: conversationsCount } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`💬 Conversaciones: ${conversationsCount || 0}`);
        
        const { count: messagesCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`📨 Mensajes: ${messagesCount || 0}`);
        
        // CRM
        const { count: crmCount } = await supabase
            .from('crm_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`🤖 Sugerencias CRM: ${crmCount || 0}`);
        
        // Plantillas
        const { count: templatesCount } = await supabase
            .from('message_templates')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        console.log(`📝 Plantillas mensaje: ${templatesCount || 0}`);
        
        console.log('\n' + '=' .repeat(50));
        console.log('\n🚀 GENERANDO VIDA COMPLETA...\n');
        
        // 2. GENERAR CLIENTES VARIADOS (si no hay suficientes)
        if (clientesCount < 50) {
            console.log('👥 Generando clientes variados...');
            const tiposCliente = ['VIP', 'regular', 'ocasional', 'nuevo', 'en_riesgo'];
            
            for (let i = 0; i < 30; i++) {
                const tipo = tiposCliente[i % tiposCliente.length];
                const customerNum = Date.now() + i;
                
                await supabase.from('customers').insert({
                    restaurant_id: TAVERTET_ID,
                    name: `${tipo === 'VIP' ? 'VIP ' : ''}Cliente ${['García', 'Martínez', 'López', 'Sánchez', 'González'][i % 5]} ${i}`,
                    email: `cliente${customerNum}@gmail.com`,
                    phone: `+346${String(customerNum).slice(-8)}`,
                    visits_count: tipo === 'VIP' ? 20 + i : tipo === 'regular' ? 10 : tipo === 'nuevo' ? 0 : 5,
                    total_spent: tipo === 'VIP' ? 2000 + (i * 100) : tipo === 'regular' ? 500 : 100,
                    avg_ticket: tipo === 'VIP' ? 100 : tipo === 'regular' ? 50 : 35,
                    segment_auto: tipo,
                    churn_risk_score: tipo === 'en_riesgo' ? 85 : tipo === 'VIP' ? 10 : 30,
                    last_visit_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
                });
            }
            console.log('✅ 30 clientes variados creados');
        }
        
        // 3. GENERAR RESERVAS PASADAS CON CONSUMOS VINCULADOS
        console.log('\n🍽️ Generando historial de reservas y consumos...');
        
        // Obtener clientes para las reservas
        const { data: clientes } = await supabase
            .from('customers')
            .select('*')
            .eq('restaurant_id', TAVERTET_ID)
            .limit(30);
        
        let reservasCreadas = 0;
        let consumosCreados = 0;
        
        // Últimos 30 días de historial
        for (let dayOffset = -30; dayOffset <= -1; dayOffset++) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() + dayOffset);
            const fechaStr = fecha.toISOString().split('T')[0];
            
            // 5-10 reservas por día
            const numReservas = 5 + Math.floor(Math.random() * 6);
            
            for (let i = 0; i < numReservas; i++) {
                const cliente = clientes[Math.floor(Math.random() * clientes.length)];
                if (!cliente) continue;
                
                // Crear reserva pasada
                const { data: reserva } = await supabase
                    .from('reservations')
                    .insert({
                        restaurant_id: TAVERTET_ID,
                        customer_id: cliente.id,
                        customer_name: cliente.name,
                        customer_email: cliente.email,
                        customer_phone: cliente.phone,
                        reservation_date: fechaStr,
                        reservation_time: `${19 + (i % 4)}:${i % 2 === 0 ? '00' : '30'}`,
                        party_size: 2 + Math.floor(Math.random() * 4),
                        table_number: (i % 15) + 1,
                        status: Math.random() > 0.1 ? 'completed' : 'cancelled',
                        created_at: new Date(fecha.getTime() - 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select()
                    .single();
                
                if (reserva && reserva.status === 'completed') {
                    reservasCreadas++;
                    
                    // Crear consumo vinculado
                    const items = [];
                    const numItems = 3 + Math.floor(Math.random() * 5);
                    let total = 0;
                    
                    for (let j = 0; j < numItems; j++) {
                        const precio = 10 + Math.random() * 40;
                        const cantidad = 1 + Math.floor(Math.random() * 3);
                        items.push({
                            name: ['Paella', 'Pizza Margarita', 'Ensalada César', 'Pasta Carbonara', 'Tiramisú', 'Vino Tinto', 'Agua', 'Café'][j % 8],
                            quantity: cantidad,
                            price: precio,
                            total: precio * cantidad
                        });
                        total += precio * cantidad;
                    }
                    
                    await supabase.from('billing_tickets').insert({
                        restaurant_id: TAVERTET_ID,
                        reservation_id: reserva.id,
                        customer_id: cliente.id,
                        customer_name: cliente.name,
                        ticket_number: `T${Date.now()}${i}`,
                        date: fechaStr,
                        time: reserva.reservation_time,
                        table_number: reserva.table_number,
                        party_size: reserva.party_size,
                        items: items,
                        subtotal: total,
                        tax: total * 0.21,
                        total: total * 1.21,
                        payment_method: ['cash', 'card', 'card'][Math.floor(Math.random() * 3)],
                        status: 'paid'
                    });
                    
                    consumosCreados++;
                }
            }
        }
        
        console.log(`✅ ${reservasCreadas} reservas históricas creadas`);
        console.log(`✅ ${consumosCreados} consumos vinculados creados`);
        
        // 4. GENERAR COMUNICACIONES (última semana)
        console.log('\n💬 Generando comunicaciones recientes...');
        
        let conversacionesCreadas = 0;
        let mensajesCreados = 0;
        
        for (const cliente of clientes.slice(0, 15)) {
            // Crear conversación
            const { data: conversation } = await supabase
                .from('conversations')
                .insert({
                    restaurant_id: TAVERTET_ID,
                    customer_id: cliente.id,
                    customer_name: cliente.name,
                    customer_phone: cliente.phone,
                    customer_email: cliente.email,
                    channel: ['whatsapp', 'email', 'phone'][Math.floor(Math.random() * 3)],
                    status: ['active', 'closed', 'pending'][Math.floor(Math.random() * 3)],
                    priority: cliente.segment_auto === 'VIP' ? 'high' : 'normal',
                    last_message: 'Gracias por su visita',
                    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();
            
            if (conversation) {
                conversacionesCreadas++;
                
                // Crear 2-5 mensajes por conversación
                const numMensajes = 2 + Math.floor(Math.random() * 4);
                for (let m = 0; m < numMensajes; m++) {
                    const esEntrada = m % 2 === 0;
                    await supabase.from('messages').insert({
                        restaurant_id: TAVERTET_ID,
                        customer_id: cliente.id,
                        customer_name: cliente.name,
                        customer_phone: cliente.phone,
                        message_text: esEntrada ? 
                            '¿Tienen mesa para esta noche?' : 
                            'Sí, tenemos disponibilidad a las 21:00',
                        direction: esEntrada ? 'inbound' : 'outbound',
                        channel: conversation.channel,
                        created_at: new Date(Date.now() - (7 - m) * 24 * 60 * 60 * 1000).toISOString()
                    });
                    mensajesCreados++;
                }
            }
        }
        
        console.log(`✅ ${conversacionesCreadas} conversaciones creadas`);
        console.log(`✅ ${mensajesCreados} mensajes creados`);
        
        // 5. GENERAR SUGERENCIAS CRM
        console.log('\n🤖 Generando sugerencias CRM inteligentes...');
        
        const tiposSugerencia = [
            { type: 'vip_upgrade', title: 'Actualizar a VIP', priority: 'high' },
            { type: 'reactivation', title: 'Reactivar cliente inactivo', priority: 'medium' },
            { type: 'feedback', title: 'Solicitar feedback', priority: 'low' },
            { type: 'birthday', title: 'Cumpleaños próximo', priority: 'high' },
            { type: 'noshow_followup', title: 'Seguimiento no-show', priority: 'high' }
        ];
        
        let crmCreadas = 0;
        for (const cliente of clientes.slice(0, 20)) {
            const tipo = tiposSugerencia[Math.floor(Math.random() * tiposSugerencia.length)];
            await supabase.from('crm_suggestions').insert({
                restaurant_id: TAVERTET_ID,
                customer_id: cliente.id,
                type: tipo.type,
                title: `${tipo.title}: ${cliente.name}`,
                description: `Cliente con ${cliente.visits_count} visitas. Última visita: hace ${Math.floor(Math.random() * 30)} días`,
                priority: tipo.priority,
                status: 'pending',
                metadata: {
                    customer_segment: cliente.segment_auto,
                    total_spent: cliente.total_spent
                }
            });
            crmCreadas++;
        }
        
        console.log(`✅ ${crmCreadas} sugerencias CRM creadas`);
        
        // 6. CREAR PLANTILLAS DE MENSAJES
        console.log('\n📝 Creando plantillas de mensajes...');
        
        const plantillas = [
            {
                name: 'Confirmación Reserva',
                category: 'reservation',
                content: 'Hola {{customer_name}}, confirmamos tu reserva para {{reservation_date}} a las {{reservation_time}}. Mesa para {{party_size}} personas. ¡Te esperamos!',
                channel: 'whatsapp'
            },
            {
                name: 'Prevención No-Show',
                category: 'noshow_prevention',
                content: 'Hola {{customer_name}}, te recordamos tu reserva de hoy a las {{reservation_time}}. ¿Todo correcto? Responde SÍ para confirmar.',
                channel: 'whatsapp'
            },
            {
                name: 'Bienvenida VIP',
                category: 'vip',
                content: 'Estimado/a {{customer_name}}, como cliente VIP tienes acceso a nuestra carta exclusiva y descuentos especiales. ¡Gracias por tu fidelidad!',
                channel: 'email'
            },
            {
                name: 'Reactivación',
                category: 'reactivation',
                content: 'Hola {{customer_name}}, te echamos de menos. Aquí tienes un 20% de descuento para tu próxima visita. Código: VUELVE20',
                channel: 'whatsapp'
            },
            {
                name: 'Solicitud Feedback',
                category: 'feedback',
                content: '{{customer_name}}, ¿cómo fue tu experiencia en {{restaurant_name}}? Tu opinión es muy importante: [link feedback]',
                channel: 'email'
            }
        ];
        
        for (const plantilla of plantillas) {
            await supabase.from('message_templates').insert({
                restaurant_id: TAVERTET_ID,
                ...plantilla,
                is_active: true
            });
        }
        
        console.log(`✅ ${plantillas.length} plantillas creadas`);
        
        // 7. TRACKING DE NO-SHOWS
        console.log('\n📊 Generando métricas de no-shows...');
        
        // Obtener reservas de los últimos 7 días
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        
        const { data: reservasRecientes } = await supabase
            .from('reservations')
            .select('*')
            .eq('restaurant_id', TAVERTET_ID)
            .gte('reservation_date', hace7Dias.toISOString().split('T')[0])
            .lt('reservation_date', new Date().toISOString().split('T')[0]);
        
        let noShowsPrevenidos = 0;
        let noShowsReales = 0;
        
        for (const reserva of (reservasRecientes || [])) {
            // Simular que enviamos mensaje preventivo
            const enviado = Math.random() > 0.3; // 70% se enviaron
            const respondio = enviado && Math.random() > 0.4; // 60% respondieron
            const vino = respondio || Math.random() > 0.2; // 80% vinieron si no respondieron
            
            if (enviado) {
                await supabase.from('noshow_actions').insert({
                    restaurant_id: TAVERTET_ID,
                    reservation_id: reserva.id,
                    customer_id: reserva.customer_id,
                    customer_name: reserva.customer_name,
                    reservation_date: reserva.reservation_date,
                    reservation_time: reserva.reservation_time,
                    party_size: reserva.party_size,
                    risk_level: Math.random() > 0.5 ? 'high' : 'medium',
                    risk_score: 60 + Math.floor(Math.random() * 40),
                    action_type: 'whatsapp_confirmation',
                    channel: 'whatsapp',
                    message_sent: 'Mensaje de confirmación enviado',
                    customer_response: respondio ? 'confirmed' : 'no_response',
                    final_outcome: vino ? 'attended' : 'no_show',
                    prevented_noshow: vino && !respondio
                });
                
                if (vino && enviado) noShowsPrevenidos++;
                if (!vino) noShowsReales++;
            }
        }
        
        console.log(`✅ ${noShowsPrevenidos} no-shows prevenidos`);
        console.log(`❌ ${noShowsReales} no-shows reales`);
        console.log(`📈 Tasa de prevención: ${((noShowsPrevenidos / (noShowsPrevenidos + noShowsReales)) * 100).toFixed(1)}%`);
        
        // RESUMEN FINAL
        console.log('\n' + '=' .repeat(50));
        console.log('\n🎉 VIDA COMPLETA GENERADA PARA TAVERTET\n');
        
        // Contar todo de nuevo
        const { count: finalClientes } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        
        const { count: finalReservas } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        
        const { count: finalConsumos } = await supabase
            .from('billing_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        
        const { count: finalConversaciones } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        
        const { count: finalCRM } = await supabase
            .from('crm_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', TAVERTET_ID);
        
        console.log('📊 ESTADO FINAL:');
        console.log(`👥 Clientes: ${finalClientes}`);
        console.log(`📅 Reservas: ${finalReservas}`);
        console.log(`🍽️ Consumos: ${finalConsumos}`);
        console.log(`💬 Conversaciones: ${finalConversaciones}`);
        console.log(`🤖 Sugerencias CRM: ${finalCRM}`);
        
        console.log('\n✅ Tu restaurante Tavertet ahora tiene VIDA COMPLETA');
        console.log('📱 Ve a la aplicación y verás:');
        console.log('- Dashboard con métricas reales');
        console.log('- Clientes segmentados (VIP, regulares, en riesgo)');
        console.log('- Historial de reservas y consumos');
        console.log('- Comunicaciones activas');
        console.log('- CRM con sugerencias inteligentes');
        console.log('- Tracking de no-shows con métricas de éxito');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
darVidaCompletaTavertet();

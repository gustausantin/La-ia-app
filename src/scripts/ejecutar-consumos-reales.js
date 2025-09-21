// ejecutar-consumos-reales.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemtqYXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNTYyNDU0MywiZXhwIjoyMDQxMjAwNTQzfQ.jZGf3cPSV_A0NMY8RuQF5R3nJZDcVCH0VoNsVYIQRpk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ejecutarConsumosReales() {
    try {
        // Leer el archivo SQL
        const sqlContent = fs.readFileSync(path.join(__dirname, 'CREAR-CONSUMOS-REALES.sql'), 'utf8');
        
        // Ejecutar el SQL
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sqlContent
        });

        if (error) {
            // Si no existe la función, ejecutar directamente
            console.log('Ejecutando SQL directamente...');
            
            // Como no podemos ejecutar DO blocks directamente, vamos a hacerlo con JavaScript
            await crearConsumosConJS();
        } else {
            console.log('Script ejecutado correctamente');
        }
    } catch (error) {
        console.error('Error:', error);
        // Ejecutar con JavaScript
        await crearConsumosConJS();
    }
}

async function crearConsumosConJS() {
    console.log('Creando consumos con JavaScript...');
    
    const platos = [
        { name: 'Paella de Mariscos', category: 'Principales', price: 28.50 },
        { name: 'Gazpacho Andaluz', category: 'Entrantes', price: 8.50 },
        { name: 'Tortilla Española', category: 'Entrantes', price: 12.00 },
        { name: 'Croquetas de Jamón', category: 'Entrantes', price: 9.50 },
        { name: 'Pulpo a la Gallega', category: 'Principales', price: 24.00 },
        { name: 'Patatas Bravas', category: 'Entrantes', price: 7.50 },
        { name: 'Gambas al Ajillo', category: 'Entrantes', price: 14.50 },
        { name: 'Calamares a la Romana', category: 'Entrantes', price: 11.00 },
        { name: 'Ensalada Mixta', category: 'Ensaladas', price: 9.00 },
        { name: 'Jamón Ibérico', category: 'Entrantes', price: 22.00 },
        { name: 'Queso Manchego', category: 'Entrantes', price: 16.00 },
        { name: 'Albóndigas en Salsa', category: 'Principales', price: 18.50 },
        { name: 'Merluza a la Vasca', category: 'Principales', price: 26.00 },
        { name: 'Cochinillo Asado', category: 'Principales', price: 35.00 },
        { name: 'Crema Catalana', category: 'Postres', price: 6.50 },
        { name: 'Flan Casero', category: 'Postres', price: 5.50 },
        { name: 'Tarta de Santiago', category: 'Postres', price: 7.00 },
        { name: 'Churros con Chocolate', category: 'Postres', price: 8.50 },
        { name: 'Sangría', category: 'Bebidas', price: 12.00 },
        { name: 'Vino Rioja', category: 'Bebidas', price: 18.00 }
    ];

    // Obtener el restaurante - primero intentar por nombre, si no, obtener el primero
    let { data: restaurant, error: error1 } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('name', 'Tavertet')
        .single();

    if (error1) {
        console.log('No se encontró Tavertet, buscando cualquier restaurante...');
        // Si no existe Tavertet, obtener el primer restaurante
        const { data: allRestaurants, error: error2 } = await supabase
            .from('restaurants')
            .select('id, name')
            .limit(1)
            .single();
        
        if (error2) {
            console.error('Error obteniendo restaurantes:', error2);
            
            // Usar el ID conocido directamente
            const knownRestaurantId = 'f47ac10b-58cc-4372-a567-0e02b2c3479';
            console.log('Usando ID conocido del restaurante');
            restaurant = { id: knownRestaurantId, name: 'Tavertet' };
        } else {
            restaurant = allRestaurants;
        }
    }

    if (!restaurant) {
        console.log('No se encontró ningún restaurante');
        return;
    }

    console.log(`Usando restaurante: ${restaurant.name}`);
    const restaurantId = restaurant.id;

    // Limpiar consumos del día
    await supabase
        .from('billing_tickets')
        .delete()
        .eq('restaurant_id', restaurantId)
        .gte('ticket_date', '2025-09-21 00:00:00')
        .lte('ticket_date', '2025-09-21 23:59:59');

    // Obtener reservas del día
    const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', '2025-09-21')
        .in('status', ['confirmed', 'completed']);

    console.log(`Procesando ${reservations?.length || 0} reservas...`);

    // Crear tickets para cada reserva
    for (const reservation of (reservations || [])) {
        const items = [];
        let total = 0;

        // Generar items basados en el tamaño del grupo
        const numItems = reservation.party_size * 3;
        for (let i = 0; i < numItems; i++) {
            const plato = platos[Math.floor(Math.random() * platos.length)];
            const quantity = Math.random() < 0.3 ? 2 : 1;
            const itemTotal = plato.price * quantity;
            
            items.push({
                name: plato.name,
                category: plato.category,
                quantity: quantity,
                price: plato.price,
                total: itemTotal
            });
            
            total += itemTotal;
        }

        // Crear el ticket vinculado
        const ticketData = {
            restaurant_id: restaurantId,
            reservation_id: reservation.id, // VINCULACIÓN AUTOMÁTICA
            customer_id: reservation.customer_id,
            external_ticket_id: `TKT-20250921-${Math.floor(Math.random() * 9999 + 1)}`,
            ticket_number: `TICKET#${Math.floor(Math.random() * 9999 + 1)}`,
            mesa_number: reservation.table_number || Math.floor(Math.random() * 10 + 1).toString(),
            ticket_date: `2025-09-21 ${reservation.reservation_time}`,
            service_start: reservation.reservation_time,
            items: items,
            subtotal: total,
            tax_amount: total * 0.10,
            discount_amount: Math.random() < 0.1 ? total * 0.05 : 0,
            tip_amount: Math.random() < 0.3 ? total * 0.1 : 0,
            total_amount: total * 1.10,
            payment_method: Math.random() < 0.6 ? 'card' : Math.random() < 0.9 ? 'cash' : 'mobile',
            payment_status: 'paid',
            covers_count: reservation.party_size,
            waiter_name: ['Carlos', 'María', 'Juan', 'Ana'][Math.floor(Math.random() * 4)],
            is_processed: true,
            auto_matched: true,
            confidence_score: 1.0
        };

        const { error } = await supabase
            .from('billing_tickets')
            .insert(ticketData);

        if (error) {
            console.error('Error creando ticket:', error);
        }
    }

    // Crear algunos walk-ins sin reserva
    console.log('Creando walk-ins...');
    for (let i = 0; i < 5; i++) {
        const items = [];
        let total = 0;

        const numItems = Math.floor(Math.random() * 4 + 2);
        for (let j = 0; j < numItems; j++) {
            const plato = platos[Math.floor(Math.random() * platos.length)];
            const quantity = Math.floor(Math.random() * 2 + 1);
            const itemTotal = plato.price * quantity;
            
            items.push({
                name: plato.name,
                category: plato.category,
                quantity: quantity,
                price: plato.price,
                total: itemTotal
            });
            
            total += itemTotal;
        }

        const hour = 12 + Math.floor(Math.random() * 10);
        const minute = Math.floor(Math.random() * 60);

        const walkInData = {
            restaurant_id: restaurantId,
            reservation_id: null, // Sin reserva
            external_ticket_id: `WLK-20250921-${i + 1}`,
            ticket_number: `WALK#${i + 1}`,
            mesa_number: Math.floor(Math.random() * 10 + 1).toString(),
            ticket_date: `2025-09-21 ${hour}:${minute.toString().padStart(2, '0')}:00`,
            service_start: `${hour}:${minute.toString().padStart(2, '0')}:00`,
            items: items,
            subtotal: total,
            tax_amount: total * 0.10,
            total_amount: total * 1.10,
            payment_method: Math.random() < 0.7 ? 'card' : 'cash',
            payment_status: 'paid',
            covers_count: Math.floor(Math.random() * 4 + 1),
            is_processed: true,
            auto_matched: false,
            confidence_score: 0
        };

        const { error } = await supabase
            .from('billing_tickets')
            .insert(walkInData);

        if (error) {
            console.error('Error creando walk-in:', error);
        }
    }

    // Contar resultados
    const { count: vinculados } = await supabase
        .from('billing_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .not('reservation_id', 'is', null)
        .gte('ticket_date', '2025-09-21 00:00:00')
        .lte('ticket_date', '2025-09-21 23:59:59');

    const { count: sinVincular } = await supabase
        .from('billing_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .is('reservation_id', null)
        .gte('ticket_date', '2025-09-21 00:00:00')
        .lte('ticket_date', '2025-09-21 23:59:59');

    console.log('✅ Consumos creados:');
    console.log(`- Vinculados a reservas: ${vinculados || 0}`);
    console.log(`- Sin vincular (walk-ins): ${sinVincular || 0}`);
    console.log(`- Total del día: ${(vinculados || 0) + (sinVincular || 0)}`);
}

// Ejecutar
ejecutarConsumosReales();

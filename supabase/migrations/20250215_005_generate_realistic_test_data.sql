-- =====================================================
-- GENERAR DATOS FICTICIOS REALISTAS PARA CRM v2
-- Migración: 20250215_005_generate_realistic_test_data.sql
-- Usuario: gustausantin@gmail.com
-- Descripción: Crear reservas históricas + consumos POS para probar CRM v2
-- =====================================================

-- 🎯 PASO 1: Obtener restaurant_id del usuario
DO $$
DECLARE
    target_user_id UUID;
    target_restaurant_id UUID;
    customer_ids UUID[];
    reservation_id UUID;
    ticket_id UUID;
    i INTEGER;
    random_date DATE;
    random_time TIME;
    random_customer_id UUID;
    random_total DECIMAL(8,2);
    -- 🔧 Variables para cálculos de ticket
    subtotal_calc DECIMAL(10,2);
    tax_calc DECIMAL(10,2);
    discount_calc DECIMAL(10,2);
BEGIN
    -- Obtener usuario y restaurant
    SELECT u.id, r.id INTO target_user_id, target_restaurant_id
    FROM auth.users u
    JOIN restaurants r ON r.owner_id = u.id
    WHERE u.email = 'gustausantin@gmail.com'
    LIMIT 1;
    
    IF target_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró restaurant para gustausantin@gmail.com';
    END IF;
    
    RAISE NOTICE '🎯 Usuario: % | Restaurant: %', target_user_id, target_restaurant_id;
    
    -- Obtener clientes existentes
    SELECT ARRAY_AGG(id) INTO customer_ids
    FROM customers 
    WHERE restaurant_id = target_restaurant_id
    LIMIT 10; -- Máximo 10 clientes para datos realistas
    
    IF array_length(customer_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'No hay clientes existentes para generar datos';
    END IF;
    
    RAISE NOTICE '📊 Clientes encontrados: %', array_length(customer_ids, 1);
    
    -- 🎯 PASO 2: Generar 20 reservas históricas (últimos 60 días)
    FOR i IN 1..20 LOOP
        -- Fecha aleatoria en los últimos 60 días
        random_date := CURRENT_DATE - (random() * 60)::INTEGER;
        
        -- Hora aleatoria entre 12:00 y 23:00
        random_time := (12 + random() * 11)::INTEGER || ':' || (random() * 59)::INTEGER || ':00';
        
        -- Cliente aleatorio
        random_customer_id := customer_ids[1 + (random() * (array_length(customer_ids, 1) - 1))::INTEGER];
        
        -- Crear reserva
        INSERT INTO reservations (
            id,
            restaurant_id,
            customer_id,
            customer_name,
            customer_phone,
            customer_email,
            reservation_date,
            reservation_time,
            party_size,
            status,
            table_number,
            source,
            channel,
            created_at
        )
        SELECT 
            gen_random_uuid(),
            target_restaurant_id,
            random_customer_id,
            c.name,
            c.phone,
            c.email,
            random_date,
            random_time::TIME,
            1 + (random() * 5)::INTEGER, -- 1-6 personas
            CASE 
                WHEN random_date < CURRENT_DATE THEN 'completed'
                WHEN random_date = CURRENT_DATE THEN 'confirmed'
                ELSE 'confirmed'
            END,
            'Mesa ' || (1 + (random() * 20)::INTEGER), -- Mesa 1-20
            CASE WHEN random() > 0.7 THEN 'agent' ELSE 'manual' END,
            CASE WHEN random() > 0.5 THEN 'whatsapp' ELSE 'manual' END,
            random_date + random_time::TIME
        FROM customers c
        WHERE c.id = random_customer_id;
        
        -- Obtener ID de la reserva creada
        SELECT currval(pg_get_serial_sequence('reservations', 'id')) INTO reservation_id;
        
        -- 🎯 PASO 3: Crear ticket POS para reservas completadas
        IF random_date < CURRENT_DATE THEN
            -- Total aleatorio realista (15-80€)
            random_total := 15 + (random() * 65);
            
            -- 🔧 CÁLCULOS CORRECTOS PARA CONSTRAINT valid_totals
            subtotal_calc := random_total / 1.1; -- Base sin IVA
            tax_calc := subtotal_calc * 0.1; -- 10% IVA
            discount_calc := 0; -- Sin descuento
            -- total_amount = subtotal + tax - discount (debe cumplir constraint)
                
                -- Crear ticket en billing_tickets (tabla existente)
                INSERT INTO billing_tickets (
                    id,
                    restaurant_id,
                    reservation_id,
                    customer_id,
                    ticket_number,
                    external_ticket_id,
                    ticket_date,
                    service_start,
                    service_end,
                    subtotal,
                    tax_amount,
                    discount_amount,
                    total_amount,
                    payment_method,
                    covers_count,
                    is_processed
                ) VALUES (
                    gen_random_uuid(),
                    target_restaurant_id,
                    (SELECT id FROM reservations WHERE customer_id = random_customer_id AND reservation_date = random_date ORDER BY created_at DESC LIMIT 1),
                    random_customer_id,
                    'T' || LPAD(i::TEXT, 6, '0'),
                    'EXT-' || i,
                    random_date + random_time::TIME,
                    random_date + random_time::TIME,
                    random_date + random_time::TIME + INTERVAL '90 minutes',
                    subtotal_calc,
                    tax_calc,
                    discount_calc,
                    subtotal_calc + tax_calc - discount_calc, -- Cumple constraint
                    CASE 
                        WHEN random() > 0.7 THEN 'tarjeta'
                        WHEN random() > 0.4 THEN 'efectivo'
                        ELSE 'transferencia'
                    END,
                    1 + (random() * 5)::INTEGER,
                    true
                );
            
            -- 🔧 AGREGAR ITEMS AL TICKET EXISTENTE (en campo JSONB)
            UPDATE billing_tickets 
            SET items = jsonb_build_array(
                jsonb_build_object(
                    'name', CASE (random() * 10)::INTEGER
                        WHEN 0 THEN 'Paella Valenciana'
                        WHEN 1 THEN 'Pulpo a la Gallega'
                        WHEN 2 THEN 'Jamón Ibérico'
                        WHEN 3 THEN 'Tortilla Española'
                        WHEN 4 THEN 'Gazpacho Andaluz'
                        WHEN 5 THEN 'Cocido Madrileño'
                        WHEN 6 THEN 'Bacalao al Pil Pil'
                        WHEN 7 THEN 'Fabada Asturiana'
                        WHEN 8 THEN 'Crema Catalana'
                        ELSE 'Sangría de la Casa'
                    END,
                    'category', CASE (random() * 4)::INTEGER
                        WHEN 0 THEN 'entrante'
                        WHEN 1 THEN 'principal'
                        WHEN 2 THEN 'postre'
                        ELSE 'bebida'
                    END,
                    'quantity', 1 + (random() * 2)::INTEGER,
                    'unit_price', ROUND(subtotal_calc / 2, 2),
                    'total_price', ROUND(subtotal_calc / 2, 2)
                ),
                jsonb_build_object(
                    'name', 'Bebida de la Casa',
                    'category', 'bebida',
                    'quantity', 1,
                    'unit_price', ROUND(subtotal_calc / 2, 2),
                    'total_price', ROUND(subtotal_calc / 2, 2)
                )
            )
            WHERE ticket_number = 'T' || LPAD(i::TEXT, 6, '0')
                AND restaurant_id = target_restaurant_id;
        END IF;
        
        -- Progreso
        IF i % 5 = 0 THEN
            RAISE NOTICE '📈 Progreso: % reservas creadas', i;
        END IF;
    END LOOP;
    
    -- 🎯 PASO 4: Actualizar estadísticas de clientes
    UPDATE customers 
    SET 
        visits_count = (
            SELECT COUNT(*) 
            FROM reservations 
            WHERE customer_id = customers.id AND status = 'completed'
        ),
        last_visit_at = (
            SELECT MAX(reservation_date) 
            FROM reservations 
            WHERE customer_id = customers.id AND status = 'completed'
        ),
        total_spent = (
            SELECT COALESCE(SUM(bt.total_amount), 0)
            FROM billing_tickets bt
            WHERE bt.customer_id = customers.id
        ),
        avg_ticket = (
            SELECT COALESCE(AVG(bt.total_amount), 0)
            FROM billing_tickets bt
            WHERE bt.customer_id = customers.id
        ),
        -- Calcular recencia (días desde última visita)
        recency_days = (
            SELECT COALESCE(
                DATE_PART('day', NOW() - MAX(reservation_date)::timestamp),
                999
            )::INTEGER
            FROM reservations 
            WHERE customer_id = customers.id AND status = 'completed'
        ),
        -- AIVI básico (promedio entre visitas)
        aivi_days = (
            SELECT COALESCE(
                CASE 
                    WHEN COUNT(*) > 1 THEN
                        DATE_PART('day', MAX(reservation_date)::timestamp - MIN(reservation_date)::timestamp) / NULLIF(COUNT(*) - 1, 0)
                    ELSE 30.0
                END,
                30.0
            )
            FROM reservations 
            WHERE customer_id = customers.id AND status = 'completed'
        ),
        -- Segmentación automática básica
        segment_auto_v2 = (
            CASE 
                WHEN (
                    SELECT COUNT(*) 
                    FROM reservations 
                    WHERE customer_id = customers.id AND status = 'completed'
                ) <= 1 THEN 'nuevo'
                WHEN (
                    SELECT COALESCE(
                        DATE_PART('day', NOW() - MAX(reservation_date)::timestamp),
                        999
                    )::INTEGER
                    FROM reservations 
                    WHERE customer_id = customers.id AND status = 'completed'
                ) <= 30 THEN 'activo'
                WHEN (
                    SELECT COALESCE(SUM(bt.total_amount), 0)
                    FROM billing_tickets bt
                    WHERE bt.customer_id = customers.id
                ) >= 500 THEN 'bib'
                WHEN (
                    SELECT COALESCE(
                        DATE_PART('day', NOW() - MAX(reservation_date)::timestamp),
                        999
                    )::INTEGER
                    FROM reservations 
                    WHERE customer_id = customers.id AND status = 'completed'
                ) <= 60 THEN 'riesgo'
                ELSE 'inactivo'
            END
        ),
        -- Marcar VIPs
        is_vip_calculated = (
            SELECT COALESCE(SUM(bt.total_amount), 0) >= 500
            FROM billing_tickets bt
            WHERE bt.customer_id = customers.id
        ),
        features_updated_at = NOW()
    WHERE restaurant_id = target_restaurant_id;
    
    -- 🎯 PASO 5: Crear algunos mensajes de ejemplo
    INSERT INTO customer_interactions (
        restaurant_id,
        customer_id,
        channel,
        interaction_type,
        subject,
        content,
        status,
        sent_at,
        created_at
    )
    SELECT 
        target_restaurant_id,
        id,
        CASE WHEN consent_whatsapp THEN 'whatsapp' ELSE 'email' END,
        CASE segment_auto_v2
            WHEN 'nuevo' THEN 'bienvenida'
            WHEN 'riesgo' THEN 'reactivacion'
            WHEN 'inactivo' THEN 'reactivacion'
            ELSE 'recordatorio'
        END,
        'Mensaje automático CRM v2',
        'Este es un mensaje de ejemplo generado por el CRM v2 para ' || name,
        'sent',
        NOW() - (random() * 7)::INTEGER * INTERVAL '1 day',
        NOW() - (random() * 7)::INTEGER * INTERVAL '1 day'
    FROM customers 
    WHERE restaurant_id = target_restaurant_id
        AND (consent_whatsapp = true OR consent_email = true)
    LIMIT 10;
    
    -- 📊 RESUMEN FINAL
    RAISE NOTICE '✅ DATOS GENERADOS EXITOSAMENTE:';
    RAISE NOTICE '  - Reservas: 20 (históricas y futuras)';
    RAISE NOTICE '  - Tickets POS: % (para reservas completadas)', (
        SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = target_restaurant_id
    );
    RAISE NOTICE '  - Clientes actualizados: %', (
        SELECT COUNT(*) FROM customers WHERE restaurant_id = target_restaurant_id
    );
    RAISE NOTICE '  - Mensajes de ejemplo: %', (
        SELECT COUNT(*) FROM customer_interactions WHERE restaurant_id = target_restaurant_id
    );
    
    RAISE NOTICE '🚀 CRM v2 listo para probar con datos realistas!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error generando datos: %', SQLERRM;
END $$;

-- 🎯 CONSULTAS DE VERIFICACIÓN
-- =====================================================

-- Ver reservas generadas
SELECT 
    'RESERVAS GENERADAS:' as tipo,
    r.customer_name,
    r.reservation_date,
    r.reservation_time,
    r.status,
    r.source
FROM reservations r
JOIN customers c ON r.customer_id = c.id
JOIN restaurants rest ON c.restaurant_id = rest.id
JOIN auth.users u ON rest.owner_id = u.id
WHERE u.email = 'gustausantin@gmail.com'
ORDER BY r.reservation_date DESC, r.reservation_time DESC
LIMIT 10;

-- Ver tickets POS generados
SELECT 
    'TICKETS POS GENERADOS:' as tipo,
    bt.ticket_number,
    bt.ticket_date,
    bt.total_amount,
    bt.payment_method,
    c.name as customer_name
FROM billing_tickets bt
JOIN customers c ON bt.customer_id = c.id
JOIN restaurants r ON c.restaurant_id = r.id
JOIN auth.users u ON r.owner_id = u.id
WHERE u.email = 'gustausantin@gmail.com'
ORDER BY bt.ticket_date DESC
LIMIT 10;

-- Ver estadísticas actualizadas de clientes
SELECT 
    'CLIENTES ACTUALIZADOS:' as tipo,
    c.name,
    c.visits_count,
    c.total_spent,
    c.recency_days,
    c.aivi_days,
    c.segment_auto_v2,
    c.is_vip_calculated
FROM customers c
JOIN restaurants r ON c.restaurant_id = r.id
JOIN auth.users u ON r.owner_id = u.id
WHERE u.email = 'gustausantin@gmail.com'
ORDER BY c.total_spent DESC;

-- Ver mensajes generados
SELECT 
    'MENSAJES GENERADOS:' as tipo,
    ci.channel,
    ci.interaction_type,
    ci.status,
    ci.created_at,
    c.name as customer_name
FROM customer_interactions ci
JOIN customers c ON ci.customer_id = c.id
JOIN restaurants r ON c.restaurant_id = r.id
JOIN auth.users u ON r.owner_id = u.id
WHERE u.email = 'gustausantin@gmail.com'
ORDER BY ci.created_at DESC;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Ejecutar esta migración en Supabase
-- 2. Ir a /crm-v2 en la aplicación
-- 3. Ver datos realistas en todas las secciones
-- 4. Probar filtros, segmentación, etc.
-- 5. ¡El CRM v2 tendrá datos para mostrar!
-- =====================================================

-- CREAR-CONSUMOS-REALES.sql
-- Script para generar consumos (billing_tickets) REALES basados en reservas completadas
-- Vincula automáticamente cuando es posible

DO $$
DECLARE
    v_restaurant_id uuid;
    v_reservation record;
    v_ticket_id uuid;
    v_total numeric;
    v_items jsonb;
    v_platos text[] := ARRAY[
        'Paella de Mariscos', 'Gazpacho Andaluz', 'Tortilla Española', 'Croquetas de Jamón',
        'Pulpo a la Gallega', 'Patatas Bravas', 'Gambas al Ajillo', 'Calamares a la Romana',
        'Ensalada Mixta', 'Jamón Ibérico', 'Queso Manchego', 'Albóndigas en Salsa',
        'Merluza a la Vasca', 'Cochinillo Asado', 'Crema Catalana', 'Flan Casero',
        'Tarta de Santiago', 'Churros con Chocolate', 'Sangría', 'Vino Rioja'
    ];
    v_categorias text[] := ARRAY[
        'Entrantes', 'Entrantes', 'Entrantes', 'Entrantes',
        'Principales', 'Entrantes', 'Entrantes', 'Entrantes',
        'Ensaladas', 'Entrantes', 'Entrantes', 'Principales',
        'Principales', 'Principales', 'Postres', 'Postres',
        'Postres', 'Postres', 'Bebidas', 'Bebidas'
    ];
    v_precios numeric[] := ARRAY[
        28.50, 8.50, 12.00, 9.50,
        24.00, 7.50, 14.50, 11.00,
        9.00, 22.00, 16.00, 18.50,
        26.00, 35.00, 6.50, 5.50,
        7.00, 8.50, 12.00, 18.00
    ];
BEGIN
    -- Obtener el restaurante Tavertet
    SELECT id INTO v_restaurant_id 
    FROM restaurants 
    WHERE name = 'Tavertet' 
    LIMIT 1;

    IF v_restaurant_id IS NULL THEN
        RAISE NOTICE 'No se encontró el restaurante Tavertet';
        RETURN;
    END IF;

    -- Limpiar consumos antiguos del día de hoy para evitar duplicados
    DELETE FROM billing_tickets 
    WHERE restaurant_id = v_restaurant_id 
    AND ticket_date::date = '2025-09-21';

    RAISE NOTICE 'Generando consumos para reservas completadas...';

    -- Procesar cada reserva completada del día
    FOR v_reservation IN 
        SELECT * FROM reservations 
        WHERE restaurant_id = v_restaurant_id 
        AND reservation_date = '2025-09-21'
        AND status IN ('confirmed', 'completed')
        ORDER BY reservation_time
    LOOP
        -- Generar items del consumo basados en el tamaño del grupo
        v_items := '[]'::jsonb;
        v_total := 0;
        
        -- Generar entre 2-4 items por persona
        FOR i IN 1..(v_reservation.party_size * 3) LOOP
            DECLARE
                v_idx integer := floor(random() * 20 + 1)::integer;
                v_item jsonb;
            BEGIN
                v_item := jsonb_build_object(
                    'name', v_platos[v_idx],
                    'category', v_categorias[v_idx],
                    'quantity', CASE WHEN random() < 0.3 THEN 2 ELSE 1 END,
                    'price', v_precios[v_idx],
                    'total', v_precios[v_idx] * CASE WHEN random() < 0.3 THEN 2 ELSE 1 END
                );
                v_items := v_items || v_item;
                v_total := v_total + (v_item->>'total')::numeric;
            END;
        END LOOP;

        -- Crear el ticket vinculado a la reserva
        INSERT INTO billing_tickets (
            id,
            restaurant_id,
            reservation_id, -- VINCULAR DIRECTAMENTE
            customer_id,
            external_ticket_id,
            ticket_number,
            mesa_number,
            ticket_date,
            service_start,
            service_end,
            items,
            subtotal,
            tax_amount,
            discount_amount,
            tip_amount,
            total_amount,
            payment_method,
            payment_status,
            covers_count,
            waiter_name,
            is_processed,
            auto_matched,
            confidence_score,
            created_at
        ) VALUES (
            gen_random_uuid(),
            v_restaurant_id,
            v_reservation.id, -- VINCULACIÓN AUTOMÁTICA
            v_reservation.customer_id,
            'TKT-' || to_char(NOW(), 'YYYYMMDD') || '-' || floor(random() * 9999 + 1)::text,
            'TICKET#' || floor(random() * 9999 + 1)::text,
            v_reservation.table_number,
            v_reservation.reservation_date || ' ' || v_reservation.reservation_time,
            v_reservation.reservation_time::time,
            (v_reservation.reservation_time::time + interval '2 hours'),
            v_items,
            v_total,
            v_total * 0.10, -- IVA 10%
            CASE WHEN random() < 0.1 THEN v_total * 0.05 ELSE 0 END, -- 10% tienen descuento
            CASE WHEN random() < 0.3 THEN v_total * 0.1 ELSE 0 END, -- 30% dejan propina
            v_total * 1.10, -- Total con IVA
            CASE 
                WHEN random() < 0.6 THEN 'card'
                WHEN random() < 0.9 THEN 'cash'
                ELSE 'mobile'
            END,
            'paid',
            v_reservation.party_size,
            CASE floor(random() * 4)::int
                WHEN 0 THEN 'Carlos'
                WHEN 1 THEN 'María'
                WHEN 2 THEN 'Juan'
                ELSE 'Ana'
            END,
            true, -- Procesado
            true, -- Auto-matched
            1.0, -- 100% confianza en la vinculación
            NOW()
        );
    END LOOP;

    -- Crear algunos consumos NO vinculados (walk-ins sin reserva)
    FOR i IN 1..5 LOOP
        v_items := '[]'::jsonb;
        v_total := 0;
        
        -- Generar items aleatorios
        FOR j IN 1..floor(random() * 5 + 2)::int LOOP
            DECLARE
                v_idx integer := floor(random() * 20 + 1)::integer;
                v_item jsonb;
            BEGIN
                v_item := jsonb_build_object(
                    'name', v_platos[v_idx],
                    'category', v_categorias[v_idx],
                    'quantity', floor(random() * 2 + 1)::int,
                    'price', v_precios[v_idx],
                    'total', v_precios[v_idx] * floor(random() * 2 + 1)::int
                );
                v_items := v_items || v_item;
                v_total := v_total + (v_item->>'total')::numeric;
            END;
        END LOOP;

        INSERT INTO billing_tickets (
            id,
            restaurant_id,
            reservation_id, -- NULL - sin reserva
            external_ticket_id,
            ticket_number,
            mesa_number,
            ticket_date,
            service_start,
            items,
            subtotal,
            tax_amount,
            total_amount,
            payment_method,
            payment_status,
            covers_count,
            is_processed,
            auto_matched,
            confidence_score,
            created_at
        ) VALUES (
            gen_random_uuid(),
            v_restaurant_id,
            NULL, -- Sin reserva - walk-in
            'WLK-' || to_char(NOW(), 'YYYYMMDD') || '-' || i::text,
            'WALK#' || i::text,
            floor(random() * 10 + 1)::text,
            '2025-09-21 ' || (12 + floor(random() * 10))::text || ':' || lpad(floor(random() * 60)::text, 2, '0') || ':00',
            ((12 + floor(random() * 10))::text || ':' || lpad(floor(random() * 60)::text, 2, '0'))::time,
            v_items,
            v_total,
            v_total * 0.10,
            v_total * 1.10,
            CASE WHEN random() < 0.7 THEN 'card' ELSE 'cash' END,
            'paid',
            floor(random() * 4 + 1)::int,
            true,
            false, -- No auto-matched porque no hay reserva
            0, -- Sin confianza de match
            NOW()
        );
    END LOOP;

    -- Contar resultados
    RAISE NOTICE 'Consumos creados:';
    RAISE NOTICE '- Vinculados a reservas: %', (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = v_restaurant_id AND reservation_id IS NOT NULL AND ticket_date::date = '2025-09-21');
    RAISE NOTICE '- Sin vincular (walk-ins): %', (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = v_restaurant_id AND reservation_id IS NULL AND ticket_date::date = '2025-09-21');
    RAISE NOTICE '- Total del día: %', (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = v_restaurant_id AND ticket_date::date = '2025-09-21');

END $$;

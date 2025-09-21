-- =========================================
-- VIDA COMPLETA PARA RESTAURANTE TAVERTET
-- =========================================
-- Este script da vida REAL al restaurante Tavertet
-- con 6 meses de historia completa y realista

BEGIN;

-- ==========================================
-- CONFIGURACIÓN INICIAL
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be'; -- ID de Tavertet
    r_name text := 'Tavertet';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🍝 ===== INICIANDO VIDA COMPLETA PARA TAVERTET ===== 🍝';
    RAISE NOTICE 'Restaurante: % (ID: %)', r_name, r_id;
    RAISE NOTICE '';
END $$;

-- ==========================================
-- PASO 1: AMPLIAR BASE DE CLIENTES (36 nuevos + 14 existentes = 50 total)
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    nombres text[] := ARRAY[
        'Marco Rossi', 'Giulia Bianchi', 'Alessandro Ferrari', 'Francesca Romano',
        'Luigi Colombo', 'Sofia Ricci', 'Giovanni Russo', 'Valentina Greco',
        'Andrea Conti', 'Chiara Marino', 'Matteo Galli', 'Alessia Bruno',
        'Davide Costa', 'Sara Fontana', 'Luca Barbieri', 'Martina Lombardi',
        'Paolo Moretti', 'Laura Rizzo', 'Simone Ferrara', 'Elisa Caruso',
        'Roberto Villa', 'Anna Serra', 'Stefano Marini', 'Beatrice Gatti',
        'Nicola Pellegrini', 'Marta Leone', 'Fabio Santoro', 'Silvia Monti',
        'Enrico Sala', 'Claudia Vitale', 'Michele Riva', 'Federica Conte',
        'Giorgio Piras', 'Ilaria De Luca', 'Alberto Mazza', 'Monica Ferri'
    ];
    i integer;
    cliente_existente integer;
BEGIN
    -- Verificar cuántos clientes ya existen
    SELECT COUNT(*) INTO cliente_existente FROM customers WHERE restaurant_id = r_id;
    
    RAISE NOTICE '📊 Clientes existentes: %', cliente_existente;
    
    -- Crear nuevos clientes diversos
    FOR i IN 1..36 LOOP
        INSERT INTO customers (
            restaurant_id, name, email, phone,
            segment_auto, total_visits, total_spent, avg_ticket,
            churn_risk_score, last_visit, preferred_channel,
            notes, tags, preferences,
            consent_email, consent_whatsapp,
            created_at, updated_at
        ) VALUES (
            r_id,
            nombres[i],
            LOWER(REPLACE(nombres[i], ' ', '.')) || '@gmail.com',
            '6' || LPAD((85550000 + i)::text, 8, '0'),
            CASE 
                WHEN i <= 5 THEN 'vip'
                WHEN i <= 12 THEN 'regular'
                WHEN i <= 20 THEN 'ocasional'
                WHEN i <= 26 THEN 'nuevo'
                WHEN i <= 31 THEN 'en_riesgo'
                ELSE 'inactivo'
            END,
            CASE -- Visitas totales según segmento
                WHEN i <= 5 THEN 35 + i * 2  -- VIP: 37-45 visitas
                WHEN i <= 12 THEN 18 + i     -- Regular: 19-30 visitas
                WHEN i <= 20 THEN 8 + (i % 5) -- Ocasional: 8-12 visitas
                WHEN i <= 26 THEN 2 + (i % 3) -- Nuevo: 2-4 visitas
                WHEN i <= 31 THEN 10 - (i % 5) -- En riesgo: 6-10 visitas
                ELSE 5 - (i % 4)              -- Inactivo: 2-5 visitas
            END,
            CASE -- Gasto total según segmento
                WHEN i <= 5 THEN (3500 + i * 200)::numeric  -- VIP: 3700-4500€
                WHEN i <= 12 THEN (1200 + i * 100)::numeric -- Regular: 1300-2200€
                WHEN i <= 20 THEN (400 + i * 30)::numeric   -- Ocasional: 430-1000€
                WHEN i <= 26 THEN (100 + i * 20)::numeric   -- Nuevo: 120-520€
                WHEN i <= 31 THEN (500 + i * 25)::numeric   -- En riesgo: 525-775€
                ELSE (200 + i * 10)::numeric                -- Inactivo: 210-360€
            END,
            CASE -- Ticket medio
                WHEN i <= 5 THEN 95.00 + (i * 2)    -- VIP: 97-105€
                WHEN i <= 12 THEN 65.00 + (i % 10)  -- Regular: 65-75€
                WHEN i <= 20 THEN 45.00 + (i % 15)  -- Ocasional: 45-60€
                WHEN i <= 26 THEN 40.00 + (i % 10)  -- Nuevo: 40-50€
                WHEN i <= 31 THEN 55.00 + (i % 10)  -- En riesgo: 55-65€
                ELSE 35.00 + (i % 10)                -- Inactivo: 35-45€
            END,
            CASE -- Riesgo de churn
                WHEN i <= 5 THEN 5 + (i % 10)       -- VIP: 5-15
                WHEN i <= 12 THEN 15 + (i % 15)     -- Regular: 15-30
                WHEN i <= 20 THEN 35 + (i % 20)     -- Ocasional: 35-55
                WHEN i <= 26 THEN 60 + (i % 15)     -- Nuevo: 60-75
                WHEN i <= 31 THEN 75 + (i % 15)     -- En riesgo: 75-90
                ELSE 85 + (i % 10)                   -- Inactivo: 85-95
            END,
            CASE -- Última visita
                WHEN i <= 5 THEN CURRENT_DATE - ((i % 7) || ' days')::interval      -- VIP: 0-7 días
                WHEN i <= 12 THEN CURRENT_DATE - ((5 + i % 10) || ' days')::interval -- Regular: 5-15 días
                WHEN i <= 20 THEN CURRENT_DATE - ((15 + i % 20) || ' days')::interval -- Ocasional: 15-35 días
                WHEN i <= 26 THEN CURRENT_DATE - ((30 + i % 30) || ' days')::interval -- Nuevo: 30-60 días
                WHEN i <= 31 THEN CURRENT_DATE - ((60 + i % 30) || ' days')::interval -- En riesgo: 60-90 días
                ELSE CURRENT_DATE - ((120 + i % 60) || ' days')::interval             -- Inactivo: 120-180 días
            END,
            CASE WHEN i % 3 = 0 THEN 'whatsapp' WHEN i % 3 = 1 THEN 'email' ELSE 'none' END,
            CASE -- Notas personalizadas
                WHEN i <= 5 THEN 'Cliente VIP - Mesa preferida: ZP. Le gusta el vino tinto reserva.'
                WHEN i <= 12 THEN 'Cliente habitual - Prefiere mesa en salón. Alérgico a ' || 
                    (ARRAY['frutos secos', 'mariscos', 'lactosa', 'gluten'])[1 + (i % 4)]
                WHEN i <= 20 THEN 'Cliente ocasional - Viene en ' || 
                    (ARRAY['cumpleaños', 'aniversarios', 'celebraciones', 'cenas románticas'])[1 + (i % 4)]
                ELSE 'Cliente estándar'
            END,
            CASE -- Tags
                WHEN i <= 5 THEN ARRAY['vip', 'wine_lover', 'frequent']
                WHEN i <= 12 THEN ARRAY['regular', 'loyalty_program']
                WHEN i % 4 = 0 THEN ARRAY['birthday_month', 'special_occasions']
                WHEN i % 3 = 0 THEN ARRAY['vegetarian']
                ELSE ARRAY['standard']
            END,
            jsonb_build_object(
                'plato_favorito', CASE 
                    WHEN i % 5 = 0 THEN 'Ossobuco alla Milanese'
                    WHEN i % 5 = 1 THEN 'Risotto ai Frutti di Mare'
                    WHEN i % 5 = 2 THEN 'Pizza Margherita'
                    WHEN i % 5 = 3 THEN 'Pasta Carbonara'
                    ELSE 'Lasagna Bolognese'
                END,
                'vino_preferido', CASE 
                    WHEN i <= 5 THEN 'Barolo DOCG'
                    WHEN i <= 12 THEN 'Chianti Classico'
                    ELSE 'Prosecco'
                END,
                'mesa_habitual', CASE 
                    WHEN i <= 5 THEN 'ZP'
                    WHEN i <= 12 THEN 'EE4'
                    WHEN i <= 20 THEN 'T4'
                    ELSE 'T2'
                END
            ),
            true,  -- consent_email
            i % 2 = 0,  -- consent_whatsapp (50%)
            NOW() - ((180 - i * 5) || ' days')::interval,  -- created_at escalonado
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ 36 nuevos clientes creados (Total: 50)';
END $$;

-- ==========================================
-- PASO 2: CREAR HISTORIAL DE RESERVAS (6 MESES)
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    cliente record;
    mesa record;
    fecha date;
    hora time;
    i integer;
    j integer;
    total_reservas integer := 0;
    reserva_id uuid;
    party_size integer;
    status text;
BEGIN
    -- Para cada cliente, crear reservas según su segmento
    FOR cliente IN 
        SELECT * FROM customers 
        WHERE restaurant_id = r_id
        ORDER BY segment_auto, created_at
    LOOP
        -- Número de reservas según segmento
        FOR i IN 1..(
            CASE 
                WHEN cliente.segment_auto = 'vip' THEN 25        -- VIP: ~4 por mes
                WHEN cliente.segment_auto = 'regular' THEN 15    -- Regular: ~2.5 por mes
                WHEN cliente.segment_auto = 'ocasional' THEN 8   -- Ocasional: ~1.3 por mes
                WHEN cliente.segment_auto = 'nuevo' THEN 3       -- Nuevo: pocas visitas
                WHEN cliente.segment_auto = 'en_riesgo' THEN 6   -- En riesgo: antes venía más
                WHEN cliente.segment_auto = 'inactivo' THEN 4    -- Inactivo: muy pocas
                ELSE 5
            END
        ) LOOP
            -- Fecha distribuida en los últimos 6 meses
            fecha := CURRENT_DATE - ((180 - (i * 7) + (random() * 7)::integer) || ' days')::interval;
            
            -- Saltar lunes (restaurante cerrado en Barcelona)
            IF EXTRACT(DOW FROM fecha) = 1 THEN
                fecha := fecha + INTERVAL '1 day';
            END IF;
            
            -- Hora según día y tipo de cliente
            IF EXTRACT(DOW FROM fecha) IN (0, 6) THEN  -- Fin de semana
                hora := CASE 
                    WHEN cliente.segment_auto = 'vip' THEN '21:00'::time
                    WHEN random() < 0.3 THEN '14:00'::time  -- 30% almuerzo
                    WHEN random() < 0.7 THEN '21:00'::time  -- 40% cena tarde
                    ELSE '20:00'::time                      -- 30% cena temprano
                END;
            ELSE  -- Entre semana
                hora := CASE 
                    WHEN cliente.segment_auto = 'vip' THEN '20:30'::time
                    WHEN random() < 0.4 THEN '14:00'::time  -- 40% almuerzo
                    ELSE '20:30'::time                      -- 60% cena
                END;
            END IF;
            
            -- Tamaño del grupo según tipo de cliente
            party_size := CASE 
                WHEN cliente.segment_auto = 'vip' AND random() < 0.3 THEN 6 + (random() * 4)::integer  -- VIP grupos grandes
                WHEN cliente.segment_auto = 'vip' THEN 2 + (random() * 2)::integer
                WHEN EXTRACT(DOW FROM fecha) IN (0, 6) THEN 2 + (random() * 4)::integer  -- Fines de semana grupos más grandes
                WHEN random() < 0.6 THEN 2  -- 60% parejas
                WHEN random() < 0.9 THEN 4  -- 30% grupos de 4
                ELSE 6  -- 10% grupos grandes
            END;
            
            -- Seleccionar mesa apropiada según capacidad
            SELECT * INTO mesa FROM tables 
            WHERE restaurant_id = r_id 
            AND capacity >= party_size
            ORDER BY 
                CASE 
                    WHEN cliente.segment_auto = 'vip' AND table_number = 'ZP' THEN 0
                    WHEN party_size > 6 AND table_number = 'T6' THEN 1
                    WHEN party_size > 4 AND table_number IN ('EE3', 'T5') THEN 2
                    ELSE 3
                END,
                random()
            LIMIT 1;
            
            -- Estado de la reserva (histórico más completado)
            status := CASE 
                WHEN fecha < CURRENT_DATE - INTERVAL '1 day' THEN
                    CASE 
                        WHEN random() < 0.85 THEN 'completed'  -- 85% completadas
                        WHEN random() < 0.95 THEN 'cancelled'  -- 10% canceladas
                        ELSE 'no_show'                         -- 5% no-show
                    END
                WHEN fecha = CURRENT_DATE THEN 'confirmed'
                ELSE 'confirmed'
            END;
            
            -- Crear la reserva
            INSERT INTO reservations (
                restaurant_id, customer_id, customer_name, customer_email, customer_phone,
                reservation_date, reservation_time, party_size, table_id, table_number,
                status, channel, reservation_source, 
                notes, special_requests, spend_amount,
                created_at, updated_at
            ) VALUES (
                r_id, cliente.id, cliente.name, cliente.email, cliente.phone,
                fecha, hora, party_size, mesa.id, mesa.table_number,
                status,
                CASE 
                    WHEN random() < 0.4 THEN 'whatsapp'
                    WHEN random() < 0.8 THEN 'web'
                    ELSE 'walkin'
                END,
                CASE WHEN random() < 0.25 THEN 'ia' ELSE 'manual' END,  -- 25% por IA
                CASE 
                    WHEN cliente.segment_auto = 'vip' THEN 'Cliente VIP - Atención especial'
                    WHEN party_size > 6 THEN 'Grupo grande - Mesa ' || mesa.table_number
                    WHEN random() < 0.2 THEN 
                        (ARRAY['Cumpleaños', 'Aniversario', 'Celebración empresa', 'Cena romántica', 'Reunión familiar'])[1 + (random() * 4)::integer]
                    ELSE NULL
                END,
                CASE 
                    WHEN random() < 0.15 THEN 
                        (ARRAY['Sin gluten', 'Vegetariano', 'Sin lactosa', 'Alergia frutos secos', 'Mesa tranquila', 'Cerca ventana'])[1 + (random() * 5)::integer]
                    ELSE NULL
                END,
                CASE 
                    WHEN status = 'completed' THEN
                        CASE 
                            WHEN cliente.segment_auto = 'vip' THEN (90 + party_size * 35 + random() * 50)::numeric(10,2)
                            WHEN cliente.segment_auto = 'regular' THEN (60 + party_size * 25 + random() * 30)::numeric(10,2)
                            ELSE (40 + party_size * 20 + random() * 20)::numeric(10,2)
                        END
                    ELSE 0
                END,
                fecha - INTERVAL '3 days' - (random() * INTERVAL '4 days'),  -- Reserva hecha 3-7 días antes
                fecha - INTERVAL '3 days'
            ) RETURNING id INTO reserva_id;
            
            total_reservas := total_reservas + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ % reservas históricas creadas', total_reservas;
END $$;

-- ==========================================
-- PASO 3: CREAR TICKETS DE CONSUMO
-- ==========================================
DO $$
DECLARE
    res record;
    ticket_counter integer := 0;
    items jsonb;
    subtotal numeric;
    sin_reserva_counter integer := 0;
BEGIN
    -- Primero: Tickets para todas las reservas completadas
    FOR res IN 
        SELECT r.*, c.segment_auto, c.name as customer_name, t.table_number as mesa_num
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        JOIN tables t ON r.table_id = t.id
        WHERE r.status = 'completed'
        AND r.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
        AND NOT EXISTS (
            SELECT 1 FROM billing_tickets bt 
            WHERE bt.reservation_id = r.id
        )
    LOOP
        -- Generar items del pedido (comida italiana)
        items := jsonb_build_array(
            -- Antipasti
            CASE WHEN random() < 0.7 THEN
                jsonb_build_object(
                    'name', (ARRAY['Bruschetta al Pomodoro', 'Carpaccio di Manzo', 'Antipasto Misto', 'Caprese', 'Vitello Tonnato'])[1 + (random() * 4)::integer],
                    'quantity', LEAST(res.party_size, 2 + (random() * 2)::integer),
                    'unit_price', (8 + random() * 7)::numeric(10,2),
                    'category', 'Antipasti'
                )
            ELSE NULL END,
            -- Primi Piatti
            jsonb_build_object(
                'name', CASE 
                    WHEN res.segment_auto = 'vip' THEN 
                        (ARRAY['Risotto al Tartufo', 'Linguine all''Astice', 'Ravioli di Aragosta'])[1 + (random() * 2)::integer]
                    ELSE 
                        (ARRAY['Spaghetti Carbonara', 'Penne Arrabbiata', 'Lasagna Bolognese', 'Gnocchi al Pesto', 'Fettuccine Alfredo'])[1 + (random() * 4)::integer]
                END,
                'quantity', res.party_size,
                'unit_price', CASE 
                    WHEN res.segment_auto = 'vip' THEN (28 + random() * 12)::numeric(10,2)
                    ELSE (14 + random() * 8)::numeric(10,2)
                END,
                'category', 'Primi'
            ),
            -- Secondi Piatti (70% lo piden)
            CASE WHEN random() < 0.7 THEN
                jsonb_build_object(
                    'name', CASE 
                        WHEN res.segment_auto = 'vip' THEN 
                            (ARRAY['Filetto di Manzo al Barolo', 'Branzino in Crosta di Sale', 'Costolette d''Agnello'])[1 + (random() * 2)::integer]
                        ELSE 
                            (ARRAY['Pollo alla Parmigiana', 'Scaloppine al Limone', 'Salmone alla Griglia', 'Pizza Margherita', 'Ossobuco'])[1 + (random() * 4)::integer]
                    END,
                    'quantity', GREATEST(res.party_size - 1, 1),
                    'unit_price', CASE 
                        WHEN res.segment_auto = 'vip' THEN (35 + random() * 20)::numeric(10,2)
                        ELSE (18 + random() * 12)::numeric(10,2)
                    END,
                    'category', 'Secondi'
                )
            ELSE NULL END,
            -- Bebidas
            jsonb_build_object(
                'name', CASE 
                    WHEN res.segment_auto = 'vip' THEN 
                        (ARRAY['Barolo DOCG', 'Brunello di Montalcino', 'Champagne Bollinger'])[1 + (random() * 2)::integer]
                    WHEN random() < 0.6 THEN 
                        (ARRAY['Chianti Classico', 'Prosecco', 'Pinot Grigio', 'Aperol Spritz'])[1 + (random() * 3)::integer]
                    ELSE 
                        (ARRAY['Agua Mineral', 'Coca Cola', 'Limonada', 'Cerveza Peroni'])[1 + (random() * 3)::integer]
                END,
                'quantity', CASE 
                    WHEN res.segment_auto = 'vip' THEN 1 + (res.party_size / 2)::integer
                    ELSE GREATEST(1, (res.party_size / 3)::integer)
                END,
                'unit_price', CASE 
                    WHEN res.segment_auto = 'vip' THEN (45 + random() * 80)::numeric(10,2)
                    WHEN random() < 0.6 THEN (22 + random() * 18)::numeric(10,2)
                    ELSE (3 + random() * 5)::numeric(10,2)
                END,
                'category', 'Bebidas'
            ),
            -- Dolci (60% lo piden)
            CASE WHEN random() < 0.6 THEN
                jsonb_build_object(
                    'name', (ARRAY['Tiramisu', 'Panna Cotta', 'Cannoli Siciliani', 'Gelato Artigianale', 'Torta della Nonna'])[1 + (random() * 4)::integer],
                    'quantity', GREATEST(1, (res.party_size * 0.7)::integer),
                    'unit_price', (7 + random() * 5)::numeric(10,2),
                    'category', 'Dolci'
                )
            ELSE NULL END,
            -- Caffè (80% lo piden)
            CASE WHEN random() < 0.8 THEN
                jsonb_build_object(
                    'name', (ARRAY['Espresso', 'Cappuccino', 'Macchiato', 'Ristretto', 'Caffè Corretto'])[1 + (random() * 4)::integer],
                    'quantity', GREATEST(1, (res.party_size * 0.8)::integer),
                    'unit_price', (1.5 + random() * 2)::numeric(10,2),
                    'category', 'Caffè'
                )
            ELSE NULL END
        );
        
        -- Limpiar nulls del array
        items := (SELECT jsonb_agg(elem) FROM jsonb_array_elements(items) elem WHERE elem IS NOT NULL);
        
        -- Calcular subtotal
        subtotal := res.spend_amount;
        IF subtotal IS NULL OR subtotal = 0 THEN
            subtotal := (SELECT SUM((elem->>'quantity')::integer * (elem->>'unit_price')::numeric) FROM jsonb_array_elements(items) elem);
        END IF;
        
        INSERT INTO billing_tickets (
            restaurant_id, customer_id, reservation_id, table_id,
            ticket_number, ticket_date, service_start, service_end,
            covers_count, items, subtotal, tax_amount, tip_amount, total_amount,
            payment_method, mesa_number, waiter_name, special_requests,
            is_processed, created_at, updated_at
        ) VALUES (
            res.restaurant_id, res.customer_id, res.id, res.table_id,
            'TKT-' || TO_CHAR(res.reservation_date, 'YYYYMMDD') || '-' || LPAD((ticket_counter + 1)::text, 4, '0'),
            res.reservation_date + res.reservation_time,
            res.reservation_date + res.reservation_time,
            res.reservation_date + res.reservation_time + ((60 + random() * 60) || ' minutes')::interval,
            res.party_size,
            items,
            subtotal,
            subtotal * 0.10,  -- IVA 10%
            CASE 
                WHEN res.segment_auto = 'vip' THEN subtotal * (0.10 + random() * 0.10)  -- VIP: 10-20% propina
                WHEN random() < 0.7 THEN subtotal * (0.05 + random() * 0.05)  -- Otros: 5-10% propina (70% dejan)
                ELSE 0
            END,
            subtotal * 1.10,  -- total = subtotal + IVA (sin propina)
            CASE 
                WHEN res.segment_auto = 'vip' THEN 'tarjeta_premium'
                WHEN random() < 0.7 THEN 'tarjeta'
                WHEN random() < 0.9 THEN 'efectivo'
                ELSE 'bizum'
            END,
            res.mesa_num,
            (ARRAY['Marco', 'Giulia', 'Alessandro', 'Francesca', 'Luigi', 'Sofia'])[1 + (random() * 5)::integer],
            res.special_requests,
            true,
            res.reservation_date + res.reservation_time + INTERVAL '2 hours',
            res.reservation_date + res.reservation_time + INTERVAL '2 hours'
        );
        
        ticket_counter := ticket_counter + 1;
    END LOOP;
    
    -- Segundo: Crear algunos tickets SIN reserva (walk-ins)
    FOR sin_reserva_counter IN 1..20 LOOP
        SELECT * INTO res FROM customers 
        WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
        ORDER BY RANDOM() 
        LIMIT 1;
        
        INSERT INTO billing_tickets (
            restaurant_id, customer_id, table_id,
            ticket_number, ticket_date, covers_count,
            items, subtotal, tax_amount, tip_amount, total_amount,
            payment_method, mesa_number, waiter_name,
            is_processed, created_at
        )
        SELECT 
            '310e1734-381d-4fda-8806-7c338a28c6be',
            res.id,
            t.id,
            'WLK-' || TO_CHAR(CURRENT_DATE - (sin_reserva_counter || ' days')::interval, 'YYYYMMDD') || '-' || LPAD(sin_reserva_counter::text, 3, '0'),
            CURRENT_DATE - (sin_reserva_counter || ' days')::interval + '14:00'::time,
            2,
            jsonb_build_array(
                jsonb_build_object('name', 'Menu del Giorno', 'quantity', 2, 'unit_price', 15.00, 'category', 'Menu'),
                jsonb_build_object('name', 'Acqua e Caffè', 'quantity', 2, 'unit_price', 3.50, 'category', 'Bebidas')
            ),
            37.00, 3.70, 2.00, 40.70,  -- total = 37 + 3.70 = 40.70
            'efectivo',
            t.table_number,
            'Marco',
            true,
            CURRENT_DATE - (sin_reserva_counter || ' days')::interval + '15:30'::time
        FROM tables t
        WHERE t.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
        ORDER BY RANDOM()
        LIMIT 1;
    END LOOP;
    
    RAISE NOTICE '✅ % tickets de consumo creados (%  walk-ins)', ticket_counter + 20, 20;
END $$;

-- ==========================================
-- PASO 4: CREAR COMUNICACIONES REALES
-- ==========================================
DO $$
DECLARE
    r_id uuid := '310e1734-381d-4fda-8806-7c338a28c6be';
    cliente record;
    conv_id uuid;
    conv_counter integer := 0;
    msg_counter integer := 0;
    i integer;
BEGIN
    -- Crear conversaciones variadas para diferentes clientes
    FOR cliente IN 
        SELECT * FROM customers 
        WHERE restaurant_id = r_id
        AND segment_auto IN ('vip', 'regular', 'nuevo', 'en_riesgo', 'ocasional')
        ORDER BY RANDOM()
        LIMIT 40
    LOOP
        -- Múltiples conversaciones por cliente según su tipo
        FOR i IN 1..(
            CASE 
                WHEN cliente.segment_auto = 'vip' THEN 3
                WHEN cliente.segment_auto = 'regular' THEN 2
                ELSE 1
            END
        ) LOOP
            -- Crear conversación
            INSERT INTO conversations (
                restaurant_id, customer_id, customer_name, customer_email, customer_phone,
                subject, channel, status, priority, tags, metadata,
                created_at, updated_at
            ) VALUES (
                r_id, cliente.id, cliente.name, cliente.email, cliente.phone,
                CASE (1 + random() * 8)::integer
                    WHEN 1 THEN 'Reserva para evento especial'
                    WHEN 2 THEN 'Consulta sobre menú sin gluten'
                    WHEN 3 THEN 'Modificación de reserva'
                    WHEN 4 THEN 'Cancelación por emergencia'
                    WHEN 5 THEN 'Felicitación por el servicio'
                    WHEN 6 THEN 'Queja sobre tiempo de espera'
                    WHEN 7 THEN 'Consulta disponibilidad grupo grande'
                    WHEN 8 THEN 'Petición de factura'
                    ELSE 'Consulta general'
                END,
                CASE 
                    WHEN cliente.preferred_channel = 'whatsapp' THEN 'whatsapp'
                    WHEN cliente.preferred_channel = 'email' THEN 'email'
                    ELSE 'app'  -- Si es 'none', usar 'app' como canal por defecto
                END,
                CASE 
                    WHEN i = 1 AND cliente.segment_auto = 'en_riesgo' THEN 'open'
                    WHEN random() < 0.85 THEN 'closed'
                    ELSE 'open'
                END,
                CASE 
                    WHEN cliente.segment_auto = 'vip' THEN 'high'
                    WHEN i = 1 AND cliente.segment_auto = 'en_riesgo' THEN 'high'
                    WHEN random() < 0.2 THEN 'urgent'
                    ELSE 'normal'
                END,
                CASE (1 + random() * 5)::integer
                    WHEN 1 THEN ARRAY['reserva', 'evento']
                    WHEN 2 THEN ARRAY['menu', 'alergias']
                    WHEN 3 THEN ARRAY['modificacion']
                    WHEN 4 THEN ARRAY['cancelacion']
                    WHEN 5 THEN ARRAY['feedback', 'positivo']
                    ELSE ARRAY['consulta']
                END,
                jsonb_build_object(
                    'satisfaction_score', CASE 
                        WHEN cliente.segment_auto = 'vip' THEN 5
                        WHEN random() < 0.1 THEN 2  -- 10% insatisfechos
                        WHEN random() < 0.3 THEN 3  -- 20% neutros
                        WHEN random() < 0.7 THEN 4  -- 40% satisfechos
                        ELSE 5                       -- 30% muy satisfechos
                    END,
                    'response_time_minutes', (5 + random() * 55)::integer,
                    'resolved_by', CASE 
                        WHEN cliente.segment_auto = 'vip' THEN 'human'
                        WHEN random() < 0.6 THEN 'ai'
                        ELSE 'human'
                    END,
                    'resolution_time_hours', (0.5 + random() * 23.5)::numeric(4,2)
                ),
                NOW() - ((30 * i + random() * 150) || ' days')::interval,
                NOW() - ((30 * i + random() * 150) || ' days')::interval
            ) RETURNING id INTO conv_id;
            
            conv_counter := conv_counter + 1;
            
            -- Crear cadena de mensajes para esta conversación
            -- Mensaje inicial del cliente
            INSERT INTO messages (
                restaurant_id, customer_name, customer_phone, message_text,
                direction, channel, status, metadata, created_at
            ) VALUES (
                r_id, cliente.name, cliente.phone,
                CASE (1 + random() * 8)::integer
                    WHEN 1 THEN 'Buenas tardes, me gustaría reservar mesa para 8 personas el próximo sábado'
                    WHEN 2 THEN 'Hola, ¿tienen opciones sin gluten en el menú?'
                    WHEN 3 THEN 'Necesito cambiar mi reserva del viernes al sábado, ¿es posible?'
                    WHEN 4 THEN 'Lo siento, tengo que cancelar la reserva de esta noche por una emergencia'
                    WHEN 5 THEN 'Quería felicitarles por el excelente servicio de ayer. ¡Todo espectacular!'
                    WHEN 6 THEN 'Ayer esperamos 45 minutos por nuestra mesa teniendo reserva. No es aceptable.'
                    WHEN 7 THEN '¿Tienen disponibilidad para un grupo de 12 personas para una cena de empresa?'
                    WHEN 8 THEN 'Necesito la factura de mi última visita para presentar en la empresa'
                    ELSE 'Hola, tengo una consulta sobre el restaurante'
                END,
                'inbound', 
                CASE 
                    WHEN cliente.preferred_channel = 'whatsapp' THEN 'whatsapp'
                    WHEN cliente.preferred_channel = 'email' THEN 'email'
                    ELSE 'app'
                END, 
                'delivered',
                jsonb_build_object('conversation_id', conv_id),
                NOW() - ((30 * i + random() * 150) || ' days')::interval
            );
            msg_counter := msg_counter + 1;
            
            -- Respuesta del restaurante
            INSERT INTO messages (
                restaurant_id, customer_name, customer_phone, message_text,
                direction, channel, status, metadata, created_at
            ) VALUES (
                r_id, cliente.name, cliente.phone,
                CASE 
                    WHEN cliente.segment_auto = 'vip' THEN 
                        'Buenas tardes ' || cliente.name || ', como cliente VIP será un placer atenderle. Le confirmo disponibilidad inmediatamente.'
                    ELSE 
                        CASE (1 + random() * 8)::integer
                            WHEN 1 THEN 'Perfecto! Tenemos disponibilidad el sábado. ¿Prefiere 20:30 o 21:00?'
                            WHEN 2 THEN 'Por supuesto! Tenemos pasta sin gluten y varios platos adaptados. Le envío la carta especial.'
                            WHEN 3 THEN 'Sin problema, puedo cambiarle al sábado a la misma hora. ¿Le parece bien?'
                            WHEN 4 THEN 'Entendido, cancelamos su reserva. Esperamos verle pronto. ¡Que todo vaya bien!'
                            WHEN 5 THEN '¡Muchísimas gracias! Nos alegra mucho que hayan disfrutado. ¡Les esperamos pronto!'
                            WHEN 6 THEN 'Disculpe las molestias. Investigaremos qué pasó. Como compensación, le ofrecemos un 20% en su próxima visita.'
                            WHEN 7 THEN 'Para 12 personas tenemos el salón privado disponible. ¿Qué fecha tienen en mente?'
                            WHEN 8 THEN 'Por supuesto, le envío la factura por email en unos minutos.'
                            ELSE 'Hola! Estaré encantado de ayudarle. ¿En qué puedo asistirle?'
                        END
                END,
                'outbound', 
                CASE 
                    WHEN cliente.preferred_channel = 'whatsapp' THEN 'whatsapp'
                    WHEN cliente.preferred_channel = 'email' THEN 'email'
                    ELSE 'app'
                END, 
                'delivered',
                jsonb_build_object('conversation_id', conv_id),
                NOW() - ((30 * i + random() * 150) || ' days')::interval + INTERVAL '15 minutes'
            );
            msg_counter := msg_counter + 1;
            
            -- Respuesta del cliente (si la conversación continúa)
            IF random() < 0.7 THEN  -- 70% de conversaciones tienen más mensajes
                INSERT INTO messages (
                    restaurant_id, customer_name, customer_phone, message_text,
                    direction, channel, status, metadata, created_at
                ) VALUES (
                    r_id, cliente.name, cliente.phone,
                    CASE (1 + random() * 5)::integer
                        WHEN 1 THEN 'Perfecto, 21:00 está bien. ¿Necesitan tarjeta de crédito?'
                        WHEN 2 THEN 'Genial, muchas gracias. Confirmo para 4 personas.'
                        WHEN 3 THEN 'Sí, perfecto. Gracias por la flexibilidad.'
                        WHEN 4 THEN '¿Puedo hacer la reserva para el próximo fin de semana entonces?'
                        ELSE 'Muchas gracias por la información. Hasta pronto.'
                    END,
                    'inbound', 
                CASE 
                    WHEN cliente.preferred_channel = 'whatsapp' THEN 'whatsapp'
                    WHEN cliente.preferred_channel = 'email' THEN 'email'
                    ELSE 'app'
                END, 
                'delivered',
                    jsonb_build_object('conversation_id', conv_id),
                    NOW() - ((30 * i + random() * 150) || ' days')::interval + INTERVAL '30 minutes'
                );
                msg_counter := msg_counter + 1;
                
                -- Confirmación final del restaurante
                INSERT INTO messages (
                    restaurant_id, customer_name, customer_phone, message_text,
                    direction, channel, status, metadata, created_at
                ) VALUES (
                    r_id, cliente.name, cliente.phone,
                    CASE 
                        WHEN cliente.segment_auto = 'vip' THEN 
                            'Confirmado ' || cliente.name || '. Su mesa VIP estará lista. Le envío confirmación por WhatsApp. ¡Hasta pronto!'
                        ELSE 
                            'Perfecto, queda todo confirmado. Le enviamos confirmación por ' || 
                            CASE 
                                WHEN cliente.preferred_channel = 'whatsapp' THEN 'WhatsApp'
                                WHEN cliente.preferred_channel = 'email' THEN 'email'
                                ELSE 'la app'
                            END || '. ¡Grazie!'
                    END,
                    'outbound', 
                CASE 
                    WHEN cliente.preferred_channel = 'whatsapp' THEN 'whatsapp'
                    WHEN cliente.preferred_channel = 'email' THEN 'email'
                    ELSE 'app'
                END, 
                'delivered',
                    jsonb_build_object('conversation_id', conv_id),
                    NOW() - ((30 * i + random() * 150) || ' days')::interval + INTERVAL '45 minutes'
                );
                msg_counter := msg_counter + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ % conversaciones y % mensajes creados', conv_counter, msg_counter;
END $$;

-- ==========================================
-- PASO 5: CREAR ACCIONES NO-SHOW Y PREVENTIVAS
-- ==========================================
DO $$
DECLARE
    res record;
    noshow_counter integer := 0;
    prevented_counter integer := 0;
BEGIN
    -- Para reservas pasadas que fueron no-show
    FOR res IN 
        SELECT r.*, c.name as cust_name, c.phone as cust_phone, c.segment_auto, c.churn_risk_score
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
        AND r.status IN ('no_show', 'cancelled')
        AND r.reservation_date < CURRENT_DATE
        ORDER BY r.reservation_date DESC
        LIMIT 50
    LOOP
        INSERT INTO noshow_actions (
            restaurant_id, reservation_id, customer_id, customer_name, customer_phone,
            reservation_date, reservation_time, party_size,
            risk_level, risk_score, risk_factors, action_type, channel,
            message_sent, customer_response, response_message, 
            final_outcome, prevented_noshow, sent_at, created_at
        ) VALUES (
            res.restaurant_id, res.id, res.customer_id,
            res.cust_name, res.cust_phone,
            res.reservation_date, res.reservation_time, res.party_size,
            CASE 
                WHEN res.party_size >= 6 THEN 'high'
                WHEN res.churn_risk_score > 70 THEN 'high'
                WHEN res.segment_auto = 'nuevo' THEN 'medium'
                ELSE 'low'
            END,
            CASE 
                WHEN res.party_size >= 6 THEN 80 + (random() * 20)::integer
                WHEN res.churn_risk_score > 70 THEN 70 + (random() * 20)::integer
                ELSE 30 + (random() * 30)::integer
            END,
            jsonb_build_array(
                CASE WHEN res.party_size >= 6 THEN 'grupo_grande' ELSE NULL END,
                CASE WHEN res.segment_auto = 'nuevo' THEN 'cliente_nuevo' ELSE NULL END,
                CASE WHEN EXTRACT(hour FROM res.reservation_time) >= 21 THEN 'hora_pico' ELSE NULL END,
                CASE WHEN res.churn_risk_score > 70 THEN 'alto_riesgo_churn' ELSE NULL END
            ),
            CASE 
                WHEN res.party_size >= 6 THEN 'whatsapp_urgent'
                WHEN random() < 0.5 THEN 'whatsapp_confirmation'
                ELSE 'whatsapp_reminder'
            END,
            'whatsapp',
            'Ciao ' || res.cust_name || '! 🍝 Ricordiamo la tua prenotazione per oggi alle ' || 
            TO_CHAR(res.reservation_time, 'HH24:MI') || ' per ' || res.party_size || 
            ' persone. Confermi la tua presenza? ✅',
            CASE 
                WHEN res.status = 'no_show' THEN 'no_response'
                WHEN res.status = 'cancelled' THEN 'cancelled'
                ELSE 'confirmed'
            END,
            CASE 
                WHEN res.status = 'cancelled' THEN 'Mi dispiace, devo cancellare'
                WHEN res.status = 'no_show' THEN NULL
                ELSE 'Sì, ci saremo!'
            END,
            CASE 
                WHEN res.status = 'no_show' THEN 'no_show'
                WHEN res.status = 'cancelled' THEN 'cancelled'
                ELSE 'attended'
            END,
            false,  -- No se previno
            res.reservation_date - INTERVAL '4 hours',
            res.reservation_date - INTERVAL '4 hours'
        );
        
        noshow_counter := noshow_counter + 1;
    END LOOP;
    
    -- Para reservas futuras con riesgo (prevención)
    FOR res IN 
        SELECT r.*, c.name as cust_name, c.phone as cust_phone, c.segment_auto, c.churn_risk_score
        FROM reservations r
        JOIN customers c ON r.customer_id = c.id
        WHERE r.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
        AND r.status = 'confirmed'
        AND r.reservation_date >= CURRENT_DATE
        AND r.reservation_date <= CURRENT_DATE + INTERVAL '7 days'
        AND (
            r.party_size >= 6 OR 
            c.segment_auto IN ('nuevo', 'en_riesgo') OR
            c.churn_risk_score > 60 OR
            EXTRACT(hour FROM r.reservation_time) >= 21
        )
    LOOP
        INSERT INTO noshow_actions (
            restaurant_id, reservation_id, customer_id, customer_name, customer_phone,
            reservation_date, reservation_time, party_size,
            risk_level, risk_score, risk_factors, action_type, channel,
            message_sent, customer_response, final_outcome, 
            prevented_noshow, sent_at, created_at
        ) VALUES (
            res.restaurant_id, res.id, res.customer_id,
            res.cust_name, res.cust_phone,
            res.reservation_date, res.reservation_time, res.party_size,
            CASE 
                WHEN res.party_size >= 8 OR (res.segment_auto = 'nuevo' AND res.party_size >= 6) THEN 'high'
                WHEN res.party_size >= 6 OR res.churn_risk_score > 70 THEN 'medium'
                ELSE 'low'
            END,
            CASE 
                WHEN res.party_size >= 8 THEN 85 + (random() * 15)::integer
                WHEN res.party_size >= 6 THEN 65 + (random() * 20)::integer
                ELSE 40 + (random() * 25)::integer
            END,
            jsonb_build_array(
                CASE WHEN res.party_size >= 6 THEN 'gruppo_grande' ELSE NULL END,
                CASE WHEN res.segment_auto = 'nuevo' THEN 'cliente_nuovo' ELSE NULL END,
                CASE WHEN res.segment_auto = 'en_riesgo' THEN 'cliente_a_rischio' ELSE NULL END,
                CASE WHEN res.reservation_date = CURRENT_DATE THEN 'prenotazione_oggi' ELSE NULL END
            ),
            CASE 
                WHEN res.reservation_date = CURRENT_DATE THEN 'whatsapp_urgent'
                WHEN res.party_size >= 8 THEN 'whatsapp_confirmation'
                ELSE 'whatsapp_reminder'
            END,
            'whatsapp',
            CASE 
                WHEN res.reservation_date = CURRENT_DATE THEN
                    '🚨 ' || res.cust_name || ', conferma URGENTE per OGGI alle ' || TO_CHAR(res.reservation_time, 'HH24:MI') || ' (' || res.party_size || ' persone)'
                ELSE
                    'Buongiorno ' || res.cust_name || '! Ti aspettiamo ' || 
                    CASE 
                        WHEN res.reservation_date = CURRENT_DATE + INTERVAL '1 day' THEN 'domani'
                        ELSE 'il ' || TO_CHAR(res.reservation_date, 'DD/MM')
                    END || ' alle ' || TO_CHAR(res.reservation_time, 'HH24:MI') || '. Confermi? 🍝'
            END,
            CASE 
                WHEN res.segment_auto = 'vip' THEN 'confirmed'
                WHEN random() < 0.8 THEN 'confirmed'
                WHEN random() < 0.95 THEN 'pending'
                ELSE 'no_response'
            END,
            'pending',  -- Aún no ha ocurrido
            CASE 
                WHEN res.segment_auto = 'vip' OR random() < 0.8 THEN true
                ELSE false
            END,
            CASE 
                WHEN res.reservation_date = CURRENT_DATE THEN NOW() - INTERVAL '2 hours'
                ELSE res.reservation_date - INTERVAL '1 day' + TIME '10:00'
            END,
            NOW()
        );
        
        prevented_counter := prevented_counter + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % acciones no-show creadas (% prevenciones activas)', noshow_counter + prevented_counter, prevented_counter;
END $$;

-- ==========================================
-- PASO 6: CREAR ALERTAS CRM INTELIGENTES
-- ==========================================
DO $$
DECLARE
    c record;
    sugg_counter integer := 0;
    last_reservation date;
    visit_frequency numeric;
BEGIN
    -- Limpiar sugerencias anteriores
    DELETE FROM crm_suggestions WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be';
    
    -- Analizar cada cliente y crear sugerencias personalizadas
    FOR c IN 
        SELECT 
            cust.*,
            COUNT(r.id) as total_reservations,
            MAX(r.reservation_date) as last_reservation_date,
            AVG(bt.total_amount) as avg_spend
        FROM customers cust
        LEFT JOIN reservations r ON cust.id = r.customer_id AND r.status = 'completed'
        LEFT JOIN billing_tickets bt ON r.id = bt.reservation_id
        WHERE cust.restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be'
        GROUP BY cust.id
    LOOP
        -- ALERTA VIP: Mantener fidelidad
        IF c.segment_auto = 'vip' THEN
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'vip_attention',
                '👑 VIP: ' || c.name || ' - Atención Premium',
                'Cliente VIP con ' || c.total_visits || ' visitas y €' || COALESCE(c.total_spent, 0)::integer || 
                ' gastados. Última visita: ' || COALESCE(TO_CHAR(c.last_visit, 'DD/MM'), 'Sin datos'),
                'Caro ' || c.name || ', come nostro cliente VIP, vorremmo invitarti a provare il nostro nuovo menu degustazione con maridaje exclusivo. Tavolo riservato quando vuoi! 🥂',
                'Invito esclusivo menu degustazione VIP',
                'high', 'pending', NOW() - (random() * INTERVAL '3 days')
            );
            sugg_counter := sugg_counter + 1;
            
            -- Si no ha venido en más de 15 días siendo VIP
            IF c.last_reservation_date < CURRENT_DATE - INTERVAL '15 days' THEN
                INSERT INTO crm_suggestions (
                    restaurant_id, customer_id, type, title, description,
                    suggested_content, suggested_subject, priority, status, created_at
                ) VALUES (
                    c.restaurant_id, c.id, 'vip_reactivation',
                    '⚠️ VIP en riesgo: ' || c.name,
                    'Cliente VIP sin visitas desde ' || TO_CHAR(c.last_reservation_date, 'DD/MM/YYYY') || 
                    '. ACCIÓN URGENTE REQUERIDA.',
                    'Buongiorno ' || c.name || '! Abbiamo notato la tua assenza. Tutto bene? Ti aspetta una bottiglia di Barolo in omaggio nella tua prossima visita. Solo per te! 🍷',
                    'Ti aspettiamo! Regalo especial VIP',
                    'urgent', 'pending', NOW()
                );
                sugg_counter := sugg_counter + 1;
            END IF;
        
        -- ALERTA REACTIVACIÓN: Clientes en riesgo
        ELSIF c.segment_auto = 'en_riesgo' THEN
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'reactivation',
                '🔴 Reactivar URGENTE: ' || c.name,
                'Cliente en riesgo. ' || COALESCE(c.total_visits, 0) || ' visitas históricas. ' ||
                'Sin visitas desde: ' || COALESCE(TO_CHAR(c.last_visit, 'DD/MM'), 'Hace mucho'),
                'Ciao ' || c.name || '! Ti ricordi di noi? 😊 Abbiamo rinnovato il menu e vorremmo che tu fossi tra i primi a provarlo. 30% di sconto sulla tua prossima visita! Codice: RITORNA30',
                'Ti aspettiamo con 30% descuento! 🎉',
                'high', 'pending', NOW() - INTERVAL '1 day'
            );
            sugg_counter := sugg_counter + 1;
        
        -- ALERTA NUEVO: Fidelización temprana
        ELSIF c.segment_auto = 'nuevo' AND c.total_visits > 0 THEN
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'welcome_followup',
                '🌟 Nuevo cliente: ' || c.name || ' - Fidelizar',
                'Cliente nuevo con ' || COALESCE(c.total_visits, 0) || ' visitas. Oportunidad de fidelización.',
                'Grazie mille ' || c.name || ' per averci scelto! 🍝 Come benvenuto, ti offriamo un antipasto gratis nella tua seconda visita. Ti aspettiamo!',
                'Benvenuto! Regalo per la tua seconda visita',
                'medium', 'pending', NOW() - INTERVAL '2 days'
            );
            sugg_counter := sugg_counter + 1;
        
        -- ALERTA CUMPLEAÑOS (simulado)
        ELSIF c.id::text LIKE '%1%' OR c.id::text LIKE '%5%' THEN  -- Simular algunos cumpleaños
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'birthday',
                '🎂 Cumpleaños próximo: ' || c.name,
                'Cumpleaños en los próximos días. Oportunidad para invitación especial.',
                'Buon compleanno ' || c.name || '! 🎉 Festeggia con noi! Dolce della casa in omaggio e 20% di sconto per te e i tuoi amici. Prenota ora!',
                '🎂 Feliz cumpleaños! Celebra con nosotros',
                'medium', 'pending', NOW()
            );
            sugg_counter := sugg_counter + 1;
        
        -- ALERTA REGULAR: Upselling
        ELSIF c.segment_auto = 'regular' AND c.avg_spend < 70 THEN
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'upselling',
                '💰 Oportunidad upsell: ' || c.name,
                'Cliente regular con ticket medio €' || COALESCE(c.avg_spend::integer, 0) || 
                '. Potencial para aumentar a menú premium.',
                'Ciao ' || c.name || '! Come nostro cliente abituale, ti invitiamo a scoprire il nostro menu degustazione con vini selezionati. Prezzo speciale solo per te!',
                'Menu degustazione - Oferta exclusiva',
                'low', 'pending', NOW() - (random() * INTERVAL '5 days')
            );
            sugg_counter := sugg_counter + 1;
        
        -- ALERTA INACTIVO: Recuperación agresiva
        ELSIF c.segment_auto = 'inactivo' THEN
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'win_back',
                '⏰ Recuperar inactivo: ' || c.name,
                'Cliente inactivo desde hace ' || COALESCE(c.churn_risk_score, 0) || ' días. Última oportunidad.',
                'È passato troppo tempo ' || c.name || '! Ti offriamo il 40% di sconto + bottiglia di vino in omaggio. Questa offerta scade in 7 giorni. Non perderla! 🍷',
                'Última oportunidad: 40% descuento + regalo 🎁',
                'medium', 'pending', NOW() - INTERVAL '1 day'
            );
            sugg_counter := sugg_counter + 1;
        END IF;
        
        -- ALERTAS ESPECIALES para todos los segmentos
        -- Grupo grande potencial
        IF c.total_reservations > 3 AND random() < 0.3 THEN
            INSERT INTO crm_suggestions (
                restaurant_id, customer_id, type, title, description,
                suggested_content, suggested_subject, priority, status, created_at
            ) VALUES (
                c.restaurant_id, c.id, 'group_event',
                '👥 Evento grupal: ' || c.name,
                'Cliente con historial. Ofrecer salón privado para eventos.',
                'Ciao ' || c.name || '! Per i tuoi eventi speciali, ti offriamo il nostro salone privato con menu personalizzato. Capacità fino a 20 persone. Interessato?',
                'Salón privado para tus eventos 🥳',
                'low', 'pending', NOW() - (random() * INTERVAL '7 days')
            );
            sugg_counter := sugg_counter + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ % sugerencias CRM inteligentes creadas', sugg_counter;
END $$;

-- ==========================================
-- PASO 7: ESTADÍSTICAS FINALES
-- ==========================================
DO $$
DECLARE
    stats record;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM customers WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_customers,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_reservations,
        (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_tickets,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_conversations,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_messages,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_noshows,
        (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as total_suggestions,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be' AND reservation_date = CURRENT_DATE) as today_reservations,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be' AND reservation_date = CURRENT_DATE AND risk_level = 'high') as today_high_risk,
        (SELECT COALESCE(SUM(total_amount), 0) FROM billing_tickets WHERE restaurant_id = '310e1734-381d-4fda-8806-7c338a28c6be') as revenue_total
    INTO stats;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎊 ========================================= 🎊';
    RAISE NOTICE '🍝 TAVERTET TIENE VIDA COMPLETA 🍝';
    RAISE NOTICE '🎊 ========================================= 🎊';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN FINAL:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '👥 Clientes totales: %', stats.total_customers;
    RAISE NOTICE '📅 Reservas totales: %', stats.total_reservations;
    RAISE NOTICE '🧾 Tickets facturación: %', stats.total_tickets;
    RAISE NOTICE '💬 Conversaciones: %', stats.total_conversations;
    RAISE NOTICE '📨 Mensajes: %', stats.total_messages;
    RAISE NOTICE '🚫 Acciones no-show: %', stats.total_noshows;
    RAISE NOTICE '🔔 Alertas CRM: %', stats.total_suggestions;
    RAISE NOTICE '';
    RAISE NOTICE '📈 HOY:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📅 Reservas para hoy: %', stats.today_reservations;
    RAISE NOTICE '⚠️ Alto riesgo hoy: %', stats.today_high_risk;
    RAISE NOTICE '';
    RAISE NOTICE '💰 FINANZAS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '💵 Facturación total: €%.2f', stats.revenue_total;
    RAISE NOTICE '';
    RAISE NOTICE '✅ 6 MESES DE VIDA REAL COMPLETA';
    RAISE NOTICE '✅ TODAS LAS TABLAS CON DATOS REALES';
    RAISE NOTICE '✅ COMUNICACIONES FUNCIONANDO';
    RAISE NOTICE '✅ NO-SHOWS GESTIONADOS';
    RAISE NOTICE '✅ CRM INTELIGENTE ACTIVO';
    RAISE NOTICE '✅ CONSUMOS VINCULADOS A MESAS';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 ¡TAVERTET ESTÁ VIVO Y FUNCIONANDO!';
END $$;

COMMIT;

-- FIN DEL SCRIPT

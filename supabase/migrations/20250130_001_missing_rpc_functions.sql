-- ====================================
-- FUNCIONES RPC FALTANTES PARA LA-IA APP
-- Fecha: 30 Enero 2025
-- ====================================

-- 1. Función para obtener reservas de manera segura (evita error PGRST201)
-- Primero eliminar la función existente si tiene un tipo de retorno diferente
DROP FUNCTION IF EXISTS get_reservations_safe(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_reservations_safe(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    restaurant_id UUID,
    customer_id UUID,
    customer_name VARCHAR,
    customer_email VARCHAR,
    customer_phone VARCHAR,
    reservation_date DATE,
    reservation_time TIME,
    party_size INTEGER,
    status VARCHAR,
    table_number VARCHAR,
    table_id UUID,
    special_requests TEXT,
    source VARCHAR,
    channel VARCHAR,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.restaurant_id,
        r.customer_id,
        r.customer_name,
        r.customer_email,
        r.customer_phone,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.status,
        r.table_number,
        r.table_id,
        r.special_requests,
        r.source,
        r.channel,
        r.notes,
        r.created_at,
        r.updated_at
    FROM reservations r
    WHERE r.restaurant_id = p_restaurant_id
    AND r.reservation_date >= p_start_date
    AND r.reservation_date <= p_end_date
    ORDER BY r.reservation_date ASC, r.reservation_time ASC;
END;
$$;

-- 2. Función para crear restaurant de manera segura
DROP FUNCTION IF EXISTS create_restaurant_securely(JSONB, JSONB);

CREATE OR REPLACE FUNCTION create_restaurant_securely(
    restaurant_data JSONB,
    user_profile JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_restaurant_id UUID;
    restaurant_name TEXT;
    result JSONB;
BEGIN
    -- Validar que el usuario existe
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuario no autenticado'
        );
    END IF;

    -- Extraer nombre del restaurante
    restaurant_name := restaurant_data->>'name';
    IF restaurant_name IS NULL OR trim(restaurant_name) = '' THEN
        restaurant_name := 'Mi Restaurante';
    END IF;

    -- Crear el restaurante
    INSERT INTO restaurants (
        name,
        email,
        phone,
        address,
        city,
        country,
        postal_code,
        cuisine_type,
        plan,
        active,
        owner_id,
        settings,
        created_at,
        updated_at
    ) VALUES (
        restaurant_name,
        restaurant_data->>'email',
        restaurant_data->>'phone',
        restaurant_data->>'address',
        restaurant_data->>'city',
        COALESCE(restaurant_data->>'country', 'España'),
        restaurant_data->>'postal_code',
        restaurant_data->>'cuisine_type',
        COALESCE(restaurant_data->>'plan', 'trial'),
        COALESCE((restaurant_data->>'active')::boolean, true),
        auth.uid(),
        jsonb_build_object(
            'website', '',
            'description', '',
            'channels', jsonb_build_object(
                'whatsapp', jsonb_build_object('enabled', false),
                'vapi', jsonb_build_object('enabled', false),
                'email', jsonb_build_object('enabled', false),
                'facebook', jsonb_build_object('enabled', false),
                'instagram', jsonb_build_object('enabled', false),
                'web_chat', jsonb_build_object('enabled', true)
            ),
            'operating_hours', jsonb_build_object(
                'monday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
                'tuesday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
                'wednesday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
                'thursday', jsonb_build_object('open', '09:00', 'close', '22:00', 'closed', false),
                'friday', jsonb_build_object('open', '09:00', 'close', '23:00', 'closed', false),
                'saturday', jsonb_build_object('open', '09:00', 'close', '23:00', 'closed', false),
                'sunday', jsonb_build_object('open', '10:00', 'close', '22:00', 'closed', false)
            )
        ),
        NOW(),
        NOW()
    ) RETURNING id INTO new_restaurant_id;

    -- Crear mapping usuario-restaurante
    INSERT INTO user_restaurant_mapping (
        auth_user_id,
        restaurant_id,
        role,
        permissions,
        active,
        created_at,
        updated_at
    ) VALUES (
        auth.uid(),
        new_restaurant_id,
        'owner',
        jsonb_build_object(
            'all_access', true,
            'manage_staff', true,
            'manage_settings', true,
            'view_analytics', true
        ),
        true,
        NOW(),
        NOW()
    );

    -- Crear perfil de usuario si no existe
    INSERT INTO profiles (
        auth_user_id,
        email,
        full_name,
        restaurant_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        auth.uid(),
        user_profile->>'email',
        user_profile->>'full_name',
        restaurant_name,
        'owner',
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_user_id) 
    DO UPDATE SET 
        restaurant_name = restaurant_name,
        updated_at = NOW();

    -- Crear mesas de ejemplo
    INSERT INTO tables (
        restaurant_id,
        table_number,
        name,
        zone,
        capacity,
        status,
        is_active,
        created_at,
        updated_at
    ) VALUES 
    (new_restaurant_id, '1', 'Mesa 1', 'Salón principal', 4, 'available', true, NOW(), NOW()),
    (new_restaurant_id, '2', 'Mesa 2', 'Salón principal', 2, 'available', true, NOW(), NOW()),
    (new_restaurant_id, '3', 'Mesa 3', 'Terraza', 6, 'available', true, NOW(), NOW());

    -- Retornar resultado
    result := jsonb_build_object(
        'success', true,
        'restaurant_id', new_restaurant_id,
        'restaurant_name', restaurant_name,
        'message', 'Restaurante creado exitosamente'
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- 3. Función para obtener estadísticas del dashboard
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    total_reservations INTEGER;
    agent_reservations INTEGER;
    total_customers INTEGER;
    total_tables INTEGER;
    active_tables INTEGER;
BEGIN
    -- Contar reservas
    SELECT COUNT(*) INTO total_reservations
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= p_start_date
    AND reservation_date <= p_end_date;

    -- Contar reservas del agente
    SELECT COUNT(*) INTO agent_reservations
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= p_start_date
    AND reservation_date <= p_end_date
    AND source = 'agent';

    -- Contar clientes
    SELECT COUNT(*) INTO total_customers
    FROM customers
    WHERE restaurant_id = p_restaurant_id;

    -- Contar mesas
    SELECT COUNT(*) INTO total_tables
    FROM tables
    WHERE restaurant_id = p_restaurant_id;

    SELECT COUNT(*) INTO active_tables
    FROM tables
    WHERE restaurant_id = p_restaurant_id
    AND is_active = true;

    -- Construir resultado
    result := jsonb_build_object(
        'total_reservations', total_reservations,
        'agent_reservations', agent_reservations,
        'manual_reservations', total_reservations - agent_reservations,
        'total_customers', total_customers,
        'total_tables', total_tables,
        'active_tables', active_tables,
        'period_start', p_start_date,
        'period_end', p_end_date,
        'generated_at', NOW()
    );

    RETURN result;
END;
$$;

-- 4. Función para optimizar asignación de mesas
DROP FUNCTION IF EXISTS optimize_table_assignment(UUID, INTEGER, TIME, DATE);

CREATE OR REPLACE FUNCTION optimize_table_assignment(
    p_restaurant_id UUID,
    p_party_size INTEGER,
    p_reservation_time TIME,
    p_reservation_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recommended_table RECORD;
    result JSONB;
BEGIN
    -- Buscar mesa óptima disponible
    SELECT t.id, t.name, t.table_number, t.capacity, t.zone
    INTO recommended_table
    FROM tables t
    WHERE t.restaurant_id = p_restaurant_id
    AND t.is_active = true
    AND t.status = 'available'
    AND t.capacity >= p_party_size
    AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.table_id = t.id
        AND r.reservation_date = p_reservation_date
        AND r.status IN ('confirmada', 'sentada')
        AND ABS(EXTRACT(EPOCH FROM (r.reservation_time::time - p_reservation_time::time))/3600) < 2
    )
    ORDER BY 
        ABS(t.capacity - p_party_size) ASC, -- Preferir mesas de tamaño similar
        t.zone ASC,
        t.table_number ASC
    LIMIT 1;

    IF recommended_table.id IS NOT NULL THEN
        result := jsonb_build_object(
            'success', true,
            'table_id', recommended_table.id,
            'table_name', recommended_table.name,
            'table_number', recommended_table.table_number,
            'zone', recommended_table.zone,
            'capacity', recommended_table.capacity,
            'reason', 'Mesa óptima encontrada'
        );
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', 'No hay mesas disponibles para el horario solicitado',
            'suggestions', jsonb_build_array(
                'Verificar disponibilidad en horarios cercanos',
                'Considerar mesas de mayor capacidad'
            )
        );
    END IF;

    RETURN result;
END;
$$;

-- 5. Función para actualizar estadísticas de clientes desde tickets
-- Primero eliminar el trigger existente si existe
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON billing_tickets;
DROP TRIGGER IF EXISTS update_customer_stats_from_ticket ON billing_tickets;

-- Luego eliminar la función
DROP FUNCTION IF EXISTS update_customer_stats_from_ticket() CASCADE;

CREATE OR REPLACE FUNCTION update_customer_stats_from_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Solo procesar si hay customer_id
    IF NEW.customer_id IS NOT NULL THEN
        UPDATE customers
        SET 
            total_spent = COALESCE((
                SELECT SUM(total_amount)
                FROM billing_tickets
                WHERE customer_id = NEW.customer_id
            ), 0),
            visits_count = COALESCE((
                SELECT COUNT(DISTINCT DATE(ticket_date))
                FROM billing_tickets
                WHERE customer_id = NEW.customer_id
            ), 0),
            last_visit_at = (
                SELECT MAX(DATE(ticket_date))
                FROM billing_tickets
                WHERE customer_id = NEW.customer_id
            ),
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Crear trigger para actualización automática
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON billing_tickets;
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON billing_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats_from_ticket();

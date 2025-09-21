-- =========================================
-- OBTENER TODA LA INFO EN UNA SOLA CONSULTA
-- =========================================
-- Este script devuelve TODA la información en un solo resultado

WITH usuario_info AS (
    SELECT id, auth_user_id, email 
    FROM profiles 
    WHERE email = 'gustausantin@gmail.com'
    LIMIT 1
),
restaurante_info AS (
    SELECT r.*
    FROM restaurants r
    WHERE r.id IN (
        SELECT restaurant_id 
        FROM user_restaurant_mapping 
        WHERE auth_user_id IN (SELECT auth_user_id FROM usuario_info)
    )
    OR r.owner_id IN (SELECT id FROM usuario_info)
    LIMIT 1
),
conteo_datos AS (
    SELECT 
        (SELECT COUNT(*) FROM tables WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as mesas,
        (SELECT COUNT(*) FROM customers WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as clientes,
        (SELECT COUNT(*) FROM reservations WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as reservas,
        (SELECT COUNT(*) FROM billing_tickets WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as tickets,
        (SELECT COUNT(*) FROM conversations WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as conversaciones,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as mensajes,
        (SELECT COUNT(*) FROM noshow_actions WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as noshows,
        (SELECT COUNT(*) FROM crm_suggestions WHERE restaurant_id IN (SELECT id FROM restaurante_info)) as alertas_crm
)
SELECT 
    jsonb_build_object(
        'usuario', jsonb_build_object(
            'email', u.email,
            'id', u.id,
            'auth_id', u.auth_user_id
        ),
        'restaurante', CASE 
            WHEN r.id IS NOT NULL THEN jsonb_build_object(
                'id', r.id,
                'nombre', r.name,
                'email', r.email,
                'telefono', r.phone,
                'direccion', r.address,
                'ciudad', r.city,
                'tipo_cocina', r.cuisine_type,
                'activo', r.active,
                'plan', r.plan,
                'horarios', r.business_hours
            )
            ELSE jsonb_build_object('error', 'NO HAY RESTAURANTE ASOCIADO')
        END,
        'datos_existentes', jsonb_build_object(
            'mesas', c.mesas,
            'clientes', c.clientes,
            'reservas', c.reservas,
            'tickets', c.tickets,
            'conversaciones', c.conversaciones,
            'mensajes', c.mensajes,
            'noshows', c.noshows,
            'alertas_crm', c.alertas_crm
        ),
        'reservas_hoy', (
            SELECT COUNT(*) 
            FROM reservations 
            WHERE restaurant_id IN (SELECT id FROM restaurante_info)
            AND reservation_date = CURRENT_DATE
        ),
        'mesas_detalle', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'numero', table_number,
                    'capacidad', capacity,
                    'zona', zone,
                    'ubicacion', location
                ) ORDER BY table_number
            )
            FROM tables 
            WHERE restaurant_id IN (SELECT id FROM restaurante_info)
        )
    ) as informacion_completa
FROM usuario_info u
CROSS JOIN restaurante_info r
CROSS JOIN conteo_datos c;

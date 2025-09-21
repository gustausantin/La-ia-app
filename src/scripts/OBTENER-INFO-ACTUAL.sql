-- =========================================
-- SCRIPT PARA OBTENER TODA LA INFORMACIÓN ACTUAL
-- =========================================
-- Ejecuta este script y pásame TODOS los resultados

-- ==========================================
-- 1. INFORMACIÓN DEL USUARIO
-- ==========================================
SELECT '===== USUARIO ACTUAL =====' as info;
SELECT id, auth_user_id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'gustausantin@gmail.com';

-- ==========================================
-- 2. RESTAURANTES DEL USUARIO
-- ==========================================
SELECT '===== RESTAURANTES DEL USUARIO =====' as info;
SELECT 
    r.id,
    r.name,
    r.email,
    r.phone,
    r.address,
    r.city,
    r.cuisine_type,
    r.active,
    r.plan,
    r.business_hours
FROM restaurants r
WHERE r.id IN (
    SELECT restaurant_id 
    FROM user_restaurant_mapping 
    WHERE auth_user_id IN (
        SELECT auth_user_id 
        FROM profiles 
        WHERE email = 'gustausantin@gmail.com'
    )
)
OR r.owner_id IN (
    SELECT id 
    FROM profiles 
    WHERE email = 'gustausantin@gmail.com'
);

-- ==========================================
-- 3. MESAS EXISTENTES
-- ==========================================
SELECT '===== MESAS EXISTENTES =====' as info;
SELECT 
    t.restaurant_id,
    r.name as restaurant_name,
    COUNT(t.id) as total_mesas,
    STRING_AGG(t.table_number || ' (Cap:' || t.capacity || ')', ', ' ORDER BY t.table_number) as detalle_mesas
FROM tables t
JOIN restaurants r ON t.restaurant_id = r.id
GROUP BY t.restaurant_id, r.name;

-- ==========================================
-- 4. RESUMEN DE DATOS EXISTENTES
-- ==========================================
SELECT '===== RESUMEN DE DATOS ACTUALES =====' as info;
SELECT 
    'Total Restaurantes' as tabla,
    COUNT(*) as cantidad
FROM restaurants
UNION ALL
SELECT 
    'Total Mesas' as tabla,
    COUNT(*) as cantidad
FROM tables
UNION ALL
SELECT 
    'Total Clientes' as tabla,
    COUNT(*) as cantidad
FROM customers
UNION ALL
SELECT 
    'Total Reservas' as tabla,
    COUNT(*) as cantidad
FROM reservations
UNION ALL
SELECT 
    'Total Tickets' as tabla,
    COUNT(*) as cantidad
FROM billing_tickets
UNION ALL
SELECT 
    'Total Conversaciones' as tabla,
    COUNT(*) as cantidad
FROM conversations
UNION ALL
SELECT 
    'Total Mensajes' as tabla,
    COUNT(*) as cantidad
FROM messages
UNION ALL
SELECT 
    'Total No-Shows' as tabla,
    COUNT(*) as cantidad
FROM noshow_actions
UNION ALL
SELECT 
    'Total Alertas CRM' as tabla,
    COUNT(*) as cantidad
FROM crm_suggestions
UNION ALL
SELECT 
    'Total Plantillas' as tabla,
    COUNT(*) as cantidad
FROM message_templates;

-- ==========================================
-- 5. DATOS POR RESTAURANTE (SI HAY ALGUNO)
-- ==========================================
SELECT '===== DATOS POR RESTAURANTE =====' as info;
SELECT 
    r.name as restaurante,
    (SELECT COUNT(*) FROM customers c WHERE c.restaurant_id = r.id) as clientes,
    (SELECT COUNT(*) FROM reservations res WHERE res.restaurant_id = r.id) as reservas,
    (SELECT COUNT(*) FROM billing_tickets bt WHERE bt.restaurant_id = r.id) as tickets,
    (SELECT COUNT(*) FROM tables t WHERE t.restaurant_id = r.id) as mesas,
    (SELECT COUNT(*) FROM conversations conv WHERE conv.restaurant_id = r.id) as conversaciones,
    (SELECT COUNT(*) FROM noshow_actions na WHERE na.restaurant_id = r.id) as noshows,
    (SELECT COUNT(*) FROM crm_suggestions cs WHERE cs.restaurant_id = r.id) as alertas_crm
FROM restaurants r
WHERE r.id IN (
    SELECT restaurant_id 
    FROM user_restaurant_mapping 
    WHERE auth_user_id IN (
        SELECT auth_user_id 
        FROM profiles 
        WHERE email = 'gustausantin@gmail.com'
    )
)
OR r.owner_id IN (
    SELECT id 
    FROM profiles 
    WHERE email = 'gustausantin@gmail.com'
)
OR r.name = 'Restaurante Demo';

-- ==========================================
-- 6. RESERVAS DE HOY (SI HAY)
-- ==========================================
SELECT '===== RESERVAS DE HOY =====' as info;
SELECT 
    r.name as restaurante,
    COUNT(res.id) as total_reservas_hoy,
    STRING_AGG(
        res.customer_name || ' (' || res.party_size || 'p a las ' || 
        TO_CHAR(res.reservation_time, 'HH24:MI') || ')', 
        ', ' 
        ORDER BY res.reservation_time
    ) as detalle
FROM reservations res
JOIN restaurants r ON res.restaurant_id = r.id
WHERE res.reservation_date = CURRENT_DATE
GROUP BY r.id, r.name;

-- ==========================================
-- 7. CONFIGURACIÓN DE HORARIOS
-- ==========================================
SELECT '===== HORARIOS CONFIGURADOS =====' as info;
SELECT 
    r.name as restaurante,
    r.business_hours->>'monday' as lunes,
    r.business_hours->>'tuesday' as martes,
    r.business_hours->>'wednesday' as miercoles,
    r.business_hours->>'thursday' as jueves,
    r.business_hours->>'friday' as viernes,
    r.business_hours->>'saturday' as sabado,
    r.business_hours->>'sunday' as domingo
FROM restaurants r
WHERE r.id IN (
    SELECT restaurant_id 
    FROM user_restaurant_mapping 
    WHERE auth_user_id IN (
        SELECT auth_user_id 
        FROM profiles 
        WHERE email = 'gustausantin@gmail.com'
    )
)
OR r.owner_id IN (
    SELECT id 
    FROM profiles 
    WHERE email = 'gustausantin@gmail.com'
)
OR r.name = 'Restaurante Demo';

-- ==========================================
-- FIN - PÁSAME TODO LO QUE SALGA
-- ==========================================
SELECT '===== FIN DEL REPORTE =====' as info;
SELECT 'COPIA TODO LO DE ARRIBA Y PÉGALO EN EL CHAT' as instruccion;

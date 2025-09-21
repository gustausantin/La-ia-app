-- =====================================================
-- AUDITORÍA COMPLETA - BASE DE DATOS + APLICACIÓN
-- =====================================================
-- Este script verifica TODOS los datos que usa la aplicación

WITH restaurant_data AS (
    SELECT id FROM restaurants WHERE name = 'Tavertet' LIMIT 1
),

-- 1. DASHBOARD - Verificar todos los widgets
dashboard_data AS (
    SELECT 
        -- Widget No-Shows
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND reservation_date = CURRENT_DATE) as noshows_hoy_total,
        
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND reservation_date = CURRENT_DATE 
         AND risk_level = 'high') as noshows_alto_riesgo_hoy,
        
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND reservation_date = CURRENT_DATE 
         AND risk_level = 'medium') as noshows_medio_riesgo_hoy,
        
        (SELECT COUNT(*) FROM noshow_actions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'
         AND (customer_response = 'confirmed' OR prevented_noshow = true)) as noshows_prevenidos_semana,
        
        -- Widget CRM
        (SELECT COUNT(*) FROM crm_suggestions 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND status = 'pending') as crm_alertas_pendientes,
        
        -- Widget Clientes
        (SELECT COUNT(*) FROM customers 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND last_visit_at >= CURRENT_DATE - INTERVAL '7 days') as clientes_esta_semana,
        
        -- Widget Reservas
        (SELECT COUNT(*) FROM reservations 
         WHERE restaurant_id = (SELECT id FROM restaurant_data) 
         AND reservation_date = CURRENT_DATE) as reservas_hoy
),

-- 2. PÁGINA NO-SHOWS - Verificar datos mostrados
noshows_page AS (
    SELECT 
        COUNT(*) as total_acciones,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE THEN 1 END) as acciones_hoy,
        COUNT(CASE WHEN reservation_date = CURRENT_DATE + 1 THEN 1 END) as acciones_manana,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as total_alto_riesgo,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as total_medio_riesgo,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as total_bajo_riesgo
    FROM noshow_actions
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),

-- 3. PÁGINA COMUNICACIÓN - Verificar conversaciones
comunicacion_page AS (
    SELECT 
        COUNT(*) as total_conversaciones,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as conversaciones_abiertas,
        COUNT(CASE WHEN channel = 'whatsapp' THEN 1 END) as conv_whatsapp,
        COUNT(CASE WHEN channel = 'email' THEN 1 END) as conv_email,
        (SELECT COUNT(*) FROM messages WHERE restaurant_id = (SELECT id FROM restaurant_data)) as total_mensajes
    FROM conversations
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),

-- 4. PÁGINA RESERVAS - Verificar insights
reservas_page AS (
    SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN reservation_source = 'ia' THEN 1 END) as reservas_ia,
        COUNT(CASE WHEN reservation_source = 'manual' THEN 1 END) as reservas_manual,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
        ROUND(AVG(party_size), 1) as tamano_promedio
    FROM reservations
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
),

-- 5. PÁGINA CRM - Verificar sugerencias
crm_page AS (
    SELECT 
        COUNT(*) as total_sugerencias,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
        COUNT(CASE WHEN type = 'reactivacion' THEN 1 END) as reactivacion,
        COUNT(CASE WHEN type = 'vip_upgrade' THEN 1 END) as vip_upgrade,
        COUNT(CASE WHEN type = 'bienvenida' THEN 1 END) as bienvenida,
        COUNT(CASE WHEN type = 'feedback' THEN 1 END) as feedback
    FROM crm_suggestions
    WHERE restaurant_id = (SELECT id FROM restaurant_data)
)

-- RESULTADO FINAL
SELECT 
    '=== AUDITORÍA APLICACIÓN COMPLETA ===' as titulo,
    
    jsonb_build_object(
        '1_DASHBOARD', jsonb_build_object(
            'noshows_hoy_total', d.noshows_hoy_total,
            'noshows_alto_riesgo_hoy', d.noshows_alto_riesgo_hoy,
            'noshows_medio_riesgo_hoy', d.noshows_medio_riesgo_hoy,
            'noshows_prevenidos_semana', d.noshows_prevenidos_semana,
            'crm_alertas_pendientes', d.crm_alertas_pendientes,
            'clientes_esta_semana', d.clientes_esta_semana,
            'reservas_hoy', d.reservas_hoy,
            '⚠️_PROBLEMA_1', CASE 
                WHEN d.noshows_alto_riesgo_hoy = 0 AND d.noshows_hoy_total > 0 
                THEN 'Dashboard muestra 0 alto riesgo pero hay ' || d.noshows_hoy_total || ' no-shows'
                ELSE 'OK'
            END,
            '⚠️_PROBLEMA_2', CASE 
                WHEN d.crm_alertas_pendientes = 0 
                THEN 'No se muestran alertas CRM'
                ELSE 'OK - ' || d.crm_alertas_pendientes || ' alertas'
            END
        ),
        
        '2_PAGINA_NOSHOWS', jsonb_build_object(
            'total_acciones', n.total_acciones,
            'acciones_hoy', n.acciones_hoy,
            'acciones_manana', n.acciones_manana,
            'alto_riesgo', n.total_alto_riesgo,
            'medio_riesgo', n.total_medio_riesgo,
            'bajo_riesgo', n.total_bajo_riesgo,
            '⚠️_COHERENCIA', CASE 
                WHEN n.acciones_hoy != d.noshows_hoy_total
                THEN 'INCOHERENTE: Dashboard=' || d.noshows_hoy_total || ' vs Página=' || n.acciones_hoy
                ELSE 'OK - Coherente'
            END
        ),
        
        '3_PAGINA_COMUNICACION', jsonb_build_object(
            'total_conversaciones', c.total_conversaciones,
            'abiertas', c.conversaciones_abiertas,
            'whatsapp', c.conv_whatsapp,
            'email', c.conv_email,
            'total_mensajes', c.total_mensajes,
            '⚠️_ESTADO', CASE 
                WHEN c.total_conversaciones = 0 
                THEN 'Sin conversaciones - ¿Error cargando?'
                ELSE 'OK - ' || c.total_conversaciones || ' conversaciones'
            END
        ),
        
        '4_PAGINA_RESERVAS', jsonb_build_object(
            'total_reservas', r.total_reservas,
            'reservas_ia', r.reservas_ia,
            'reservas_manual', r.reservas_manual,
            'confirmadas', r.confirmadas,
            'canceladas', r.canceladas,
            'tamano_promedio', r.tamano_promedio,
            '⚠️_INSIGHTS_IA', CASE 
                WHEN r.reservas_ia = 0 
                THEN 'Sin datos IA - Insights vacíos'
                ELSE 'OK - ' || r.reservas_ia || ' reservas IA'
            END
        ),
        
        '5_PAGINA_CRM', jsonb_build_object(
            'total_sugerencias', cr.total_sugerencias,
            'pendientes', cr.pendientes,
            'reactivacion', cr.reactivacion,
            'vip_upgrade', cr.vip_upgrade,
            'bienvenida', cr.bienvenida,
            'feedback', cr.feedback,
            '⚠️_COHERENCIA', CASE 
                WHEN cr.pendientes != d.crm_alertas_pendientes
                THEN 'INCOHERENTE: Dashboard=' || d.crm_alertas_pendientes || ' vs CRM=' || cr.pendientes
                ELSE 'OK - Coherente'
            END
        ),
        
        '6_RESUMEN_PROBLEMAS', jsonb_build_object(
            'total_problemas_detectados', 
                CASE WHEN d.noshows_alto_riesgo_hoy = 0 AND d.noshows_hoy_total > 0 THEN 1 ELSE 0 END +
                CASE WHEN d.crm_alertas_pendientes = 0 THEN 1 ELSE 0 END +
                CASE WHEN n.acciones_hoy != d.noshows_hoy_total THEN 1 ELSE 0 END +
                CASE WHEN c.total_conversaciones = 0 THEN 1 ELSE 0 END +
                CASE WHEN r.reservas_ia = 0 THEN 1 ELSE 0 END +
                CASE WHEN cr.pendientes != d.crm_alertas_pendientes THEN 1 ELSE 0 END,
            'estado_general', CASE 
                WHEN (d.noshows_alto_riesgo_hoy = 0 AND d.noshows_hoy_total > 0) OR
                     (n.acciones_hoy != d.noshows_hoy_total) OR
                     (cr.pendientes != d.crm_alertas_pendientes)
                THEN '❌ INCOHERENCIAS DETECTADAS'
                ELSE '✅ TODO COHERENTE'
            END
        )
    ) as auditoria_completa
FROM dashboard_data d
CROSS JOIN noshows_page n
CROSS JOIN comunicacion_page c
CROSS JOIN reservas_page r
CROSS JOIN crm_page cr;

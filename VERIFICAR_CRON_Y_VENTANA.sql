-- =====================================================
-- VERIFICACIÓN: ¿Está funcionando el cron diario?
-- =====================================================

-- 1. Ver si el cron job está ACTIVO
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active,
    database
FROM cron.job 
WHERE jobname = 'daily-availability-maintenance';

-- Resultado esperado: active = true

-- =====================================================
-- 2. Ver historial de ejecuciones (últimas 10)
-- =====================================================
SELECT 
    jobid,
    runid,
    start_time AT TIME ZONE 'Europe/Madrid' as hora_españa,
    status,
    return_message,
    end_time - start_time as duracion
FROM cron.job_run_details 
WHERE jobid = (
    SELECT jobid FROM cron.job 
    WHERE jobname = 'daily-availability-maintenance'
)
ORDER BY start_time DESC 
LIMIT 10;

-- =====================================================
-- 3. Verificar ventana de días para Casa Paco
-- =====================================================
SELECT 
    r.name as restaurante,
    COALESCE((r.settings->'booking_settings'->>'advance_booking_days')::INTEGER, 30) as dias_configurados,
    COUNT(DISTINCT a.slot_date) as dias_generados,
    MIN(a.slot_date) as primer_dia,
    MAX(a.slot_date) as ultimo_dia,
    MAX(a.slot_date) - CURRENT_DATE as dias_adelante_actual
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
WHERE r.id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
GROUP BY r.id, r.name, r.settings;

-- Resultado esperado:
-- dias_configurados: 30
-- dias_generados: ~27 (porque se borran los pasados)
-- dias_adelante_actual: 30 (debe coincidir con dias_configurados)

-- =====================================================
-- 4. Ver slots de hoy y de ayer (para ver si se borró ayer)
-- =====================================================
SELECT 
    slot_date,
    COUNT(*) as total_slots,
    COUNT(*) FILTER (WHERE status = 'free') as libres,
    COUNT(*) FILTER (WHERE status != 'free') as ocupados
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date >= CURRENT_DATE - INTERVAL '2 days'
  AND slot_date <= CURRENT_DATE + INTERVAL '2 days'
GROUP BY slot_date
ORDER BY slot_date;

-- Resultado esperado: No debe haber slots de ayer (CURRENT_DATE - 1)


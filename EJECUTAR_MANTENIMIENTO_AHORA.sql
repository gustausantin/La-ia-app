-- =====================================================
-- EJECUTAR MANTENIMIENTO MANUAL (arreglar ahora)
-- =====================================================

-- 1. Ejecutar mantenimiento
SELECT daily_availability_maintenance();

-- 2. Verificar que se borraron slots LIBRES de días pasados
SELECT 
    slot_date,
    COUNT(*) as total_slots,
    COUNT(*) FILTER (WHERE status = 'free') as libres,
    COUNT(*) FILTER (WHERE status != 'free') as ocupados
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND slot_date < CURRENT_DATE
GROUP BY slot_date
ORDER BY slot_date;

-- Resultado esperado: 
-- Solo deben quedar slots con RESERVAS (ocupados > 0, libres = 0)
-- Los días 09, 10, 11 de octubre deben aparecer solo si tienen reservas

-- 3. Verificar ventana de 30 días
SELECT 
    COUNT(DISTINCT slot_date) as dias_generados,
    MIN(slot_date) as primer_dia,
    MAX(slot_date) as ultimo_dia,
    MAX(slot_date) - CURRENT_DATE as dias_adelante
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- Resultado esperado: dias_adelante = 30


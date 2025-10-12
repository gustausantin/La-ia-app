-- =====================================================
-- GENERAR 3 DÍAS FALTANTES (del 09/11 al 11/11)
-- =====================================================

-- Ejecutar generación manual para completar hasta 30 días
SELECT generate_availability_slots_simple(
    'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'::UUID,
    '2025-11-09'::DATE,
    '2025-11-11'::DATE
);

-- Verificar resultado
SELECT 
    COUNT(DISTINCT slot_date) as dias_generados,
    MIN(slot_date) as primer_dia,
    MAX(slot_date) as ultimo_dia,
    MAX(slot_date) - CURRENT_DATE as dias_adelante
FROM availability_slots
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- Resultado esperado: dias_adelante = 30


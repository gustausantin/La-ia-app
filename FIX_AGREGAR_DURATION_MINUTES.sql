-- =====================================================
-- FIX URGENTE: Agregar columna duration_minutes
-- =====================================================
-- La tabla availability_slots necesita esta columna
-- =====================================================

-- 1. AGREGAR LA COLUMNA QUE FALTA
ALTER TABLE availability_slots 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90;

-- 2. AGREGAR COMENTARIO DESCRIPTIVO
COMMENT ON COLUMN availability_slots.duration_minutes IS 
'Duración en minutos de este slot de disponibilidad';

-- 3. ACTUALIZAR SLOTS EXISTENTES (si los hay)
UPDATE availability_slots 
SET duration_minutes = 90 
WHERE duration_minutes IS NULL;

-- 4. VERIFICAR QUE SE AGREGÓ
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'availability_slots'
AND column_name = 'duration_minutes';

-- 5. AHORA SÍ, GENERAR SLOTS PARA CASA LOLITA
-- Esto debería funcionar después de agregar la columna
SELECT generate_availability_slots(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::uuid,
    CURRENT_DATE,
    CURRENT_DATE + 30  -- 30 días hacia adelante
);

-- 6. VERIFICAR QUE SE CREARON
SELECT 
    COUNT(*) as slots_creados,
    MIN(slot_date) as desde,
    MAX(slot_date) as hasta
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f';

-- 7. VER ALGUNOS EJEMPLOS
SELECT 
    slot_date,
    start_time,
    end_time,
    duration_minutes,
    CASE 
        WHEN status = 'available' THEN '✅ Disponible'
        WHEN is_available = true THEN '✅ Disponible'
        ELSE '❌ No disponible'
    END as estado
FROM availability_slots
WHERE restaurant_id = '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'
AND slot_date = CURRENT_DATE + 1  -- Mañana
LIMIT 10;

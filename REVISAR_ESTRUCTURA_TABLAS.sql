-- ========================================
-- REVISAR ESTRUCTURA DE TABLAS
-- ========================================

-- 1️⃣ ESTRUCTURA DE restaurants
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurants'
ORDER BY ordinal_position;

-- 2️⃣ ESTRUCTURA DE availability_slots
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'availability_slots'
ORDER BY ordinal_position;

-- 3️⃣ ESTRUCTURA DE reservations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
ORDER BY ordinal_position;

-- 4️⃣ ESTRUCTURA DE special_events
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'special_events'
ORDER BY ordinal_position;

-- 5️⃣ ESTRUCTURA DE calendar_exceptions
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'calendar_exceptions'
ORDER BY ordinal_position;

-- 6️⃣ VER DATOS DE restaurants
SELECT 
    id,
    name,
    settings
FROM restaurants
LIMIT 5;


-- 🔍 VERIFICACIÓN SIMPLE Y DIRECTA

-- ¿Hay reservas en la base de datos?
SELECT 'TOTAL RESERVAS EN BD:' as info, COUNT(*) as cantidad FROM reservations;

-- Si hay, ¿cuáles son?
SELECT 
    customer_name,
    date,
    time,
    party_size,
    restaurant_id,
    created_at
FROM reservations 
ORDER BY created_at DESC;

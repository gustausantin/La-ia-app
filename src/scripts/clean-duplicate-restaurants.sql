-- 🧹 LIMPIAR RESTAURANTS DUPLICADOS
-- Mantener solo el primer restaurant creado para cada usuario

-- Ver los duplicados antes de limpiar
SELECT 'RESTAURANTS DUPLICADOS DETECTADOS:' as info;
SELECT 
    email,
    COUNT(*) as cantidad_restaurants,
    MIN(created_at) as primer_restaurant,
    MAX(created_at) as ultimo_restaurant
FROM restaurants 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Mostrar todos los restaurants del usuario
SELECT 
    id,
    name,
    email,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as orden
FROM restaurants 
WHERE email = 'gustausantin@gmail.com'
ORDER BY created_at;

-- ELIMINAR restaurants duplicados (mantener solo el primero)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
    FROM restaurants 
    WHERE email = 'gustausantin@gmail.com'
)
DELETE FROM user_restaurant_mapping 
WHERE restaurant_id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Eliminar los restaurants duplicados (mantener solo el primero)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
    FROM restaurants 
    WHERE email = 'gustausantin@gmail.com'
)
DELETE FROM restaurants 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Verificar limpieza
SELECT 'DESPUÉS DE LIMPIAR:' as info;
SELECT 
    email,
    COUNT(*) as cantidad_restaurants
FROM restaurants 
GROUP BY email;

-- Mostrar el restaurant que quedó
SELECT 
    'RESTAURANT FINAL:' as info,
    id,
    name,
    email,
    created_at
FROM restaurants 
WHERE email = 'gustausantin@gmail.com';

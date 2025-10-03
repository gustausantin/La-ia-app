-- VER QUÉ SE GUARDÓ EN EL NUEVO REGISTRO

SELECT 
    id, 
    name, 
    email, 
    phone, 
    address, 
    city, 
    postal_code, 
    cuisine_type,
    country,
    settings,
    created_at
FROM restaurants 
WHERE email = 'gustausantin@icloud.com'
ORDER BY created_at DESC
LIMIT 1;

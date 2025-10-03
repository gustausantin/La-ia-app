-- VERIFICAR QUÉ HAY EN SUPABASE

-- 1) Ver el usuario en auth.users
SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = 'gustausantin@icloud.com';

-- 2) Ver el restaurante
SELECT id, name, email, phone, address, city, postal_code, country, cuisine_type, settings, created_at FROM restaurants WHERE email = 'gustausantin@icloud.com';

-- 3) Ver la relación user-restaurant
SELECT * FROM user_restaurant_mapping WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'gustausantin@icloud.com');

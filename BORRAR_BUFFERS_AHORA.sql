-- 🗑️ BORRAR TODOS LOS BUFFERS AHORA
-- Ejecutar en Supabase SQL Editor ANTES de probar los workflows

-- 1️⃣ Ver qué hay actualmente
SELECT 
    buffer_key,
    customer_phone,
    customer_name,
    message_count,
    processing_since,
    created_at,
    last_message_at
FROM whatsapp_message_buffer
ORDER BY created_at DESC;

-- 2️⃣ ELIMINAR TODOS los buffers
DELETE FROM whatsapp_message_buffer;

-- 3️⃣ Verificar que está vacío
SELECT COUNT(*) as total_buffers FROM whatsapp_message_buffer;
-- Debe devolver: 0

-- ✅ RESULTADO ESPERADO: total_buffers = 0


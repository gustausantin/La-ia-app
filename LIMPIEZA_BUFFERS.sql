-- 🧹 SCRIPT DE LIMPIEZA PARA BUFFERS DE WHATSAPP
-- Ejecutar solo en DESARROLLO o si hay buffers atascados

-- 1️⃣ Ver buffers actuales
SELECT 
    buffer_key,
    customer_phone,
    customer_name,
    messages,
    message_count,
    processing_since,
    created_at,
    updated_at,
    CASE
        WHEN processing_since IS NULL THEN '⏳ Pendiente'
        WHEN processing_since < NOW() - INTERVAL '60 seconds' THEN '💀 Huérfano (>60s)'
        ELSE '🔒 Procesando'
    END as status
FROM whatsapp_message_buffer
ORDER BY created_at DESC;

-- 2️⃣ Eliminar buffers huérfanos (procesando >60s)
DELETE FROM whatsapp_message_buffer
WHERE processing_since IS NOT NULL 
  AND processing_since < NOW() - INTERVAL '60 seconds';

-- 3️⃣ Eliminar buffers viejos (>1 hora sin procesar)
DELETE FROM whatsapp_message_buffer
WHERE created_at < NOW() - INTERVAL '1 hour';

-- 4️⃣ Eliminar TODOS los buffers (SOLO DESARROLLO)
-- ⚠️ DESCOMENTAR CON CUIDADO
-- DELETE FROM whatsapp_message_buffer;

-- 5️⃣ Verificar que está vacío
SELECT COUNT(*) as total_buffers FROM whatsapp_message_buffer;

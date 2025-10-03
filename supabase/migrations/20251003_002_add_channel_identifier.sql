-- ====================================
-- AÑADIR IDENTIFICADOR DE CANAL
-- Extender tabla channel_credentials existente
-- Fecha: 03 Octubre 2025
-- ====================================

-- Añadir columna para el identificador del canal (teléfono, username, etc.)
ALTER TABLE channel_credentials 
ADD COLUMN IF NOT EXISTS channel_identifier VARCHAR;

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_channel_credentials_identifier 
ON channel_credentials(channel_identifier) 
WHERE is_active = true;

-- Crear índice compuesto para búsqueda por tipo + identificador
CREATE INDEX IF NOT EXISTS idx_channel_credentials_lookup 
ON channel_credentials(channel, channel_identifier, is_active)
WHERE is_active = true;

-- Comentario para documentación
COMMENT ON COLUMN channel_credentials.channel_identifier IS 'Identificador único del canal: número de teléfono para WhatsApp, email para Sendgrid, etc.';

-- ====================================
-- FUNCIÓN RPC PARA N8N
-- ====================================

-- Función para buscar restaurante por canal
CREATE OR REPLACE FUNCTION get_restaurant_by_channel_identifier(
    p_channel VARCHAR,
    p_channel_identifier VARCHAR
)
RETURNS TABLE (
    restaurant_id UUID,
    restaurant_name VARCHAR,
    channel_credentials_id UUID,
    is_active BOOLEAN,
    credentials JSONB,
    config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as restaurant_id,
        r.name as restaurant_name,
        cc.id as channel_credentials_id,
        cc.is_active,
        cc.credentials,
        cc.config
    FROM channel_credentials cc
    JOIN restaurants r ON cc.restaurant_id = r.id
    WHERE cc.channel = p_channel
      AND cc.channel_identifier = p_channel_identifier
      AND cc.is_active = true
    LIMIT 1;
END;
$$;

-- Grant para función RPC
GRANT EXECUTE ON FUNCTION get_restaurant_by_channel_identifier(VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION get_restaurant_by_channel_identifier(VARCHAR, VARCHAR) TO authenticated;

-- ====================================
-- CONFIRMACIÓN
-- ====================================

DO $$
BEGIN
    RAISE NOTICE '✅ Columna channel_identifier añadida a channel_credentials';
    RAISE NOTICE '📈 Índices creados: 2 (identifier, lookup)';
    RAISE NOTICE '🔧 Función RPC: get_restaurant_by_channel_identifier(channel, identifier)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMO PASO:';
    RAISE NOTICE 'Desde la app, cuando el usuario active un canal, guardar:';
    RAISE NOTICE 'UPDATE channel_credentials';
    RAISE NOTICE 'SET channel_identifier = ''+34911234567'', is_active = true';
    RAISE NOTICE 'WHERE restaurant_id = ''..'' AND channel = ''twilio_whatsapp'';';
END $$;


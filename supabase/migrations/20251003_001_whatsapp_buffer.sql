-- ====================================
-- TABLA BUFFER PARA WHATSAPP
-- Agregación de mensajes fragmentados
-- Fecha: 03 Octubre 2025
-- ====================================

-- ====================================
-- PASO 1: ELIMINAR TABLA EXISTENTE (si existe)
-- ====================================

DROP TABLE IF EXISTS whatsapp_message_buffer CASCADE;

-- ====================================
-- PASO 2: CREAR TABLA NUEVA
-- ====================================

CREATE TABLE whatsapp_message_buffer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Buffer key único (phone + ventana de tiempo)
    buffer_key VARCHAR NOT NULL UNIQUE,
    
    -- Datos del cliente
    customer_phone VARCHAR NOT NULL,
    customer_name VARCHAR NOT NULL,
    
    -- Mensajes agregados
    messages TEXT NOT NULL DEFAULT '',
    message_count INTEGER NOT NULL DEFAULT 1,
    
    -- Timestamps
    first_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- PASO 3: CREAR ÍNDICES
-- ====================================

CREATE INDEX idx_whatsapp_buffer_restaurant ON whatsapp_message_buffer(restaurant_id);
CREATE INDEX idx_whatsapp_buffer_phone ON whatsapp_message_buffer(customer_phone);
CREATE INDEX idx_whatsapp_buffer_key ON whatsapp_message_buffer(buffer_key);
CREATE INDEX idx_whatsapp_buffer_last_message ON whatsapp_message_buffer(last_message_at DESC);

-- ====================================
-- PASO 4: HABILITAR RLS
-- ====================================

ALTER TABLE whatsapp_message_buffer ENABLE ROW LEVEL SECURITY;

-- ====================================
-- PASO 5: CREAR POLÍTICAS RLS
-- ====================================

CREATE POLICY "whatsapp_buffer_select" ON whatsapp_message_buffer 
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "whatsapp_buffer_insert" ON whatsapp_message_buffer 
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "whatsapp_buffer_update" ON whatsapp_message_buffer 
    FOR UPDATE USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "whatsapp_buffer_delete" ON whatsapp_message_buffer 
    FOR DELETE USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM user_restaurant_mapping 
            WHERE auth_user_id = auth.uid()
        )
    );

-- ====================================
-- PASO 6: FUNCIÓN DE CLEANUP
-- ====================================

-- Eliminar función existente si tiene tipo de retorno diferente
DROP FUNCTION IF EXISTS cleanup_old_whatsapp_buffers();

CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_buffers()
RETURNS TABLE (
    deleted_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Borrar buffers con más de 5 minutos de inactividad
    DELETE FROM whatsapp_message_buffer
    WHERE last_message_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted;
END;
$$;

-- ====================================
-- PASO 7: TRIGGER PARA UPDATED_AT
-- ====================================

CREATE OR REPLACE FUNCTION update_whatsapp_buffer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_whatsapp_buffer_updated_at
    BEFORE UPDATE ON whatsapp_message_buffer
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_buffer_timestamp();

-- ====================================
-- PASO 8: GRANT PERMISSIONS
-- ====================================

-- Permisos para service_role (n8n)
GRANT ALL ON whatsapp_message_buffer TO service_role;
GRANT ALL ON whatsapp_message_buffer TO authenticated;

-- ====================================
-- CONFIRMACIÓN
-- ====================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tabla whatsapp_message_buffer creada correctamente';
    RAISE NOTICE '📊 Columnas: id, restaurant_id, buffer_key, customer_phone, customer_name, messages, message_count, first_message_at, last_message_at, metadata, created_at, updated_at';
    RAISE NOTICE '📈 Índices creados: 4 (restaurant_id, customer_phone, buffer_key, last_message_at)';
    RAISE NOTICE '🔒 RLS habilitado con políticas multi-tenant';
    RAISE NOTICE '⚡ Trigger updated_at configurado';
    RAISE NOTICE '🧹 Función cleanup_old_whatsapp_buffers() lista';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 LISTO PARA USAR EN N8N';
END $$;

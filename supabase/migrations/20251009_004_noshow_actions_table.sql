-- ========================================
-- NOSHOW ACTIONS - Tabla de Acciones de No-Shows
-- Fecha: 09 Octubre 2025
-- Descripción: Registro de todas las acciones tomadas para prevenir no-shows
-- ========================================

-- 1. CREAR TABLA noshow_actions
CREATE TABLE IF NOT EXISTS noshow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Tipo de acción
    action_type VARCHAR NOT NULL CHECK (action_type IN (
        'confirmation_sent_24h',
        'confirmation_sent_4h',
        'reminder_sent',
        'call_made',
        'auto_release',
        'manual_action',
        'customer_confirmed',
        'customer_cancelled'
    )),
    
    -- Detalles de la acción
    action_date DATE NOT NULL DEFAULT CURRENT_DATE,
    action_description TEXT,
    risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Resultado
    success BOOLEAN DEFAULT NULL,
    notes TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    created_by UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 2. ÍNDICES para rendimiento
CREATE INDEX idx_noshow_actions_restaurant_date 
    ON noshow_actions(restaurant_id, action_date DESC);

CREATE INDEX idx_noshow_actions_reservation 
    ON noshow_actions(reservation_id, created_at DESC);

CREATE INDEX idx_noshow_actions_type 
    ON noshow_actions(action_type, action_date DESC);

-- 3. RLS (Row Level Security)
ALTER TABLE noshow_actions ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT permitido
CREATE POLICY "Users see own restaurant actions"
    ON noshow_actions FOR SELECT
    TO authenticated
    USING (true);

-- Policy: INSERT permitido
CREATE POLICY "Users insert actions"
    ON noshow_actions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 4. COMENTARIOS
COMMENT ON TABLE noshow_actions IS 'Registro de acciones tomadas para prevenir no-shows (confirmaciones, llamadas, etc.)';
COMMENT ON COLUMN noshow_actions.action_type IS 'Tipo de acción: confirmation_sent_24h, confirmation_sent_4h, call_made, auto_release, etc.';
COMMENT ON COLUMN noshow_actions.action_date IS 'Fecha en que se tomó la acción';
COMMENT ON COLUMN noshow_actions.success IS 'TRUE si la acción fue exitosa, FALSE si falló, NULL si no aplica';

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================



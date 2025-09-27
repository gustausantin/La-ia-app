-- =====================================================
-- ACTUALIZAR TIPOS DE EVENTOS - Simplificar para MVP
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- Actualizar constraint de tipos permitidos
ALTER TABLE special_events 
DROP CONSTRAINT IF EXISTS special_events_type_check;

ALTER TABLE special_events 
ADD CONSTRAINT special_events_type_check 
CHECK (type IN ('evento', 'cerrado', 'vacaciones'));

-- Mensaje de confirmación
SELECT 'TIPOS DE EVENTOS ACTUALIZADOS: evento, cerrado, vacaciones' as resultado;

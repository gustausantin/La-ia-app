-- =====================================================
-- ARREGLAR CONSTRAINT PARA PERMITIR 'cerrado'
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =====================================================

-- Eliminar constraint actual
ALTER TABLE special_events 
DROP CONSTRAINT IF EXISTS special_events_type_check;

-- Crear constraint que permita 'evento' y 'cerrado'
ALTER TABLE special_events 
ADD CONSTRAINT special_events_type_check 
CHECK (type IN ('evento', 'cerrado'));

-- Verificar que funciona
SELECT 'CONSTRAINT ACTUALIZADO: evento, cerrado' as resultado;

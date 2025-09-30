-- ============================================
-- DESACTIVAR GENERACIÓN AUTOMÁTICA DE SLOTS
-- ============================================
-- 
-- PROBLEMA: El trigger generaba slots automáticamente al crear/modificar mesas
-- SOLUCIÓN: El trigger SOLO registra cambios, NO genera slots
-- Los slots se generan ÚNICAMENTE cuando el usuario presiona el botón
--
-- Fecha: 30 Septiembre 2025
-- ============================================

-- Eliminar el trigger automático que generaba slots
DROP TRIGGER IF EXISTS table_changes_trigger ON tables;
DROP FUNCTION IF EXISTS handle_table_changes();

-- ============================================
-- VERIFICAR QUE EL TRIGGER FUE ELIMINADO
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tables'
AND trigger_name = 'table_changes_trigger';

-- Si no devuelve filas = ✅ Trigger eliminado correctamente
-- Ahora los slots SOLO se generan cuando el usuario presiona "Generar Disponibilidades"

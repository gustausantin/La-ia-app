-- =====================================================
-- SOLUCIÓN DEFINITIVA: Activar SOLO las plantillas de recordatorios
-- Fecha: 2025-10-12
-- =====================================================

-- PASO 1: DESACTIVAR TODAS las plantillas
UPDATE message_templates
SET is_active = false, updated_at = NOW();

-- PASO 2: ACTIVAR SOLO las de confirmación 24h y 4h
UPDATE message_templates
SET is_active = true, updated_at = NOW()
WHERE category IN ('confirmacion_24h', 'confirmacion_4h');

-- PASO 3: VERIFICACIÓN - Mostrar qué está activo
SELECT 
  restaurant_id,
  name,
  category,
  is_active,
  created_at
FROM message_templates
WHERE is_active = true
ORDER BY restaurant_id, category;

-- PASO 4: Contar cuántas activas hay por categoría
SELECT 
  category,
  COUNT(*) as total_activas
FROM message_templates
WHERE is_active = true
GROUP BY category
ORDER BY category;


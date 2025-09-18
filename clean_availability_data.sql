-- Script para eliminar todas las disponibilidades y limpiar la base de datos
-- Esto nos permitirá ver mejor la estructura de datos sin tanto ruido

-- 1. Eliminar todas las disponibilidades
DELETE FROM availability_slots;

-- 2. Mostrar cuántas filas se eliminaron
SELECT 'Availability slots eliminados' as action;

-- 3. Verificar que la tabla esté vacía
SELECT COUNT(*) as remaining_slots FROM availability_slots;

-- 4. Opcional: resetear la secuencia si existe
-- ALTER SEQUENCE availability_slots_id_seq RESTART WITH 1;

SELECT 'Limpieza de availability_slots completada' as status;

-- SCRIPT PARA DIAGNOSTICAR DATOS DE HORARIOS Y TURNOS
-- Ejecutar en SQL Editor de Supabase

-- 1. VER ESTRUCTURA COMPLETA DE SETTINGS
SELECT 
    id,
    name,
    settings
FROM restaurants 
LIMIT 1;

-- 2. VER SOLO OPERATING_HOURS
SELECT 
    id,
    name,
    settings->'operating_hours' as operating_hours
FROM restaurants 
LIMIT 1;

-- 3. VER HORARIOS POR DÍA
SELECT 
    id,
    name,
    settings->'operating_hours'->'monday' as monday,
    settings->'operating_hours'->'tuesday' as tuesday,
    settings->'operating_hours'->'wednesday' as wednesday,
    settings->'operating_hours'->'thursday' as thursday,
    settings->'operating_hours'->'friday' as friday,
    settings->'operating_hours'->'saturday' as saturday,
    settings->'operating_hours'->'sunday' as sunday
FROM restaurants 
LIMIT 1;

-- 4. VER ESPECÍFICAMENTE JUEVES Y VIERNES
SELECT 
    'jueves' as dia,
    settings->'operating_hours'->'thursday' as horario
FROM restaurants 
LIMIT 1
UNION ALL
SELECT 
    'viernes' as dia,
    settings->'operating_hours'->'friday' as horario
FROM restaurants 
LIMIT 1;

-- 5. VER SI HAY TURNOS EN JUEVES
SELECT 
    'turnos_jueves' as info,
    settings->'operating_hours'->'thursday'->'shifts' as turnos
FROM restaurants 
LIMIT 1;

-- 6. VER TODA LA CONFIGURACIÓN DE RESERVAS
SELECT 
    settings->'reservation_duration' as duracion_reserva,
    settings->'buffer_time' as buffer_tiempo,
    settings->'advance_booking_days' as dias_anticipacion
FROM restaurants 
LIMIT 1;

-- 7. COMPROBAR SI HAY DATOS EN ESPAÑOL
SELECT 
    settings->'operating_hours'->'jueves' as jueves_español,
    settings->'operating_hours'->'viernes' as viernes_español
FROM restaurants 
LIMIT 1;

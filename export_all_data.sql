-- SCRIPT PARA EXPORTAR DATOS DE TABLAS PRINCIPALES
-- Ejecutar en SQL Editor de Supabase

-- TABLA: restaurants (configuración principal)
SELECT 'RESTAURANTS' as tabla;
SELECT * FROM restaurants;

-- TABLA: tables (mesas)
SELECT 'TABLES' as tabla;
SELECT * FROM tables;

-- TABLA: availability_slots (disponibilidades)
SELECT 'AVAILABILITY_SLOTS (primeros 10)' as tabla;
SELECT * FROM availability_slots ORDER BY slot_date, start_time LIMIT 10;

-- TABLA: reservations (reservas)
SELECT 'RESERVATIONS' as tabla;
SELECT * FROM reservations;

-- TABLA: customers (clientes)
SELECT 'CUSTOMERS' as tabla;
SELECT * FROM customers;

-- TABLA: special_events (eventos especiales)
SELECT 'SPECIAL_EVENTS' as tabla;
SELECT * FROM special_events;

-- CONTEO DE REGISTROS POR TABLA
SELECT 
    'CONTEO REGISTROS' as info,
    (SELECT COUNT(*) FROM restaurants) as restaurants,
    (SELECT COUNT(*) FROM tables) as tables,
    (SELECT COUNT(*) FROM availability_slots) as availability_slots,
    (SELECT COUNT(*) FROM reservations) as reservations,
    (SELECT COUNT(*) FROM customers) as customers;

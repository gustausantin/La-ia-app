-- =====================================================
-- FIX RÁPIDO: Corregir reserva de Gustavo (valores al revés)
-- Fecha: 2025-10-12
-- =====================================================

-- Corregir la reserva de Gustavo (20:00)
UPDATE reservations
SET 
  reservation_channel = 'manual',
  updated_at = NOW()
WHERE 
  customer_name = 'Gustavo Santin Sanchez'
  AND reservation_date = '2025-10-12'
  AND reservation_time = '20:00:00'
  AND restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- Verificar que quedó bien
SELECT 
  customer_name,
  reservation_time,
  reservation_channel,
  channel,
  source
FROM reservations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND reservation_date = '2025-10-12'
ORDER BY reservation_time;


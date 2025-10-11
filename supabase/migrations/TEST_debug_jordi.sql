-- TEST: Debug de Jordi para ver por qué no aplica Factor 7

DO $$
DECLARE
    v_reservation RECORD;
    v_hours_until NUMERIC;
    v_has_confirmation BOOLEAN;
    v_reservation_datetime TIMESTAMP;
BEGIN
    -- Obtener la reserva de Jordi
    SELECT * INTO v_reservation
    FROM reservations
    WHERE customer_name ILIKE '%Jordi%'
    AND reservation_date = CURRENT_DATE
    LIMIT 1;
    
    RAISE NOTICE '📊 RESERVA DE JORDI:';
    RAISE NOTICE '  ID: %', v_reservation.id;
    RAISE NOTICE '  Fecha: %', v_reservation.reservation_date;
    RAISE NOTICE '  Hora: %', v_reservation.reservation_time;
    
    -- Calcular fecha/hora combinada
    v_reservation_datetime := v_reservation.reservation_date::TIMESTAMP + v_reservation.reservation_time;
    RAISE NOTICE '  DateTime combinado: %', v_reservation_datetime;
    RAISE NOTICE '  NOW(): %', NOW();
    
    -- Calcular horas restantes
    v_hours_until := EXTRACT(EPOCH FROM (v_reservation_datetime - NOW())) / 3600;
    RAISE NOTICE '  Horas hasta reserva: %', v_hours_until;
    RAISE NOTICE '  ¿Menos de 2.25h?: %', (v_hours_until < 2.25);
    
    -- Verificar confirmación
    SELECT EXISTS (
        SELECT 1 FROM customer_confirmations
        WHERE reservation_id = v_reservation.id
        AND confirmed = TRUE
    ) INTO v_has_confirmation;
    
    RAISE NOTICE '  ¿Tiene confirmación?: %', v_has_confirmation;
    RAISE NOTICE '  ¿NO tiene confirmación?: %', (NOT v_has_confirmation);
    
    -- Verificar condición completa
    RAISE NOTICE '🔥 CONDICIÓN FACTOR 7: %', 
        (v_hours_until < 2.25 AND NOT v_has_confirmation);
        
END $$;



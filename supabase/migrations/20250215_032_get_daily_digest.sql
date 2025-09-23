-- get_daily_digest: KPIs diarios para resumen (texto)
CREATE OR REPLACE FUNCTION get_daily_digest(
  p_restaurant_id UUID,
  p_date DATE DEFAULT timezone('utc', now())::date
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start TIMESTAMPTZ := timezone('utc', p_date);
  v_end   TIMESTAMPTZ := timezone('utc', p_date) + interval '1 day';
  v_totals RECORD;
  v_next_3h INT;
  v_conflicts INT := 0;
  v_reminders INT := 0;
  v_high_risk INT := 0;
  v_expected NUMERIC := NULL;
  v_errors INT := 0;
BEGIN
  -- Totales por estado (hoy)
  SELECT 
    COUNT(*) FILTER (WHERE reservation_date = p_date)               AS total,
    COUNT(*) FILTER (WHERE reservation_date = p_date AND status='confirmed') AS confirmed,
    COUNT(*) FILTER (WHERE reservation_date = p_date AND status='pending')   AS pending,
    COUNT(*) FILTER (WHERE reservation_date = p_date AND status='cancelled') AS cancelled,
    COUNT(*) FILTER (WHERE created_at >= v_start AND created_at < v_end)     AS new_today
  INTO v_totals
  FROM reservations
  WHERE restaurant_id = p_restaurant_id;

  -- Próximas 3 horas (desde ahora)
  SELECT COUNT(*) INTO v_next_3h
  FROM reservations
  WHERE restaurant_id = p_restaurant_id
    AND reservation_date = timezone('utc', now())::date
    AND reservation_time >= (timezone('utc', now())::time)
    AND reservation_time < ((timezone('utc', now()) + interval '3 hours')::time)
    AND status IN ('confirmed','pending','seated');

  -- Conflictos (heurística: misma mesa y hora +-90m, hoy)
  SELECT COALESCE(SUM(cnt_conflict),0) INTO v_conflicts
  FROM (
    SELECT CASE WHEN EXISTS (
      SELECT 1 FROM reservations r2
      WHERE r2.restaurant_id = r1.restaurant_id
        AND r2.reservation_date = r1.reservation_date
        AND r2.table_id IS NOT NULL AND r1.table_id IS NOT NULL
        AND r2.table_id = r1.table_id
        AND r2.id <> r1.id
        AND r2.status IN ('pending','confirmed','seated')
        AND (
          r1.reservation_time BETWEEN r2.reservation_time - interval '90 minutes' AND r2.reservation_time + interval '90 minutes'
          OR r2.reservation_time BETWEEN r1.reservation_time - interval '90 minutes' AND r1.reservation_time + interval '90 minutes'
        )
    ) THEN 1 ELSE 0 END AS cnt_conflict
    FROM reservations r1
    WHERE r1.restaurant_id = p_restaurant_id AND r1.reservation_date = p_date
  ) s;

  -- Recordatorios pendientes (placeholder si existe tabla reminders)
  BEGIN
    SELECT COUNT(*) INTO v_reminders
    FROM reminders
    WHERE restaurant_id = p_restaurant_id AND reminder_date = p_date AND sent = false;
  EXCEPTION WHEN undefined_table THEN
    v_reminders := 0;
  END;

  -- Riesgo no-show alto hoy (tabla noshow_actions si existe)
  BEGIN
    SELECT COUNT(*) INTO v_high_risk
    FROM noshow_actions
    WHERE restaurant_id = p_restaurant_id AND risk_level = 'high' AND action_date = p_date;
  EXCEPTION WHEN undefined_table THEN
    v_high_risk := 0;
  END;

  -- Ingresos esperados (si spend_amount existe)
  BEGIN
    SELECT SUM(spend_amount)::numeric INTO v_expected
    FROM reservations
    WHERE restaurant_id = p_restaurant_id AND reservation_date = p_date AND spend_amount IS NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    v_expected := NULL;
  END;

  -- Errores de integraciones últimas 24h (si integration_logs existe)
  BEGIN
    SELECT COUNT(*) INTO v_errors
    FROM integration_logs
    WHERE restaurant_id = p_restaurant_id AND level = 'error' AND created_at >= (timezone('utc', now()) - interval '24 hours');
  EXCEPTION WHEN undefined_table THEN
    v_errors := 0;
  END;

  RETURN jsonb_build_object(
    'date', p_date,
    'totals', jsonb_build_object(
      'total', COALESCE(v_totals.total,0),
      'confirmed', COALESCE(v_totals.confirmed,0),
      'pending', COALESCE(v_totals.pending,0),
      'cancelled', COALESCE(v_totals.cancelled,0),
      'new_today', COALESCE(v_totals.new_today,0)
    ),
    'next_3h', COALESCE(v_next_3h,0),
    'conflicts', COALESCE(v_conflicts,0),
    'reminders_pending', COALESCE(v_reminders,0),
    'high_risk_noshow', COALESCE(v_high_risk,0),
    'expected_revenue', CASE WHEN v_expected IS NULL THEN NULL ELSE round(v_expected,2) END,
    'integration_errors_24h', COALESCE(v_errors,0)
  );
END;
$$;



-- Conceder permisos de ejecución de RPCs a roles de cliente
DO $$
BEGIN
  -- Asegurar uso de schema public
  EXECUTE 'GRANT USAGE ON SCHEMA public TO authenticated, anon';

  -- ensure_tenant_defaults(UUID)
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION ensure_tenant_defaults(UUID) TO authenticated, anon';
  EXCEPTION WHEN undefined_function THEN NULL; END;

  -- get_daily_digest(UUID, DATE)
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_daily_digest(UUID, DATE) TO authenticated, anon';
  EXCEPTION WHEN undefined_function THEN NULL; END;

  -- update_restaurant_channels(UUID, JSONB)
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION update_restaurant_channels(UUID, JSONB) TO authenticated, anon';
  EXCEPTION WHEN undefined_function THEN NULL; END;

  -- update_restaurant_notifications(UUID, JSONB)
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION update_restaurant_notifications(UUID, JSONB) TO authenticated, anon';
  EXCEPTION WHEN undefined_function THEN NULL; END;
END $$;



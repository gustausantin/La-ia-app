-- RPC para actualizar canales con control de tenant
CREATE OR REPLACE FUNCTION update_restaurant_channels(
  p_restaurant_id UUID,
  p_channels JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  -- Verificar que el usuario autenticado tiene acceso al restaurant
  SELECT EXISTS(
    SELECT 1 FROM user_restaurant_mapping
    WHERE restaurant_id = p_restaurant_id AND auth_user_id = auth.uid()
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  UPDATE restaurants
  SET channels = COALESCE(p_channels, '{}'::jsonb),
      updated_at = timezone('utc', now())
  WHERE id = p_restaurant_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC para actualizar notificaciones
CREATE OR REPLACE FUNCTION update_restaurant_notifications(
  p_restaurant_id UUID,
  p_notifications JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allowed BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_restaurant_mapping
    WHERE restaurant_id = p_restaurant_id AND auth_user_id = auth.uid()
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = '42501';
  END IF;

  UPDATE restaurants
  SET notifications = COALESCE(p_notifications, '{}'::jsonb),
      updated_at = timezone('utc', now())
  WHERE id = p_restaurant_id;

  RETURN jsonb_build_object('success', true);
END;
$$;



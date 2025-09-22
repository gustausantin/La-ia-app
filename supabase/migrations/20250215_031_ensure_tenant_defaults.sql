-- Ensure tenant defaults for configuration tables

-- 1) Crear tabla restaurant_settings si no existe
CREATE TABLE IF NOT EXISTS restaurant_settings (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Trigger function updated_at (idempotente por CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restaurant_settings_updated_at ON restaurant_settings;
CREATE TRIGGER trg_restaurant_settings_updated_at
  BEFORE UPDATE ON restaurant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2) Crear tabla crm_settings si no existe (estructura mínima para defaults)
CREATE TABLE IF NOT EXISTS crm_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  days_new_customer INTEGER DEFAULT 30,
  days_active_customer INTEGER DEFAULT 30,
  days_inactive_customer INTEGER DEFAULT 90,
  visits_bib_customer INTEGER DEFAULT 5,
  days_risk_customer INTEGER DEFAULT 45,
  auto_suggestions BOOLEAN DEFAULT true,
  auto_segmentation BOOLEAN DEFAULT true,
  vip_spend_threshold NUMERIC DEFAULT 500,
  near_vip_spend_ratio NUMERIC DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_crm_settings_updated_at ON crm_settings;
CREATE TRIGGER trg_crm_settings_updated_at
  BEFORE UPDATE ON crm_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3) RPC ensure_tenant_defaults
CREATE OR REPLACE FUNCTION ensure_tenant_defaults(
  p_restaurant_id UUID
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_created_crm BOOLEAN := false;
  v_created_rest BOOLEAN := false;
  v_row JSONB;
BEGIN
  -- crm_settings
  IF NOT EXISTS (
    SELECT 1 FROM crm_settings WHERE restaurant_id = p_restaurant_id
  ) THEN
    INSERT INTO crm_settings (
      restaurant_id,
      days_new_customer,
      days_active_customer,
      days_inactive_customer,
      visits_bib_customer,
      days_risk_customer,
      auto_suggestions,
      auto_segmentation,
      vip_spend_threshold,
      near_vip_spend_ratio
    ) VALUES (
      p_restaurant_id,
      30,
      30,
      90,
      5,
      45,
      true,
      true,
      500,
      0.8
    );
    v_created_crm := true;
  END IF;

  -- restaurant_settings
  IF NOT EXISTS (
    SELECT 1 FROM restaurant_settings WHERE restaurant_id = p_restaurant_id
  ) THEN
    INSERT INTO restaurant_settings (
      restaurant_id,
      settings
    ) VALUES (
      p_restaurant_id,
      jsonb_build_object(
        'language', 'es',
        'currency', 'EUR',
        'timezone', 'Europe/Madrid',
        'channels', jsonb_build_object(
          'whatsapp', jsonb_build_object('enabled', false),
          'email', jsonb_build_object('enabled', false),
          'vapi', jsonb_build_object('enabled', false),
          'webchat', jsonb_build_object('enabled', true)
        )
      )
    );
    v_created_rest := true;
  END IF;

  v_row := jsonb_build_object(
    'crm_created', v_created_crm,
    'restaurant_settings_created', v_created_rest
  );
  RETURN jsonb_build_object('success', true, 'result', v_row);
END;
$$;



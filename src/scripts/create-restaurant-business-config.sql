-- 🏗️ TABLA PARA CONFIGURACIÓN BUSINESS DE CADA RESTAURANTE
-- Para cálculos ROI reales basados en datos del restaurante

CREATE TABLE IF NOT EXISTS restaurant_business_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- DATOS FINANCIEROS REALES
    avg_ticket_price DECIMAL(10,2) DEFAULT 35.00, -- Ticket promedio real del restaurante
    monthly_revenue DECIMAL(10,2), -- Facturación mensual actual
    staff_cost_monthly DECIMAL(10,2) DEFAULT 1800.00, -- Costo real empleado atención al cliente
    
    -- DATOS OPERACIONALES
    current_reservations_monthly INTEGER DEFAULT 0, -- Reservas mensuales actuales
    target_growth_percentage DECIMAL(5,2) DEFAULT 15.00, -- Objetivo crecimiento
    
    -- CONFIGURACIÓN IA
    ai_system_cost DECIMAL(10,2) DEFAULT 199.00, -- Precio plan contratado
    ai_expected_improvement DECIMAL(5,2) DEFAULT 15.00, -- Mejora esperada IA (configurable)
    
    -- DATOS ADICIONALES PARA ROI PRECISO
    operating_hours_daily INTEGER DEFAULT 12, -- Horas operación diarias
    peak_hours_percentage DECIMAL(5,2) DEFAULT 30.00, -- % horas pico
    manual_response_time_minutes DECIMAL(5,2) DEFAULT 5.00, -- Tiempo respuesta manual
    
    -- METADATOS
    configured_by VARCHAR(255), -- Quién configuró (owner, consultant, etc.)
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(restaurant_id)
);

-- INSERTAR CONFIGURACIÓN DEMO PARA EL RESTAURANT ACTUAL
DO $$
DECLARE
    target_restaurant_id UUID;
BEGIN
    -- Obtener restaurant ID
    SELECT id INTO target_restaurant_id 
    FROM restaurants 
    WHERE owner_id = (
        SELECT id FROM auth.users WHERE email = 'gustausantin@gmail.com'
    );
    
    IF target_restaurant_id IS NOT NULL THEN
        -- Insertar configuración business DEMO (el usuario la completará)
        INSERT INTO restaurant_business_config (
            restaurant_id,
            avg_ticket_price,
            monthly_revenue,
            staff_cost_monthly,
            current_reservations_monthly,
            ai_system_cost,
            configured_by
        ) VALUES (
            target_restaurant_id,
            35.00, -- €35 ticket promedio (DEMO - usuario debe actualizar)
            5500.00, -- €5,500 facturación DEMO
            1800.00, -- €1,800 empleado DEMO
            178, -- Reservas mensuales DEMO
            199.00, -- €199 plan actual
            'demo_data'
        ) ON CONFLICT (restaurant_id) DO UPDATE SET
            last_updated = NOW();
            
        RAISE NOTICE '✅ Configuración business creada para restaurant: %', target_restaurant_id;
    END IF;
END $$;

-- FUNCIÓN PARA CALCULAR ROI REAL
CREATE OR REPLACE FUNCTION calculate_restaurant_roi(restaurant_uuid UUID)
RETURNS TABLE (
    current_monthly_revenue DECIMAL,
    projected_revenue_with_ai DECIMAL,
    cost_savings DECIMAL,
    ai_cost DECIMAL,
    net_benefit DECIMAL,
    roi_percentage DECIMAL,
    payback_weeks INTEGER,
    calculation_source TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    config_data restaurant_business_config%ROWTYPE;
    reservas_actuales INTEGER;
BEGIN
    -- Obtener configuración del restaurante
    SELECT * INTO config_data 
    FROM restaurant_business_config 
    WHERE restaurant_id = restaurant_uuid;
    
    IF NOT FOUND THEN
        -- Valores por defecto si no hay configuración
        config_data.avg_ticket_price := 35.00;
        config_data.staff_cost_monthly := 1800.00;
        config_data.ai_system_cost := 199.00;
        config_data.ai_expected_improvement := 15.00;
        config_data.current_reservations_monthly := 0;
    END IF;
    
    -- Obtener reservas reales del último mes
    SELECT COALESCE(SUM(successful_bookings), 0) INTO reservas_actuales
    FROM agent_metrics 
    WHERE restaurant_id = restaurant_uuid 
    AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Si no hay datos históricos, usar configuración
    IF reservas_actuales = 0 THEN
        reservas_actuales := config_data.current_reservations_monthly;
    END IF;
    
    -- Calcular ROI real
    RETURN QUERY SELECT
        -- Ingresos actuales
        (reservas_actuales * config_data.avg_ticket_price)::DECIMAL as current_monthly_revenue,
        
        -- Ingresos proyectados con IA
        (reservas_actuales * config_data.avg_ticket_price * (1 + config_data.ai_expected_improvement/100))::DECIMAL as projected_revenue_with_ai,
        
        -- Ahorro en costos de personal
        (config_data.staff_cost_monthly - config_data.ai_system_cost)::DECIMAL as cost_savings,
        
        -- Costo del sistema IA
        config_data.ai_system_cost::DECIMAL as ai_cost,
        
        -- Beneficio neto
        ((reservas_actuales * config_data.avg_ticket_price * config_data.ai_expected_improvement/100) + 
         (config_data.staff_cost_monthly - config_data.ai_system_cost) - config_data.ai_system_cost)::DECIMAL as net_benefit,
        
        -- ROI porcentaje
        ((((reservas_actuales * config_data.avg_ticket_price * config_data.ai_expected_improvement/100) + 
           (config_data.staff_cost_monthly - config_data.ai_system_cost) - config_data.ai_system_cost) / 
          config_data.ai_system_cost) * 100)::DECIMAL as roi_percentage,
        
        -- Payback en semanas
        CEIL(config_data.ai_system_cost / 
             (((reservas_actuales * config_data.avg_ticket_price * config_data.ai_expected_improvement/100) + 
               (config_data.staff_cost_monthly - config_data.ai_system_cost)) / 4))::INTEGER as payback_weeks,
        
        -- Fuente del cálculo
        CASE 
            WHEN config_data.configured_by = 'demo_data' THEN 'Datos demo - requiere configuración real'
            ELSE 'Configuración personalizada del restaurante'
        END as calculation_source;
END;
$$;

-- VERIFICAR CREACIÓN
SELECT 'TABLA CREADA:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'restaurant_business_config';

SELECT 'FUNCIÓN CREADA:' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'calculate_restaurant_roi';

-- TEST DE LA FUNCIÓN
SELECT 'TEST ROI CALCULATION:' as info;
SELECT * FROM calculate_restaurant_roi(
    (SELECT id FROM restaurants WHERE owner_id = (
        SELECT id FROM auth.users WHERE email = 'gustausantin@gmail.com'
    ))
);

-- CONFIRMACIÓN FINAL
DO $$
BEGIN
    RAISE NOTICE '🎯 SOLUCIÓN: Ahora los cálculos ROI son basados en datos reales del restaurante';
    RAISE NOTICE '📊 CONFIGURACIÓN: El restaurante puede actualizar sus datos reales en Configuración';
    RAISE NOTICE '🔧 FUNCIÓN: calculate_restaurant_roi() hace cálculos precisos con datos reales';
END $$;

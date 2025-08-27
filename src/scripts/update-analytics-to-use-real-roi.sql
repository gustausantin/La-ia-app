-- 🔧 ACTUALIZAR Analytics para usar calculate_restaurant_roi() real

-- VERIFICAR QUE LA FUNCIÓN FUNCIONA CORRECTAMENTE
SELECT 'VERIFICACIÓN FUNCIÓN ROI:' as test;
SELECT 
    current_monthly_revenue,
    net_benefit,
    roi_percentage,
    calculation_source
FROM calculate_restaurant_roi(
    (SELECT id FROM restaurants WHERE owner_id = (
        SELECT id FROM auth.users WHERE email = 'gustausantin@gmail.com'
    ))
);

-- VERIFICAR DATOS DE CONFIGURACIÓN
SELECT 'CONFIGURACIÓN ACTUAL:' as config;
SELECT 
    avg_ticket_price,
    staff_cost_monthly,
    ai_system_cost,
    ai_expected_improvement,
    configured_by
FROM restaurant_business_config 
WHERE restaurant_id = (
    SELECT id FROM restaurants WHERE owner_id = (
        SELECT id FROM auth.users WHERE email = 'gustausantin@gmail.com'
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ LA FUNCIÓN ROI ESTÁ LISTA PARA USAR EN ANALYTICS';
    RAISE NOTICE '🔧 PRÓXIMO PASO: Actualizar Analytics.jsx para usar calculate_restaurant_roi()';
    RAISE NOTICE '📊 BENEFICIO: ROI basado en datos reales, no hardcodeados';
    RAISE NOTICE '⚙️ CONFIGURABLE: Cada restaurante puede poner sus datos reales';
END $$;

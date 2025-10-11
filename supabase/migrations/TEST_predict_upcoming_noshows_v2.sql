-- Verificar si la función predict_upcoming_noshows_v2 existe
SELECT proname, proargnames, prosrc
FROM pg_proc
WHERE proname = 'predict_upcoming_noshows_v2';

-- Si no existe, verificar si predict_upcoming_noshows existe (versión anterior)
SELECT proname, proargnames
FROM pg_proc
WHERE proname LIKE 'predict_upcoming_noshows%';

-- Verificar si calculate_dynamic_risk_score existe
SELECT proname
FROM pg_proc
WHERE proname = 'calculate_dynamic_risk_score';



# ✅ SOLUCIÓN FINAL COMPLETA - No-Shows y Dashboard

## 📊 PROBLEMAS CORREGIDOS

### 1. ✅ Tarjeta "Reservas de riesgo hoy" muestra 0 (debe mostrar 2)
**CAUSA:** La función `get_restaurant_noshow_metrics` solo contaba `risk_level = 'high'` (score >= 80), pero las reservas tienen `risk_level = 'medium'` (score 40-79).

**SOLUCIÓN:** Modificar para contar `medium` + `high`.

**ARCHIVOS:**
- `supabase/migrations/FIX_get_restaurant_noshow_metrics.sql` (línea 59)
- `src/pages/DashboardAgente.jsx` (línea 194)

---

### 2. ✅ Dashboard "Alertas No-Shows" muestra 0 (debe mostrar 2)
**CAUSA:** Mismo problema que #1 - solo contaba "high".

**SOLUCIÓN:** Ya corregido en `DashboardAgente.jsx`.

---

### 3. ✅ Dashboard "Clientes de hoy" desglose 0+0+0 (debe sumar 6)
**CAUSA:** El código contaba **número de reservas**, no **número de personas (party_size)**.

**SOLUCIÓN:** Cambiar de `.filter().length` a `.reduce((sum, r) => sum + r.party_size)`.

**ARCHIVOS:**
- `src/pages/DashboardAgente.jsx` (líneas 225-247)

---

### 4. ⏳ Reservas pasadas siguen "Pending" (deben ser "No-Show")
**CAUSA:** El cron job del servidor NO se ejecutó o las reservas no cumplen el criterio de tiempo.

**SOLUCIÓN:** Aplicar SQL actualizado y ejecutar manualmente la función.

---

## 🔧 PASOS PARA APLICAR

### PASO 1: Actualizar función SQL en Supabase

```sql
-- ========================================
-- FIX: Eliminar versiones conflictivas y crear solo UNA función
-- ========================================

-- 1. Eliminar TODAS las versiones existentes
DROP FUNCTION IF EXISTS get_restaurant_noshow_metrics(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_noshow_metrics(UUID, INT) CASCADE;

-- 2. Crear UNA ÚNICA versión con parámetro opcional
CREATE OR REPLACE FUNCTION get_restaurant_noshow_metrics(
    p_restaurant_id UUID,
    p_days_back INT DEFAULT 90
)
RETURNS TABLE(
    prevented_this_month INT,
    noshow_rate NUMERIC,
    monthly_roi NUMERIC,
    high_risk_today INT
) AS $$
DECLARE
    v_start_of_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_total_reservations INT;
    v_noshows INT;
    v_prevented INT;
    v_high_risk_today INT;
    v_avg_ticket NUMERIC := 35.00;
    v_avg_party_size NUMERIC;
BEGIN
    -- 1. Contar No-Shows evitados este mes (de noshow_actions)
    SELECT COUNT(*)
    INTO v_prevented
    FROM noshow_actions
    WHERE restaurant_id = p_restaurant_id
    AND created_at >= v_start_of_month
    AND (final_outcome = 'prevented' OR prevented_noshow = true);
    
    -- 2. Calcular tasa de no-show (últimos p_days_back días)
    SELECT 
        COUNT(*) FILTER (WHERE status = 'no_show'),
        COUNT(*)
    INTO v_noshows, v_total_reservations
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    AND reservation_date < CURRENT_DATE
    AND status IN ('confirmed', 'completed', 'no_show', 'seated', 'cancelled');
    
    -- 3. Calcular tamaño promedio de grupo
    SELECT COALESCE(AVG(party_size), 2)
    INTO v_avg_party_size
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date >= v_start_of_month;
    
    -- 4. Contar reservas de riesgo HOY (medium + high)
    SELECT COUNT(*)
    INTO v_high_risk_today
    FROM predict_upcoming_noshows_v2(p_restaurant_id, 0) -- 0 = solo hoy
    WHERE risk_level IN ('medium', 'high');
    
    -- Retornar resultados
    RETURN QUERY
    SELECT 
        v_prevented as prevented_this_month,
        CASE 
            WHEN v_total_reservations > 0 
            THEN ROUND((v_noshows::NUMERIC / v_total_reservations::NUMERIC) * 100, 1)
            ELSE 0::NUMERIC
        END as noshow_rate,
        ROUND((v_prevented * v_avg_party_size * v_avg_ticket)::NUMERIC, 2) as monthly_roi,
        v_high_risk_today as high_risk_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### PASO 2: Marcar reservas pasadas como No-Show

```sql
-- Ejecutar la función para marcar reservas caducadas
SELECT * FROM mark_all_expired_reservations_as_noshow();

-- Verificar resultado
SELECT 
    customer_name,
    reservation_date,
    reservation_time,
    status,
    updated_at
FROM reservations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND reservation_date < CURRENT_DATE
ORDER BY reservation_date DESC, reservation_time DESC;
```

---

## 🎯 RESULTADO ESPERADO

### Dashboard:
- **Clientes de hoy:** 6
  - **Nuevos:** [suma party_size de reservas sin customer_id o visits_count=1]
  - **Habituales:** [suma party_size de reservas con visits_count 2-9]
  - **VIP:** [suma party_size de reservas con visits_count >=10 o segment_auto='vip']
- **Alertas No-Shows:** 2 (Emilio Duro + Andrea Martinez)

### Página No-Shows:
- **Reservas de riesgo hoy:** 2
- **Lista:** Emilio Duro (Score 70, Riesgo Medio) + Andrea Martinez (Score 55, Riesgo Medio)

### Página Reservas (Pasadas):
- Jordi Garcia 10/10 19:00 → **No-Show** (rojo)
- Lucia Meria 10/10 19:00 → **No-Show** (rojo)
- Mireia Reina 10/10 18:00 → **No-Show** (rojo)
- Bet Molina 09/10 20:00 → **No-Show** (rojo)
- Berta Dos 06/10 22:00 → **No-Show** (rojo)
- Andrea Martinez 06/10 20:00 → **No-Show** (rojo)

---

## ⚙️ CRON JOB AUTOMÁTICO

El servidor (`server.js`) ahora ejecuta automáticamente cada 30 minutos:

```javascript
// Ejecutar cada 30 minutos
setInterval(markExpiredReservations, 30 * 60 * 1000);
```

**Próxima ejecución:** ~10:16 AM (30 min después de iniciar el servidor)

---

## 📝 NOTAS IMPORTANTES

1. **El cron job solo funciona si el servidor está ejecutándose** (`npm run dev` en puerto 5000).
2. **Las reservas del día actual (11/10) que todavía no han pasado NO deben marcarse** como no-show.
3. **La función SQL respeta el cutoff de 2 horas**: Si la reserva era a las 20:00, se marca como no-show a las 22:00.

---

## 🔍 QUERIES DE VERIFICACIÓN

```sql
-- 1. Ver todas las reservas de hoy con tipo de cliente
SELECT 
    r.customer_name,
    r.party_size,
    c.visits_count,
    c.segment_auto,
    CASE 
        WHEN r.customer_id IS NULL THEN 'NUEVO'
        WHEN c.visits_count = 1 THEN 'NUEVO'
        WHEN c.visits_count >= 2 AND c.visits_count < 10 THEN 'HABITUAL'
        WHEN c.visits_count >= 10 OR c.segment_auto = 'vip' THEN 'VIP'
    END as tipo
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND r.reservation_date = CURRENT_DATE
AND r.status IN ('pending', 'confirmed', 'seated', 'completed');

-- 2. Ver predicciones de riesgo HOY
SELECT 
    customer_name,
    risk_level,
    risk_score,
    noshow_probability,
    confirmation_status
FROM predict_upcoming_noshows_v2('d6b63130-1ebf-4284-98fc-a3b31a85d9d1', 0)
ORDER BY risk_score DESC;

-- 3. Ver métricas generales
SELECT * FROM get_restaurant_noshow_metrics('d6b63130-1ebf-4284-98fc-a3b31a85d9d1');
```



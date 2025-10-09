# 🧠 ALGORITMO DE RIESGO NO-SHOWS MEJORADO

**Fecha:** 2025-10-09  
**Versión:** 2.0 Mejorada

---

## 📊 **SISTEMA ACTUAL (6 FACTORES)**

Según `docs/SISTEMA-NOSHOWS-REVOLUCIONARIO-2025.md`:

### **Factor 1: Historial del Cliente** (0-40 puntos)
```javascript
if (no_show_rate > 0.3) → +40 puntos  // >30% no-shows
if (no_show_rate > 0.1) → +20 puntos  // >10% no-shows
```

### **Factor 2: Inactividad** (0-25 puntos)
```javascript
if (days_since_last_visit > 180) → +25 puntos  // >6 meses
if (days_since_last_visit > 90) → +15 puntos   // >3 meses
```

### **Factor 3: Horario de Riesgo** (0-15 puntos)
```javascript
if (hour >= 21) → +15 puntos  // Cenas tardías
```

### **Factor 4: Tamaño de Grupo** (0-10 puntos)
```javascript
if (party_size >= 6) → +10 puntos  // Grupos grandes
```

### **Factor 5: Canal de Reserva** (0-10 puntos)
```javascript
if (channel === 'phone' || channel === 'walk-in') → +10 puntos
```

### **Factor 6: Antelación** (0-20 puntos)
```javascript
if (hoursAhead < 4) → +20 puntos  // Reserva muy reciente
```

**TOTAL:** 120 puntos máximo

---

## 🆕 **NUEVOS FACTORES PROPUESTOS**

### **Factor 7: Tiempo de Respuesta a Confirmaciones** (0-30 puntos) ⭐ NUEVO

```javascript
// Analizar patrón de respuestas del cliente
const responsePatterns = customer.confirmation_responses || [];

// Nunca responde
if (responsePatterns.never_responds) {
    riskScore += 30;
    factors.push('Nunca responde confirmaciones');
}
// Responde tarde (>12h después del mensaje)
else if (responsePatterns.avg_response_time > 12*60) {
    riskScore += 20;
    factors.push('Responde tarde a confirmaciones');
}
// Responde en tiempo razonable (<4h)
else if (responsePatterns.avg_response_time < 4*60) {
    riskScore -= 10; // BONUS por ser responsivo
    factors.push('Cliente responsivo');
}
```

**Datos a trackear en BD:**
- `customer_confirmations` tabla nueva
- Columnas: `customer_id`, `sent_at`, `responded_at`, `response_time_minutes`

---

### **Factor 8: Día de la Semana** (0-10 puntos) ⭐ NUEVO

```javascript
const dayOfWeek = reservation_date.getDay();

// Viernes y Sábados: menos riesgo (planes firmes)
if (dayOfWeek === 5 || dayOfWeek === 6) {
    riskScore -= 5; // BONUS
    factors.push('Fin de semana (menos riesgo)');
}
// Lunes y Martes: más riesgo (planes débiles)
else if (dayOfWeek === 1 || dayOfWeek === 2) {
    riskScore += 10;
    factors.push('Lunes/Martes (más riesgo)');
}
```

**Fuente:** Estudios indican que no-shows son más comunes entre semana.

---

### **Factor 9: Clima/Meteorología** (0-15 puntos) ⭐ NUEVO (OPCIONAL)

```javascript
// Integración con API de clima (opcional)
if (weatherForecast.rain_probability > 70) {
    riskScore += 15;
    factors.push('Alta probabilidad de lluvia');
}
else if (weatherForecast.extreme_temp) { // <5°C o >35°C
    riskScore += 10;
    factors.push('Temperatura extrema');
}
```

**Fuente:** Mal tiempo aumenta no-shows en 20-30%.

---

### **Factor 10: Ocasión Especial** (0-10 puntos) ⭐ NUEVO

```javascript
// Si la reserva tiene nota de "cumpleaños", "aniversario", etc.
if (reservation.notes?.match(/cumpleaños|aniversario|celebración/i)) {
    riskScore -= 10; // BONUS (menos probabilidad de fallar)
    factors.push('Ocasión especial');
}
```

---

## 🎯 **FACTORES MÁS CRÍTICOS (PRIORIDAD)**

### **✅ IMPLEMENTAR YA:**

1. **Tiempo de Respuesta a Confirmaciones** (Factor 7)
   - Alta correlación con no-shows
   - Datos fáciles de recopilar
   - Cálculo simple

2. **Día de la Semana** (Factor 8)
   - Datos ya disponibles
   - Implementación inmediata
   - Sin costo

3. **Mejora Tamaño de Grupo** (Factor 4 mejorado)
   - Escala graduada en lugar de binario:
   ```javascript
   if (party_size >= 10) → +15 puntos
   if (party_size >= 8) → +12 puntos
   if (party_size >= 6) → +10 puntos
   if (party_size >= 4) → +5 puntos
   ```

### **⏳ IMPLEMENTAR DESPUÉS (MVP 2.0):**

4. **Clima** (Factor 9) → Requiere API externa
5. **Ocasión Especial** (Factor 10) → Análisis de notas con NLP

---

## 📊 **CLASIFICACIÓN DE RIESGO MEJORADA**

Con los 10 factores, el score máximo es ~185 puntos.

### **🔴 ALTO RIESGO (>70 puntos)**
- **Acción:** Llamada de confirmación obligatoria
- **Timing:** T-2h 15min (alarma en Dashboard)
- **Mensaje:** Personal y directo
- **Seguimiento:** Llamar hasta confirmar

### **🟡 RIESGO MEDIO (40-70 puntos)**
- **Acción:** WhatsApp de recordatorio reforzado
- **Timing:** T-4h antes
- **Mensaje:** "Nos confirmas tu asistencia?"
- **Seguimiento:** Si no responde → Alto Riesgo

### **🟢 BAJO RIESGO (<40 puntos)**
- **Acción:** Recordatorio estándar
- **Timing:** T-24h antes
- **Mensaje:** Confirmación amigable
- **Seguimiento:** Estándar

---

## 🔄 **RIESGO DINÁMICO (TIEMPO REAL)**

El riesgo NO es estático, cambia según las respuestas:

### **Ejemplo: Beth Molina 20:00**

**15:00 (T-5h):**
- Score base: 45 (historial + grupo + horario)
- Riesgo: **MEDIO** 🟡

**16:00 (T-4h) - Envía WhatsApp:**
- Si responde en <1h → Score -10 = 35 → **BAJO** 🟢
- Si NO responde → Score +20 = 65 → **MEDIO-ALTO** 🟠

**17:45 (T-2h 15min):**
- Si aún no respondió → Score +15 = 80 → **ALTO** 🔴
- **ALARMA** en Dashboard
- Personal DEBE llamar

**19:59 (T-1min):**
- Si nunca confirmó → **AUTO-LIBERACIÓN**
- Estado: `no-show`
- Slot: LIBERADO

---

## 💾 **DATOS A TRACKEAR (NUEVOS)**

### **Tabla: `customer_confirmations`**
```sql
CREATE TABLE customer_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Mensaje enviado
    sent_at TIMESTAMPTZ NOT NULL,
    message_type VARCHAR NOT NULL, -- 'sms', 'whatsapp', 'email'
    
    -- Respuesta del cliente
    responded_at TIMESTAMPTZ,
    response_time_minutes INT, -- Calculado automáticamente
    response_content TEXT,
    
    -- Resultado
    confirmed BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_confirmations_customer ON customer_confirmations(customer_id);
CREATE INDEX idx_customer_confirmations_restaurant ON customer_confirmations(restaurant_id);
```

### **Columnas Nuevas en `customers`:**
```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_response_time_minutes INT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2); -- % de veces que responde
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;
```

---

## 🧮 **FUNCIÓN RPC MEJORADA**

```sql
CREATE OR REPLACE FUNCTION calculate_noshow_risk_v2(
    p_reservation_id UUID,
    p_restaurant_id UUID
)
RETURNS TABLE (
    risk_score INT,
    risk_level VARCHAR,
    factors JSONB,
    recommended_action VARCHAR,
    recommended_timing VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_score INT := 0;
    v_factors JSONB := '[]'::JSONB;
    v_customer_history RECORD;
    v_reservation RECORD;
BEGIN
    -- Obtener datos de la reserva
    SELECT * INTO v_reservation
    FROM reservations
    WHERE id = p_reservation_id;
    
    -- Obtener historial del cliente
    SELECT 
        no_show_rate,
        days_since_last_visit,
        avg_response_time_minutes,
        response_rate
    INTO v_customer_history
    FROM customers
    WHERE id = v_reservation.customer_id;
    
    -- FACTOR 1: Historial
    IF v_customer_history.no_show_rate > 0.3 THEN
        v_score := v_score + 40;
        v_factors := v_factors || '{"factor": "Historial alto de no-shows", "points": 40}'::JSONB;
    ELSIF v_customer_history.no_show_rate > 0.1 THEN
        v_score := v_score + 20;
        v_factors := v_factors || '{"factor": "Historial moderado", "points": 20}'::JSONB;
    END IF;
    
    -- FACTOR 7: Tiempo de respuesta (NUEVO)
    IF v_customer_history.response_rate < 0.3 THEN
        v_score := v_score + 30;
        v_factors := v_factors || '{"factor": "Rara vez responde", "points": 30}'::JSONB;
    ELSIF v_customer_history.avg_response_time_minutes > 12*60 THEN
        v_score := v_score + 20;
        v_factors := v_factors || '{"factor": "Responde tarde", "points": 20}'::JSONB;
    ELSIF v_customer_history.avg_response_time_minutes < 4*60 THEN
        v_score := v_score - 10;
        v_factors := v_factors || '{"factor": "Cliente responsivo", "points": -10}'::JSONB;
    END IF;
    
    -- [... resto de factores ...]
    
    -- Clasificar riesgo
    IF v_score > 70 THEN
        RETURN QUERY SELECT v_score, 'high'::VARCHAR, v_factors, 
            'Llamar para confirmar'::VARCHAR, 
            '2h 15min antes'::VARCHAR;
    ELSIF v_score > 40 THEN
        RETURN QUERY SELECT v_score, 'medium'::VARCHAR, v_factors, 
            'WhatsApp reforzado'::VARCHAR, 
            '4h antes'::VARCHAR;
    ELSE
        RETURN QUERY SELECT v_score, 'low'::VARCHAR, v_factors, 
            'Recordatorio estándar'::VARCHAR, 
            '24h antes'::VARCHAR;
    END IF;
END;
$$;
```

---

## 📈 **MEJORA CONTINUA**

### **Machine Learning (Fase 3):**
- Entrenar modelo con datos reales
- Ajustar pesos de factores automáticamente
- Detectar nuevos patrones

### **A/B Testing:**
- Probar diferentes umbrales
- Medir efectividad por factor
- Optimizar mensajes de confirmación

---

## 🎯 **RESUMEN EJECUTIVO**

### **Factores Actuales (6):**
1. Historial cliente
2. Inactividad
3. Horario
4. Tamaño grupo
5. Canal reserva
6. Antelación

### **Factores Nuevos Propuestos (4):**
7. ⭐ **Tiempo de respuesta** → **IMPLEMENTAR YA**
8. ⭐ **Día de semana** → **IMPLEMENTAR YA**
9. Clima (opcional)
10. Ocasión especial

### **Próximos Pasos:**
1. ✅ Crear tabla `customer_confirmations`
2. ✅ Trackear tiempos de respuesta
3. ✅ Añadir Factor 7 y 8 al algoritmo
4. ✅ Actualizar RPC `calculate_noshow_risk_v2`
5. ⏳ Testing con datos reales
6. ⏳ Ajustar umbrales según resultados

---

**Estado:** Documentado - Listo para implementación


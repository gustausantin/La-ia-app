# 🔍 AUDITORÍA COMPLETA - DASHBOARD Y CRM ACTUAL

**Fecha:** 1 Octubre 2025  
**Objetivo:** Revisar toda la lógica existente antes de implementar nuevo dashboard

---

## 📊 **DASHBOARD ACTUAL (DashboardRevolutionary.jsx)**

### ✅ **LO QUE YA TENEMOS:**

#### 1️⃣ **SISTEMA DE NO-SHOWS COMPLETO** 🎯

**Tabla en Supabase:** `noshow_actions`

**Datos que se calculan:**
- ✅ `todayRisk`: No-shows de alto riesgo HOY (de la tabla `noshow_actions`)
- ✅ `weeklyPrevented`: No-shows evitados esta semana (acciones con `customer_response = 'confirmed'` o `prevented_noshow = true`)
- ✅ `riskLevel`: Nivel de riesgo (low/medium/high) basado en cantidad
- ✅ `message`: Mensaje descriptivo del estado

**Lógica de riesgo:**
```javascript
riskLevel: todayHighRiskCount > 2 ? 'high' : 
           todayHighRiskCount > 0 ? 'medium' : 'low'
```

**Valor monetario:**
```javascript
noShowsRecovered = noShowsPreventedCount × averageTicket
```

**Widget:** `NoShowWidget` - Muestra el riesgo y lleva a la página `/no-shows`

---

#### 2️⃣ **MÉTRICAS DEL DASHBOARD** 📈

**Métricas calculadas en tiempo real:**

1. **noShowsToday**: No-shows gestionados hoy (desde `noshow_actions`)
2. **reservationsToday**: Reservas de hoy (desde `reservations`)
3. **activeCustomers**: Clientes activos (desde `customers` where `segment_auto != 'inactivo'`)
4. **crmOpportunities**: Oportunidades CRM pendientes

---

#### 3️⃣ **SISTEMA DE ESTADO SEMÁFORO** 🚦

**Estados del sistema:**
- ✅ `excellent`: Todo perfecto
- ✅ `good`: Funcionando bien, algunas oportunidades
- ✅ `warning`: Requiere atención
- ✅ `critical`: Acción requerida

**Lógica:**
```javascript
if (noShowData.todayRisk > 2 || crmOpportunities.opportunities.length > 5) {
    systemStatus = 'warning';
} else if (noShowData.todayRisk > 0 || crmOpportunities.opportunities.length > 2) {
    systemStatus = 'good';
}
```

---

#### 4️⃣ **VALOR MONETARIO GENERADO** 💰

**TotalValueWidget** - Calcula valor total:

```javascript
totalValue = noShowsRecovered + crmGenerated + automationSavings
```

Donde:
- **noShowsRecovered**: No-shows evitados × ticket promedio
- **crmGenerated**: Clientes recuperados por CRM × ticket promedio
- **automationSavings**: Ahorro por automatización (actualmente 0)

**Fuentes de valor:**
- Prevención no-shows: X% del valor
- Recuperación CRM: Y% del valor
- Automatización: Z% del valor

---

## 👥 **CRM ACTUAL (CRMSimple.jsx + CRMService.js)**

### ✅ **SEGMENTACIÓN DE CLIENTES:**

#### **Segmentos automáticos** (función `determineCustomerSegment`):

1. **NUEVO** 🆕
   - Sin visitas o < 7 días desde primera visita
   
2. **ACTIVO** ✅
   - Última visita ≤ 30 días
   
3. **BIB (VIP)** ⭐
   - ≥ 10 visitas totales
   - Prioridad máxima
   
4. **RIESGO** ⚠️
   - Última visita entre 30-45 días
   - Cliente regular que empieza a alejarse
   
5. **INACTIVO** 💤
   - Última visita > 60 días
   - Requiere reactivación

**Configuración dinámica:** Se pueden ajustar los umbrales desde `crmConfig`

---

### ✅ **CÁLCULO DE RIESGO DE CHURN:**

**Función:** `calculateChurnRisk()` (en CRMService.js y MLEngine.js)

**Factores considerados:**

1. **Recencia (40-50% del score):**
   - \> 90 días sin visita: +40 puntos
   - \> 60 días: +25-30 puntos
   - \> 30 días: +10-15 puntos

2. **Tendencia de frecuencia (30%):**
   - Comparación últimos 90 días vs 90 anteriores
   - Si drop > 50%: +30 puntos
   - Si drop > 25%: +15 puntos

3. **Valor histórico (20%):**
   - < 100€: +20 puntos
   - < 300€: +10 puntos

4. **Frecuencia (10%):**
   - < 3 visitas: +10 puntos
   - < 6 visitas: +5 puntos

**Score final:** 0-100 (limitado)

---

### ✅ **CÁLCULO DE LTV (Lifetime Value):**

**Función:** `calculatePredictedLTV()`

**Fórmulas:**

1. **LTV Básico:**
```javascript
avgTicket × 12 (estimación anual)
```

2. **LTV Avanzado (MLEngine):**
```javascript
avgSpend × visitFrequency × expectedLifetime × retentionFactor
```

---

### ✅ **TIPOS DE ALERTAS CRM:**

**Tabla:** `crm_suggestions`

**5 tipos de alertas automáticas:**

1. **WELCOME** 🎉
   - **Trigger:** Cliente nuevo hace primera reserva
   - **Mensaje:** "Gracias por visitarnos. 10% en tu próxima visita"
   - **Objetivo:** Fidelizar desde el inicio

2. **VIP** ⭐
   - **Trigger:** Cliente alcanza 5+ visitas
   - **Mensaje:** "Eres especial para nosotros. Reserva prioritaria y sorpresas"
   - **Objetivo:** Reconocer y premiar lealtad

3. **RISK** ⚠️
   - **Trigger:** Cliente regular sin venir en 30+ días
   - **Mensaje:** "Te echamos de menos. Postre gratis si vuelves esta semana"
   - **Objetivo:** Prevenir churn

4. **REACTIVATION** 🔄
   - **Trigger:** Cliente inactivo 60+ días
   - **Mensaje:** "Oferta especial para traerte de vuelta"
   - **Objetivo:** Recuperar clientes perdidos

5. **BIRTHDAY** 🎂
   - **Trigger:** 3 días antes del cumpleaños
   - **Mensaje:** "Feliz cumpleaños. Sorpresa especial"
   - **Objetivo:** Crear momento memorable

---

### ✅ **WORKFLOW CRM:**

```
DETECCIÓN AUTOMÁTICA
      ↓
crm_suggestions (status: pending)
      ↓
DASHBOARD CRM muestra alertas
      ↓
Usuario revisa y aprueba
      ↓
Envío por WhatsApp/Email/SMS
      ↓
Tracking de respuesta
      ↓
Actualización de métricas
```

---

## 🧠 **ML ENGINE (Machine Learning)**

### ✅ **FUNCIONALIDADES EXISTENTES:**

#### **Segmentación inteligente:**
- `segmentCustomers()`: Segmentación multidimensional
- Factores: baseSegment, behaviorScore, valueScore, churnRisk
- Output: Segmento + confianza + acciones recomendadas

#### **Predicciones:**
- `calculateNextVisitProbability()`: Probabilidad de próxima visita
- `predictDemand()`: Predicción de demanda futura
- `detectAnomalies()`: Detección de anomalías en datos

#### **Scores calculados:**
- **Behavior Score:** Frecuencia, recencia, engagement
- **Value Score:** Gasto promedio, LTV
- **Churn Risk:** Probabilidad de abandono

---

## 🗄️ **BASE DE DATOS SUPABASE**

### ✅ **TABLAS RELACIONADAS:**

#### `customers`
- `visits_count`: Número de visitas
- `total_spent`: Gasto total
- `avg_ticket`: Ticket promedio
- `last_visit_at`: Última visita
- `churn_risk_score`: Score de riesgo (0-100)
- `predicted_ltv`: LTV predicho
- `segment_auto`: Segmento automático

#### `reservations`
- `status`: confirmed, completed, cancelled, no_show
- `spend_amount`: Gasto real (si disponible)
- `party_size`: Número de comensales

#### `noshow_actions`
- `reservation_date`: Fecha de la reserva
- `risk_score`: Score de riesgo de no-show
- `customer_response`: confirmed, no_response, cancelled
- `prevented_noshow`: Boolean
- `final_outcome`: came, no_show, cancelled

#### `crm_suggestions`
- `type`: welcome, vip, risk, reactivation, birthday
- `status`: pending, sent, completed
- `priority`: high, normal, low
- `metadata`: JSON con info adicional

---

## 📊 **FUNCIONES SUPABASE:**

### ✅ **Funciones existentes:**

1. **`compute_customer_stats(customer_id, restaurant_id)`**
   - Calcula: visits_count, total_spent, avg_ticket
   - Calcula: last_visit_at, churn_risk, predicted_ltv
   - Retorna: JSON con todas las estadísticas

2. **`recompute_customer_segment(customer_id, restaurant_id)`**
   - Determina segmento automático
   - Basado en: visitas, última visita, días transcurridos
   - Actualiza: `segment_auto` en customers

---

## 💡 **RESUMEN DE CAPACIDADES ACTUALES:**

### ✅ **LO QUE FUNCIONA BIEN:**

1. ✅ **No-shows tracking completo** con tabla dedicada
2. ✅ **Segmentación automática** de clientes (5 segmentos)
3. ✅ **Cálculo de churn risk** con múltiples factores
4. ✅ **Alertas CRM automáticas** (5 tipos)
5. ✅ **Valor monetario** calculado en tiempo real
6. ✅ **Sistema de semáforo** para estado general
7. ✅ **LTV prediction** básico y avanzado
8. ✅ **Funciones SQL** para estadísticas automáticas

### ⚠️ **LO QUE FALTA O NO SE USA:**

1. ❌ **No hay tracking de conversaciones** del agente
2. ❌ **No hay predicción de no-shows** (solo histórico)
3. ❌ **No hay análisis de canales** (WhatsApp vs teléfono)
4. ❌ **No hay rendimiento del agente IA** (métricas)
5. ❌ **No hay ingresos por reserva** (solo avg_ticket general)
6. ❌ **No hay comparativas temporales** (hoy vs ayer vs semana)
7. ❌ **No hay ocupación %** calculada en tiempo real

---

## 🎯 **CONCLUSIONES PARA EL NUEVO DASHBOARD:**

### ✅ **PODEMOS USAR YA (datos reales):**

1. **Reservas hoy** ← `reservations` WHERE date = today
2. **Ocupación %** ← (reservas × avg party_size) / capacidad
3. **Clientes nuevos vs habituales** ← `customers.visits_count`
4. **No-shows de hoy** ← `noshow_actions` WHERE date = today
5. **Comparación semanal** ← COUNT esta semana vs semana pasada
6. **Cumpleaños** ← `customers` WHERE birthday = today
7. **Alertas CRM** ← `crm_suggestions` WHERE status = pending
8. **Valor generado** ← (no-shows evitados + CRM) × avg_ticket

### ❌ **NO PODEMOS USAR (requiere implementación):**

1. **Predicción de no-shows** → Requiere algoritmo ML
2. **Tasa de éxito del agente** → Requiere tracking de conversaciones
3. **Análisis de canales** → Requiere campo `source` en reservations
4. **Ingresos estimados** → Requiere precios por reserva
5. **Rendimiento del agente** → Requiere logs de actividad

---

## 🚀 **RECOMENDACIÓN FINAL:**

**FASE 1 MVP es totalmente factible con los datos actuales:**
- Avatar del agente saludando ✅
- 5-6 métricas clave del día ✅
- Botones de acción (usar alertas CRM existentes) ✅
- Comparativas simples (esta semana vs anterior) ✅
- Todo con **DATOS REALES de Supabase** ✅

**No necesitamos inventar nada. Todo lo esencial ya existe.** 💯

---



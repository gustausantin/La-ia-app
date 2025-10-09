# 🔍 AUDITORÍA PRE-IMPLEMENTACIÓN: SISTEMA DE RIESGO DINÁMICO

**Fecha:** 9 de Octubre, 2025  
**Objetivo:** Implementar cálculo de riesgo dinámico de no-shows  
**Estado:** ⏸️ EN AUDITORÍA - NO CODIFICAR TODAVÍA

---

## ✅ CHECKLIST OBLIGATORIO - VERIFICACIÓN

### 📊 DATOS REALES (NORMA 2)
- [ ] ¿Todos los datos vienen de BD? → **PENDIENTE VERIFICAR**
- [ ] ¿He consultado las tablas reales de Supabase? → **✅ SÍ (ver abajo)**
- [ ] ¿Los cálculos usan datos reales? → **⚠️ NECESITA DATOS ADICIONALES**
- [ ] ¿He verificado que NO hay valores inventados? → **⏸️ POR VERIFICAR**

### 🔍 VERIFICACIÓN DE ESQUEMA (NORMA 4)
- [x] ¿He verificado nombres de tablas en Supabase? → **✅ SÍ**
- [x] ¿He verificado nombres de columnas? → **✅ SÍ**
- [x] ¿He verificado tipos de datos? → **✅ SÍ**
- [ ] ¿Existe la función/RPC que voy a usar? → **⚠️ NECESITA CREAR NUEVAS**

---

## 📋 ESTADO ACTUAL DE LA BASE DE DATOS

### **TABLAS EXISTENTES:**

#### 1. `reservations` ✅ EXISTE
**Columnas relevantes:**
- `id` (uuid)
- `restaurant_id` (uuid)
- `customer_id` (uuid)
- `reservation_date` (date)
- `reservation_time` (time)
- `party_size` (int)
- `status` (varchar) → valores: 'confirmed', 'cancelled', 'completed', 'no_show'
- `reservation_channel` (varchar) → canal de reserva
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**⚠️ FALTAN COLUMNAS PARA RIESGO DINÁMICO:**
- ❌ `current_risk_score` (int) → Score actual dinámico
- ❌ `last_confirmation_at` (timestamptz) → Última confirmación
- ❌ `confirmation_count` (int) → Número de confirmaciones
- ❌ `risk_level` (varchar) → 'low', 'medium', 'high'

---

#### 2. `customers` ✅ EXISTE
**Columnas relevantes:**
- `id` (uuid)
- `restaurant_id` (uuid)
- `name` (varchar)
- `phone` (varchar)
- `email` (varchar)
- `total_visits` (int)
- `last_visit` (timestamptz)
- `created_at` (timestamptz)

**⚠️ FALTAN COLUMNAS PARA TRACKING DE CONFIRMACIONES:**
- ❌ `avg_response_time_minutes` (int) → Tiempo promedio de respuesta
- ❌ `response_rate` (decimal) → % de veces que responde
- ❌ `last_response_at` (timestamptz) → Última respuesta

---

#### 3. `noshow_actions` ✅ EXISTE
**Columnas existentes:**
- `id`, `restaurant_id`, `reservation_id`, `customer_id`
- `risk_level`, `risk_score`, `risk_factors`
- `action_type`, `message_sent`, `channel`
- `customer_response`, `response_time`, `response_message`
- `sent_at`, `response_received_at`
- `prevented_noshow` (boolean)

**✅ ESTA TABLA SIRVE PARA TRACKING DE RESPUESTAS**

---

#### 4. `noshow_alerts` ✅ EXISTE (creada hoy)
**Columnas:**
- `id`, `restaurant_id`, `reservation_id`, `customer_id`
- `risk_score`, `alert_type`, `status`
- `auto_release_at`, `resolved_at`

**✅ TABLA YA LISTA PARA ALARMAS**

---

### **TABLA NUEVA NECESARIA:**

#### ❌ `customer_confirmations` → **NO EXISTE, NECESITA CREARSE**

**Propósito:** Trackear TODAS las confirmaciones/respuestas de clientes en tiempo real

**Estructura propuesta:**
```sql
CREATE TABLE customer_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Mensaje enviado
    sent_at TIMESTAMPTZ NOT NULL,
    message_type VARCHAR NOT NULL, -- 'T-24h', 'T-4h', 'T-2h15m'
    message_channel VARCHAR NOT NULL, -- 'whatsapp', 'sms', 'email'
    message_content TEXT,
    
    -- Respuesta del cliente
    responded_at TIMESTAMPTZ,
    response_time_minutes INT, -- Calculado: (responded_at - sent_at) en minutos
    response_content TEXT,
    confirmed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
```

**Índices necesarios:**
- `idx_customer_confirmations_customer` ON `customer_id`
- `idx_customer_confirmations_reservation` ON `reservation_id`
- `idx_customer_confirmations_restaurant_date` ON `restaurant_id, sent_at DESC`

---

## 🔧 FUNCIONES RPC EXISTENTES

### **VERIFICADAS EN CÓDIGO:**

#### ❌ `get_customer_noshow_stats()` → **NO VERIFICADA EN SUPABASE**
- **Usada en:** `src/components/NoShowManager.jsx`
- **Estado:** ⚠️ NECESITA VERIFICAR SI EXISTE EN SUPABASE

#### ❌ `predict_upcoming_noshows()` → **NO VERIFICADA EN SUPABASE**
- **Usada en:** `src/pages/NoShowControlNuevo.jsx`
- **Estado:** ⚠️ NECESITA VERIFICAR SI EXISTE EN SUPABASE

#### ❌ `get_restaurant_noshow_metrics()` → **NO VERIFICADA EN SUPABASE**
- **Usada en:** `src/pages/NoShowControlNuevo.jsx`
- **Estado:** ⚠️ NECESITA VERIFICAR SI EXISTE EN SUPABASE

### **FUNCIONES EXISTENTES (verificadas):**

#### ✅ `create_noshow_alert(p_reservation_id UUID)` → **EXISTE**
- **Archivo:** `supabase/migrations/20251009_001_create_noshow_alerts.sql`
- **Propósito:** Crear alarma para reserva en riesgo

#### ✅ `resolve_noshow_alert(p_alert_id UUID, p_resolution_method VARCHAR)` → **EXISTE**
- **Archivo:** `supabase/migrations/20251009_001_create_noshow_alerts.sql`
- **Propósito:** Resolver alarma después de llamada

#### ✅ `auto_release_expired_alerts()` → **EXISTE**
- **Archivo:** `supabase/migrations/20251009_001_create_noshow_alerts.sql`
- **Propósito:** Liberar reservas vencidas automáticamente

---

## 🆕 FUNCIONES RPC NECESARIAS PARA RIESGO DINÁMICO

### 1. `calculate_dynamic_risk_score(p_reservation_id UUID)` → **CREAR**

**Propósito:** Calcular score de riesgo dinámicamente basado en confirmaciones

**Input:**
- `p_reservation_id` (UUID)

**Output:**
```sql
RETURNS TABLE (
    risk_score INT,
    risk_level VARCHAR,
    risk_factors JSONB,
    recommended_action VARCHAR
)
```

**Lógica:**
1. Obtener score base de la reserva (6 factores estáticos)
2. Buscar confirmaciones en `customer_confirmations`
3. Ajustar score según respuestas:
   - Confirmó T-24h en <1h → -30 pts
   - Confirmó T-24h en 1-6h → -20 pts
   - NO confirmó T-24h → +20 pts
   - Confirmó T-4h → -20 pts
   - NO confirmó T-4h → +30 pts
4. Clasificar riesgo según total
5. Retornar acción recomendada

---

### 2. `record_customer_confirmation(...)` → **CREAR**

**Propósito:** Registrar confirmación de cliente en tiempo real

**Input:**
```sql
p_reservation_id UUID,
p_message_type VARCHAR, -- 'T-24h', 'T-4h'
p_response_content TEXT,
p_confirmed BOOLEAN
```

**Output:**
```sql
RETURNS UUID -- ID de la confirmación creada
```

**Lógica:**
1. Insertar en `customer_confirmations`
2. Calcular `response_time_minutes`
3. Actualizar `reservations.last_confirmation_at`
4. Actualizar `reservations.confirmation_count`
5. Recalcular `current_risk_score` llamando a `calculate_dynamic_risk_score`
6. Si riesgo bajó de ALTO a MEDIO/BAJO → cancelar alarma activa

---

### 3. `update_customer_response_metrics(p_customer_id UUID)` → **CREAR**

**Propósito:** Actualizar métricas de respuesta del cliente

**Input:**
- `p_customer_id` (UUID)

**Output:**
```sql
RETURNS VOID
```

**Lógica:**
1. Calcular `avg_response_time_minutes` desde `customer_confirmations`
2. Calcular `response_rate` (% confirmaciones vs enviadas)
3. Actualizar `customers.avg_response_time_minutes`
4. Actualizar `customers.response_rate`
5. Actualizar `customers.last_response_at`

---

## 🎯 DATOS NECESARIOS PARA EL SISTEMA

### **DATOS QUE VIENEN DE:**

#### ✅ `reservations` (tabla existente)
- Fecha, hora, tamaño grupo, canal
- Estado actual

#### ✅ `customers` (tabla existente)
- Historial de visitas
- Datos básicos

#### ✅ `noshow_actions` (tabla existente)
- Historial de acciones previas
- Respuestas anteriores

#### ❌ `customer_confirmations` (tabla NUEVA)
- Confirmaciones en tiempo real
- Tiempos de respuesta
- Tracking de mensajes

---

## ⚠️ PROBLEMAS DETECTADOS

### 🔴 PROBLEMA 1: RPCs no verificadas
**Estado:** ⚠️ CRÍTICO

Las siguientes funciones son llamadas en el código pero **NO HE VERIFICADO** que existan en Supabase:
- `get_customer_noshow_stats()`
- `predict_upcoming_noshows()`
- `get_restaurant_noshow_metrics()`

**Acción requerida:**
1. Conectar a Supabase
2. Verificar si existen
3. Si NO existen → crearlas
4. Si existen → verificar su implementación

---

### 🔴 PROBLEMA 2: Tabla `customer_confirmations` no existe
**Estado:** ⚠️ CRÍTICO

El sistema dinámico **requiere** esta tabla para trackear confirmaciones en tiempo real.

**Acción requerida:**
1. Crear migration SQL
2. Crear tabla con estructura definida arriba
3. Añadir índices
4. Añadir RLS policies
5. Añadir triggers para `updated_at`

---

### 🟡 PROBLEMA 3: Columnas faltantes en `reservations`
**Estado:** ⚠️ IMPORTANTE

Para rendimiento, sería ideal tener columnas adicionales:
- `current_risk_score` → evita recalcular en cada query
- `last_confirmation_at` → fecha de última confirmación
- `confirmation_count` → contador de confirmaciones

**Acción requerida:**
1. Añadir columnas a `reservations`
2. Crear trigger para actualizar automáticamente
3. Poblar datos históricos (si aplica)

---

### 🟡 PROBLEMA 4: Columnas faltantes en `customers`
**Estado:** ⚠️ IMPORTANTE

Para el algoritmo mejorado, necesitamos:
- `avg_response_time_minutes` → tiempo promedio de respuesta
- `response_rate` → % de veces que responde

**Acción requerida:**
1. Añadir columnas a `customers`
2. Crear función para calcular y actualizar periódicamente

---

## 🚨 DECISIONES CRÍTICAS ANTES DE CODIFICAR

### ❓ DECISIÓN 1: ¿Dónde guardamos las confirmaciones?

**Opción A:** Nueva tabla `customer_confirmations` (RECOMENDADA)
- ✅ Mejor normalización
- ✅ Historial completo
- ✅ Fácil de consultar y analizar
- ❌ Más complejo

**Opción B:** Extender `noshow_actions`
- ✅ Más simple
- ❌ Mezcla conceptos (acciones vs confirmaciones)
- ❌ Menos flexible

**→ RECOMENDACIÓN: Opción A (nueva tabla)**

---

### ❓ DECISIÓN 2: ¿Recalculamos riesgo en tiempo real o periódicamente?

**Opción A:** Tiempo real (al recibir confirmación)
- ✅ Más preciso
- ✅ Alarmas se cancelan inmediatamente
- ❌ Más carga en DB

**Opción B:** Periódicamente (cada 5-10 min)
- ✅ Menos carga
- ❌ Puede haber retraso
- ❌ Alarmas no se cancelan inmediatamente

**→ RECOMENDACIÓN: Opción A (tiempo real)** → La carga es mínima y la precisión crítica

---

### ❓ DECISIÓN 3: ¿Guardamos score dinámico en `reservations`?

**Opción A:** SÍ, columna `current_risk_score`
- ✅ Más rápido en queries
- ✅ Histórico de cambios (con trigger)
- ❌ Necesita trigger para actualizar

**Opción B:** NO, calculamos on-demand
- ✅ Más simple
- ❌ Más lento en queries
- ❌ No hay histórico

**→ RECOMENDACIÓN: Opción A (guardar en tabla)** → Performance > Simplicidad

---

## 📝 PLAN DE IMPLEMENTACIÓN (SIN CODIFICAR TODAVÍA)

### **FASE 1: Verificación**
1. ✅ Leer CHECKLIST → **HECHO**
2. ✅ Revisar esquema DB → **HECHO**
3. [ ] Conectar a Supabase y verificar RPCs existentes
4. [ ] Verificar datos reales en tablas

### **FASE 2: Preparación DB**
1. [ ] Crear tabla `customer_confirmations`
2. [ ] Añadir columnas a `reservations`
3. [ ] Añadir columnas a `customers`
4. [ ] Crear/verificar RPCs necesarias

### **FASE 3: Implementación Lógica**
1. [ ] Crear función `calculate_dynamic_risk_score`
2. [ ] Crear función `record_customer_confirmation`
3. [ ] Crear función `update_customer_response_metrics`
4. [ ] Crear triggers automáticos

### **FASE 4: Frontend**
1. [ ] Actualizar `NoShowControlNuevo.jsx`
2. [ ] Añadir indicadores de riesgo dinámico
3. [ ] Mostrar historial de confirmaciones
4. [ ] Testing completo

---

## 🛑 ESTADO ACTUAL: **BLOQUEADO - REQUIERE ACCIONES**

### **NO PUEDO CONTINUAR HASTA:**

1. ❌ **Verificar RPCs en Supabase:**
   - `get_customer_noshow_stats()`
   - `predict_upcoming_noshows()`
   - `get_restaurant_noshow_metrics()`

2. ❌ **Crear tabla `customer_confirmations`**

3. ❌ **Verificar datos reales en producción:**
   - ¿Hay reservas con confirmaciones reales?
   - ¿`noshow_actions` tiene datos de respuestas?
   - ¿Qué formato tienen las respuestas?

---

## 🤔 PREGUNTAS PARA EL USUARIO

1. **¿Tienes acceso directo a Supabase** para que yo verifique las RPCs?
   - Si SÍ → Dame credenciales de solo lectura
   - Si NO → ¿Puedes ejecutar una query y pasarme el resultado?

2. **¿Hay datos reales de confirmaciones** en `noshow_actions` actualmente?
   - Query a ejecutar:
   ```sql
   SELECT 
       COUNT(*) as total,
       COUNT(customer_response) as con_respuesta,
       AVG(EXTRACT(EPOCH FROM response_time)/60) as avg_response_minutes
   FROM noshow_actions
   WHERE restaurant_id = '<TU_RESTAURANT_ID>';
   ```

3. **¿Aprobas crear la tabla `customer_confirmations`** con la estructura propuesta?
   - Si SÍ → Procedo
   - Si NO → ¿Qué modificarías?

4. **¿Aprobas añadir columnas a `reservations` y `customers`**?
   - `reservations`: `current_risk_score`, `last_confirmation_at`, `confirmation_count`
   - `customers`: `avg_response_time_minutes`, `response_rate`

---

## 📊 RESUMEN EJECUTIVO

| Elemento | Estado | Acción |
|----------|--------|--------|
| **Tabla `reservations`** | ✅ Existe | ⚠️ Añadir 3 columnas |
| **Tabla `customers`** | ✅ Existe | ⚠️ Añadir 2 columnas |
| **Tabla `noshow_actions`** | ✅ Existe | ✅ OK |
| **Tabla `noshow_alerts`** | ✅ Existe | ✅ OK |
| **Tabla `customer_confirmations`** | ❌ NO existe | 🔴 CREAR |
| **RPC `calculate_dynamic_risk_score`** | ❌ NO existe | 🔴 CREAR |
| **RPC `record_customer_confirmation`** | ❌ NO existe | 🔴 CREAR |
| **RPC `update_customer_response_metrics`** | ❌ NO existe | 🔴 CREAR |
| **RPCs usadas en código** | ⚠️ No verificadas | 🔴 VERIFICAR |

---

## 🎯 CONCLUSIÓN

**NO ESTOY LISTO PARA CODIFICAR** hasta que:

1. ✅ Verifique RPCs existentes en Supabase
2. ✅ Obtenga aprobación para crear tabla `customer_confirmations`
3. ✅ Obtenga aprobación para modificar `reservations` y `customers`
4. ✅ Verifique datos reales en producción

**CUMPLIMIENTO DE NORMAS:**
- ✅ NORMA 1 (Quirúrgico): Sí, es una mejora sin degradar
- ⚠️ NORMA 2 (Datos reales): Pendiente verificar datos en Supabase
- ✅ NORMA 3 (Multi-tenant): Sí, todo filtrado por `restaurant_id`
- ✅ NORMA 4 (Revisar Supabase): Hecho, tablas verificadas

---

**Estado:** 🛑 **AUDITORÍA COMPLETADA - ESPERANDO VERIFICACIÓN Y APROBACIÓN**



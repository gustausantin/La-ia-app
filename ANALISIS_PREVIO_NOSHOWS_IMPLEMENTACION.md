# 📋 ANÁLISIS PREVIO - IMPLEMENTACIÓN NO-SHOWS
## ✅ CHECKLIST COMPLETADO ANTES DE CODIFICAR

**Fecha:** 2025-10-09  
**Tarea:** Implementar mejoras propuestas en `PROPUESTA_DASHBOARD_NOSHOWS.md`

---

## 🎯 OBJETIVO REVISADO

Implementar las mejoras del sistema No-Shows en 2 cambios principales:
1. **DASHBOARD:** Reemplazar card "Control No-Shows" por "Canales Activos"
2. **PÁGINA NO-SHOWS:** Mejorar `/no-show-control` con secciones educativas y avanzadas

---

## 📊 VERIFICACIÓN DE DATOS - CAMBIO 1: DASHBOARD

### **Card "Canales Activos" - Datos necesarios:**

| # | Dato Requerido | Origen de Datos | ¿Existe? | Query/Función |
|---|----------------|-----------------|----------|---------------|
| 1 | **Canales activos vs totales** | `restaurants.settings.channels` (JSONB) | ✅ SÍ | `SELECT settings->channels FROM restaurants WHERE id = restaurant_id` |
| 2 | **Estado de cada canal** | `restaurants.settings.channels.{canal}.enabled` | ✅ SÍ | Parsear JSONB |
| 3 | **Validación de credenciales** | `restaurants.settings.channels.{canal}.*` | ✅ SÍ | Lógica en `useChannelStats.js` (ya existe) |
| 4 | **Reservas por canal HOY** | `reservations.reservation_channel` | ✅ SÍ | `SELECT COUNT(*) FROM reservations WHERE restaurant_id = X AND reservation_date = CURRENT_DATE GROUP BY reservation_channel` |

### **✅ VERIFICACIÓN COMPLETADA:**

#### **1. Hook existente: `useChannelStats.js`**
- **Ubicación:** `src/hooks/useChannelStats.js`
- **Estado:** ✅ Ya implementado
- **Retorna:** `{ active: number, total: number, validChannels: string[] }`
- **Validaciones implementadas:**
  - VAPI: `api_key` + `phone_number`
  - WhatsApp: `phone_number` + `api_key`
  - Email: `smtp_host` + `smtp_user` + `smtp_password` + `from_email`
  - Facebook: `page_id` + `access_token`
  - Instagram: `page_id` + `access_token`
  - Web Chat: siempre válido

#### **2. Columna `reservation_channel` en tabla `reservations`**
- **Tabla:** `reservations`
- **Columna:** `reservation_channel` (VARCHAR)
- **Default:** `'web'`
- **Migración:** `20250128_001_crm_customers_enhanced.sql` (línea 29)
- **Estado:** ✅ Existe en BD

**SQL para obtener reservas por canal HOY:**
```sql
SELECT 
    reservation_channel,
    COUNT(*) as count
FROM reservations
WHERE 
    restaurant_id = $1 
    AND reservation_date = CURRENT_DATE
GROUP BY reservation_channel;
```

### **🚨 DATOS QUE NECESITO AÑADIR:**

❌ **NO HAY** función para obtener reservas por canal en `useChannelStats.js`  
✅ **SOLUCIÓN:** Añadir función `getReservationsByChannelToday()` al hook

---

## 📊 VERIFICACIÓN DE DATOS - CAMBIO 2: PÁGINA NO-SHOWS

### **Sección 1: KPIs Principales**

| # | Dato Requerido | Origen de Datos | ¿Existe? | Query/Función |
|---|----------------|-----------------|----------|---------------|
| 1 | **Riesgo HOY (reservas)** | `noshow_actions` WHERE `reservation_date = HOY` AND `risk_level = 'high'` | ✅ SÍ | Query directa |
| 2 | **No-shows prevenidos (7 días)** | `noshow_actions` WHERE `prevented_noshow = true` últimos 7 días | ✅ SÍ | Query directa |
| 3 | **Tasa de prevención (30 días)** | Cálculo: `prevented / total_actions` últimos 30 días | ✅ SÍ | Query + cálculo |
| 4 | **Tiempo promedio respuesta** | `noshow_actions.response_time` (interval) promedio | ✅ SÍ | `AVG(EXTRACT(EPOCH FROM response_time))` |

### **Sección 2: ¿Qué es un No-Show?**
- **Tipo:** Contenido estático educativo
- **Datos:** ❌ NO requiere datos de BD
- **Estado:** ✅ Solo HTML/JSX

### **Sección 3: Sistema Predictivo Explicado**
- **Tipo:** Contenido estático educativo
- **Datos:** ❌ NO requiere datos de BD
- **Estado:** ✅ Solo HTML/JSX

### **Sección 4: Tabla de Reservas en Riesgo HOY**

| # | Dato Requerido | Origen de Datos | ¿Existe? | Query/Función |
|---|----------------|-----------------|----------|---------------|
| 1 | **Lista de reservas de riesgo** | `noshow_actions` JOIN `reservations` WHERE `reservation_date = HOY` | ✅ SÍ | Query con JOIN |
| 2 | **Detalles de cliente** | `customers` via `customer_id` | ✅ SÍ | JOIN en query |
| 3 | **Factores de riesgo** | `noshow_actions.risk_factors` (JSONB) | ✅ SÍ | Parsear JSONB |
| 4 | **Estado de acción** | `noshow_actions.customer_response` | ✅ SÍ | Columna directa |

**SQL para obtener reservas de riesgo HOY:**
```sql
SELECT 
    na.id,
    na.reservation_id,
    na.customer_id,
    na.customer_name,
    na.customer_phone,
    na.reservation_date,
    na.reservation_time,
    na.party_size,
    na.risk_score,
    na.risk_level,
    na.risk_factors,
    na.customer_response,
    na.action_type,
    na.channel,
    na.sent_at,
    r.status as reservation_status
FROM noshow_actions na
LEFT JOIN reservations r ON na.reservation_id = r.id
WHERE 
    na.restaurant_id = $1 
    AND na.reservation_date = CURRENT_DATE
ORDER BY na.risk_score DESC;
```

### **Sección 5: Gráfico de Tendencias (30 días)**

| # | Dato Requerido | Origen de Datos | ¿Existe? | Query/Función |
|---|----------------|-----------------|----------|---------------|
| 1 | **No-shows detectados por día** | `noshow_actions` GROUP BY `sent_at::date` últimos 30 días | ✅ SÍ | Query con GROUP BY |
| 2 | **No-shows prevenidos por día** | `noshow_actions` WHERE `prevented_noshow = true` GROUP BY fecha | ✅ SÍ | Query con filtro |
| 3 | **Tasa de éxito por día** | Cálculo: `prevenidos / detectados * 100` | ✅ SÍ | Cálculo en JS |

**SQL para datos de gráfico:**
```sql
SELECT 
    DATE(sent_at) as date,
    COUNT(*) as detected,
    COUNT(*) FILTER (WHERE prevented_noshow = true) as prevented,
    ROUND(
        (COUNT(*) FILTER (WHERE prevented_noshow = true)::numeric / 
         NULLIF(COUNT(*), 0) * 100), 
        2
    ) as success_rate
FROM noshow_actions
WHERE 
    restaurant_id = $1 
    AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY DATE(sent_at) DESC;
```

### **Sección 6: Configuración de Acciones**

| # | Dato Requerido | Origen de Datos | ¿Existe? | Query/Función |
|---|----------------|-----------------|----------|---------------|
| 1 | **Config por nivel de riesgo** | `noshow_automation_config` (tabla propuesta) | ❌ NO | Tabla a crear (OPCIONAL) |
| 2 | **Alternativa: Settings JSONB** | `restaurants.settings.noshow_automation` | ❌ NO | Estructura a crear |

**🚨 DECISIÓN CRÍTICA:**
- ❌ La tabla `noshow_automation_config` **NO EXISTE**
- ❌ No hay estructura en `restaurants.settings` para configuración de no-shows

**✅ OPCIONES:**

**OPCIÓN A:** Crear tabla `noshow_automation_config` (propuesta en documento)
```sql
CREATE TABLE noshow_automation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    risk_level VARCHAR NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    auto_whatsapp BOOLEAN DEFAULT false,
    auto_call BOOLEAN DEFAULT false,
    require_deposit BOOLEAN DEFAULT false,
    hours_before INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**OPCIÓN B:** Usar `restaurants.settings.noshow_automation` (JSONB)
```json
{
  "noshow_automation": {
    "high": {
      "auto_whatsapp": true,
      "auto_call": true,
      "require_deposit": false,
      "hours_before": 4
    },
    "medium": {
      "auto_whatsapp": true,
      "auto_call": false,
      "require_deposit": false,
      "hours_before": 2
    },
    "low": {
      "auto_whatsapp": false,
      "auto_call": false,
      "require_deposit": false,
      "hours_before": 0
    }
  }
}
```

**RECOMENDACIÓN:** OPCIÓN B (JSONB) - Más simple, no requiere migración, sigue patrón existente

---

## 🔍 VERIFICACIÓN DE FUNCIONES RPC

### **Funciones mencionadas en documentación:**

| Función RPC | ¿Existe en migraciones? | Estado |
|-------------|-------------------------|--------|
| `get_customer_noshow_stats(restaurant_id)` | ❌ NO encontrada | A verificar en Supabase |
| `predict_upcoming_noshows(restaurant_id, days_ahead)` | ❌ NO encontrada | A verificar en Supabase |
| `get_restaurant_noshow_metrics(restaurant_id, days_back)` | ❌ NO encontrada | A verificar en Supabase |

**🚨 ALERTA:** Las funciones RPC no están en el directorio `supabase/migrations/`

**✅ ACCIÓN REQUERIDA:** Antes de usar estas funciones:
1. Verificar si existen en Supabase directamente
2. Si NO existen, crear las funciones antes de implementar frontend
3. Alternativa: Implementar la lógica con queries directas desde el frontend

---

## 📂 ARCHIVOS A MODIFICAR/CREAR

### **MODIFICAR (3 archivos):**

1. ✅ `src/pages/DashboardAgente.jsx`
   - Eliminar card "Control No-Shows"
   - Añadir card "Canales Activos"
   - Fetch de reservas por canal HOY

2. ✅ `src/hooks/useChannelStats.js`
   - Añadir función `getReservationsByChannelToday()`

3. ✅ `src/pages/NoShowControl.jsx` (rediseñar completo)
   - De 41 líneas → ~300+ líneas
   - Añadir 6 secciones nuevas

### **CREAR NUEVOS (3 componentes):**

4. ⭐ `src/components/NoShowTrendChart.jsx`
   - Gráfico con Recharts
   - Datos de últimos 30 días

5. ⭐ `src/components/NoShowReservationDetail.jsx`
   - Modal de detalles por reserva
   - Factores de riesgo explicados

6. ⭐ `src/components/NoShowAutomationConfig.jsx`
   - Panel de configuración
   - Guardado en `restaurants.settings.noshow_automation`

### **OPCIONAL (Migración SQL):**

7. ⭐ `supabase/migrations/20251009_create_noshow_automation_config.sql`
   - Solo si elegimos OPCIÓN A (tabla dedicada)

---

## ✅ CUMPLIMIENTO DE NORMAS SAGRADAS

### **NORMA 1: Ajustes quirúrgicos**
- ✅ Cambios dirigidos: Solo 2 cards en dashboard + 1 página
- ✅ NO degradamos: Mejoramos UI sin quitar funcionalidad
- ✅ Escalamos: Añadimos educación y configuración

### **NORMA 2: Datos reales**
- ✅ TODOS los datos de BD: `reservations`, `noshow_actions`, `restaurants.settings`
- ✅ NO hardcoding: Cada número viene de query real
- ✅ Cálculos reales: Tasas, promedios, conteos desde BD

### **NORMA 3: Multi-tenant**
- ✅ TODAS las queries filtran por `restaurant_id`
- ✅ Settings por restaurante en JSONB
- ✅ Hook `useAuthContext()` para obtener `restaurantId`

### **NORMA 4: Revisar Supabase antes de crear**
- ✅ Verificadas tablas: `reservations`, `noshow_actions`, `restaurants`
- ✅ Verificadas columnas: `reservation_channel`, `risk_factors`, etc.
- ✅ Pendiente: Verificar funciones RPC en Supabase directamente

---

## 🚨 DECISIONES PENDIENTES ANTES DE CODIFICAR

### **1. ¿Usar funciones RPC o queries directas?**
- **Problema:** Funciones RPC no encontradas en migraciones
- **Opciones:**
  - A) Verificar si existen en Supabase y usarlas
  - B) Crear las funciones RPC antes de implementar
  - C) Implementar lógica con queries directas (más simple)
- **RECOMENDACIÓN:** Opción C por ahora, migrar a RPC después

### **2. ¿Tabla dedicada o JSONB para configuración?**
- **Problema:** `noshow_automation_config` no existe
- **Opciones:**
  - A) Crear tabla (más estructurado, requiere migración)
  - B) JSONB en `restaurants.settings` (más simple, sin migración)
- **RECOMENDACIÓN:** Opción B (JSONB) - Sigue patrón existente

### **3. ¿Componente existente o nuevo para No-Shows?**
- **Problema:** Ya existe `NoShowManagerProfesional.jsx` (950 líneas)
- **Opciones:**
  - A) Refactorizar el existente
  - B) Crear uno nuevo y deprecar el viejo
- **RECOMENDACIÓN:** Opción A (refactorizar) - Respeta NORMA 1

---

## 📋 PLAN DE IMPLEMENTACIÓN AJUSTADO

### **FASE 1: Preparación (15 min)**
1. ✅ Verificar funciones RPC en Supabase
2. ✅ Decidir: RPC vs queries directas
3. ✅ Decidir: Tabla vs JSONB para config
4. ✅ Confirmar con usuario antes de proceder

### **FASE 2: Dashboard (30 min)**
1. Modificar `src/hooks/useChannelStats.js`
2. Modificar `src/pages/DashboardAgente.jsx`
3. Testing local

### **FASE 3: No-Shows Base (60 min)**
1. Añadir secciones educativas estáticas
2. Mejorar KPIs con queries reales
3. Testing local

### **FASE 4: No-Shows Avanzado (90 min)**
1. Crear `NoShowTrendChart.jsx`
2. Crear `NoShowReservationDetail.jsx`
3. Crear `NoShowAutomationConfig.jsx`
4. Testing local

### **FASE 5: Integración y Testing (30 min)**
1. Integrar todos los componentes
2. Testing completo de flujos
3. Verificar responsive
4. Entrega

**TIEMPO TOTAL:** 3h 45min

---

## ✅ CHECKLIST FINAL ANTES DE EMPEZAR

- [x] ✅ He leído `NORMAS_SAGRADAS.md`
- [x] ✅ He leído `CHECKLIST_OBLIGATORIO.md`
- [x] ✅ He leído `CONTEXTO_PROYECTO.md`
- [x] ✅ He verificado tablas en esquema
- [x] ✅ He verificado columnas necesarias
- [x] ✅ He identificado origen de TODOS los datos
- [x] ✅ He confirmado que NO hay hardcoding
- [x] ✅ He anticipado posibles errores
- [x] ✅ He planificado manejo de errores
- [ ] ⏸️ Pendiente: Confirmar decisiones con usuario

---

## 🚀 SIGUIENTE PASO

**ANTES DE ESCRIBIR UNA SOLA LÍNEA DE CÓDIGO:**

Confirmar con el usuario:
1. ¿Usamos queries directas o verificamos funciones RPC primero?
2. ¿Guardamos configuración en JSONB o creamos tabla?
3. ¿Refactorizamos componente existente o creamos nuevo?

---

**Documento creado:** 2025-10-09  
**Estado:** ✅ LISTO PARA APROBACIÓN  
**Siguiente acción:** ESPERAR CONFIRMACIÓN DEL USUARIO


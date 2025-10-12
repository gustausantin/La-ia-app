# 🔧 FIX: Contador de Reservas Manuales en Dashboard

**Fecha:** 12 de Octubre 2025  
**Tipo:** Corrección de bug crítico  
**Prioridad:** 🔴 ALTA  
**Archivos Modificados:**
- `src/components/reservas/ReservationWizard.jsx`
- `supabase/migrations/20251012_006_fix_manual_reservations_channel.sql`

---

## 🐛 PROBLEMA DETECTADO

**Síntoma:**  
El widget "Canales Activos" en el Dashboard **NO estaba contando** las reservas manuales creadas desde el Dashboard.

**Usuario reporta:**
> "He creado una reserva manual para hoy, pero el contador muestra 0. ¿Por qué no cuenta las reservas manuales?"

---

## 🔍 CAUSA RAÍZ

### **Error en el código:**

**En `ReservationWizard.jsx` línea 80:**
```javascript
// ❌ INCORRECTO
channel: 'manual',
```

**Problema:**  
El campo correcto en la tabla `reservations` es **`reservation_channel`**, NO `channel`.

### **Consecuencias:**

1. ✅ La reserva se creaba correctamente con `source = 'dashboard'`
2. ❌ El campo `reservation_channel` quedaba como `NULL`
3. ❌ El Dashboard buscaba `reservation_channel = 'manual'` y no encontraba nada
4. ❌ El contador mostraba **0 reservas manuales** aunque existieran

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **1️⃣ Corregir el frontend**

**Archivo:** `src/components/reservas/ReservationWizard.jsx`

**ANTES:**
```javascript
channel: 'manual',
source: 'dashboard',
```

**DESPUÉS:**
```javascript
reservation_channel: 'manual', // ✅ Corregido
source: 'dashboard',
```

### **2️⃣ Migración SQL para corregir datos existentes**

**Archivo:** `supabase/migrations/20251012_006_fix_manual_reservations_channel.sql`

**Qué hace:**
1. Copia valores de `channel` → `reservation_channel` (si `reservation_channel` es NULL)
2. Para reservas de `source = 'dashboard'` sin canal, asigna `reservation_channel = 'manual'`

---

## 🚀 CÓMO APLICAR LA SOLUCIÓN

### **Paso 1: Frontend (Ya aplicado automáticamente)**
El código del frontend ya está corregido. Las **nuevas reservas** manuales se crearán correctamente.

### **Paso 2: Ejecutar migración SQL**

```sql
-- Ir a: Supabase Dashboard → SQL Editor → New Query
-- Copiar y pegar TODO el contenido de:
-- supabase/migrations/20251012_006_fix_manual_reservations_channel.sql
-- Ejecutar
```

### **Paso 3: Verificar**

```sql
-- Ver reservas manuales de HOY
SELECT 
  customer_name,
  reservation_time,
  party_size,
  reservation_channel,
  source,
  status
FROM reservations
WHERE 
  reservation_date = CURRENT_DATE
  AND reservation_channel = 'manual'
ORDER BY reservation_time;
```

**Resultado esperado:**  
Verás todas tus reservas manuales con `reservation_channel = 'manual'`.

### **Paso 4: Refrescar Dashboard**

1. Ir al Dashboard
2. Hacer refresh (F5)
3. El widget "Canales Activos" ahora mostrará:
   ```
   ✍️ Manual    1 reserva  (o el número que tengas)
   ```

---

## ✅ RESULTADOS

### **ANTES (❌):**
```
📊 Canales Activos: 3/6
┌─────────────────────────────┐
│ ✅ VAPI         0 reservas  │
│ ✅ WhatsApp     0 reservas  │
│ ✅ Manual       0 reservas  │ ← ❌ NO CONTABA
└─────────────────────────────┘
```

### **DESPUÉS (✅):**
```
📊 Canales Activos: 3/6
┌─────────────────────────────┐
│ ✅ VAPI         0 reservas  │
│ ✅ WhatsApp     0 reservas  │
│ ✅ Manual       1 reserva   │ ← ✅ CUENTA CORRECTAMENTE
└─────────────────────────────┘
```

---

## 📊 IMPACTO

### **Reservas afectadas:**
- ✅ Todas las reservas manuales creadas **ANTES** de este fix tendrán `reservation_channel` corregido
- ✅ Todas las reservas manuales creadas **DESPUÉS** de este fix tendrán el campo correcto desde el inicio

### **Funcionalidades corregidas:**
1. ✅ Contador "Canales Activos" en Dashboard
2. ✅ Estadísticas por canal
3. ✅ Filtros por canal en página Reservas
4. ✅ Reportes y analytics

---

## 🔍 NOTAS TÉCNICAS

### **Campos relacionados:**
- `reservation_channel` → Canal por el que llegó la reserva (manual, vapi, whatsapp, etc.)
- `source` → Origen de la reserva (dashboard, agent, external)
- `channel` → **DEPRECATED** (no usar, mantener por compatibilidad legacy)

### **Flujo correcto:**
```
Reserva Manual → ReservationWizard
                   ↓
              reservation_channel: 'manual'
              source: 'dashboard'
                   ↓
              Supabase INSERT
                   ↓
              Dashboard lee reservation_channel
                   ↓
              Contador se actualiza ✅
```

---

## ⚠️ PREVENCIÓN FUTURA

### **Checklist para nuevas reservas:**
- [ ] Siempre usar `reservation_channel` (NO `channel`)
- [ ] Verificar que el Dashboard consulta `reservation_channel`
- [ ] Probar contador de canales después de crear reserva
- [ ] Validar con datos reales, no moqueados

### **Tests manuales:**
1. Crear reserva manual → Verificar contador
2. Crear reserva por VAPI → Verificar contador
3. Crear reserva por WhatsApp → Verificar contador

---

**Autor:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** ✅ Corregido y documentado  
**Prioridad:** 🔴 ALTA - Afecta métricas principales del Dashboard


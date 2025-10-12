# ✅ SOLUCIÓN: Auto-marcar Reservas Expiradas como No-Show

**Fecha:** 11 Octubre 2025  
**Problema:** Reservas `pending` que no pasan a `noshow` automáticamente  
**Solución:** Función SQL que marca automáticamente `pending` → `noshow` después de 2h

---

## 🎯 QUÉ HACE LA SOLUCIÓN

### **Comportamiento Automático:**

1. ⏰ **Detecta reservas caducadas:**
   - Estado = `pending` o `pending_approval`
   - Han pasado **+2 horas** desde la hora de la reserva
   - NO están canceladas, completadas, confirmadas ni seated

2. 🔄 **Las marca automáticamente:**
   - Cambia `status` de `pending` → `no_show` (con guion bajo)
   - Actualiza `updated_at` con timestamp actual

3. 📊 **Resultado:**
   - Las estadísticas de No-Shows se actualizan automáticamente
   - La tasa de no-show se calcula correctamente
   - El historial queda registrado

---

## 📝 PASO A PASO - APLICAR LA SOLUCIÓN

### **PASO 1: Aplicar la Migración SQL**

1. Abre **Supabase Dashboard** → SQL Editor
2. Copia **TODO el contenido** del archivo:  
   `supabase/migrations/20251011_001_auto_mark_expired_reservations_noshow.sql`
3. Pégalo en el SQL Editor
4. Haz clic en **"Run"**
5. Deberías ver: `Success. No rows returned`

---

### **PASO 2: Probar Manualmente (Primera Vez)**

Ejecuta en SQL Editor:

```sql
-- Ver qué reservas se van a actualizar (SIN ejecutar)
SELECT 
    id,
    customer_name,
    reservation_date,
    reservation_time,
    status,
    (reservation_date + reservation_time::TIME) as reservation_datetime,
    NOW() - (reservation_date + reservation_time::TIME) as time_passed
FROM reservations
WHERE 
    status IN ('pending', 'pending_approval')
    AND (reservation_date + reservation_time::TIME) < (NOW() - INTERVAL '2 hours')
ORDER BY reservation_date DESC, reservation_time DESC;
```

**Deberías ver tus 2 reservas de ayer.**

Ahora ejecuta:

```sql
-- Marcar como no-show
SELECT * FROM mark_expired_reservations_as_noshow();
```

**Resultado esperado:**
```
updated_count: 2
reservation_ids: {uuid1, uuid2}
```

---

### **PASO 3: Verificar que Funcionó**

```sql
-- Ver las reservas que ahora son no_show
SELECT 
    id,
    customer_name,
    reservation_date,
    reservation_time,
    status,
    updated_at
FROM reservations
WHERE status = 'no_show'
ORDER BY updated_at DESC
LIMIT 10;
```

**Deberías ver tus 3 reservas ahora con `status = 'no_show'` (con guion bajo).**

---

### **PASO 4: Verificar Estadísticas en la App**

1. Ve a la página **No-Shows** en tu aplicación
2. Refresca la página (F5)
3. Ahora deberías ver:
   - ✅ **Tasa de No-Show:** Ya NO será 0%, mostrará el porcentaje real
   - ✅ **Reservas de riesgo hoy:** Mostrará las que tengas hoy

---

## 🤖 AUTOMATIZACIÓN (RECOMENDADO)

Para que se ejecute automáticamente cada 30 minutos, tienes **2 opciones:**

### **OPCIÓN A: N8n Workflow (Recomendado)**

Crear un workflow en N8n:

1. **Trigger:** Cron - Cada 30 minutos
2. **Acción:** Supabase → Execute Function
   - Función: `auto_mark_expired_noshows`
   - Sin parámetros

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.cron",
      "name": "Every 30 minutes",
      "parameters": {
        "cronExpression": "*/30 * * * *"
      }
    },
    {
      "type": "n8n-nodes-base.supabase",
      "name": "Mark Expired No-Shows",
      "parameters": {
        "operation": "executeFunction",
        "function": "auto_mark_expired_noshows"
      }
    }
  ]
}
```

### **OPCIÓN B: Desde tu App React (Manual)**

En `server.js` o donde tengas cron jobs:

```javascript
// Ejecutar cada 30 minutos
setInterval(async () => {
    try {
        const { data, error } = await supabase.rpc('auto_mark_expired_noshows');
        if (error) throw error;
        console.log('✅ Auto-marcadas', data.updated_count, 'reservas como no-show');
    } catch (error) {
        console.error('❌ Error auto-marcando no-shows:', error);
    }
}, 30 * 60 * 1000); // 30 minutos
```

---

## 🧪 TESTING

### **Test 1: Crear Reserva de Prueba**

```sql
-- Crear una reserva de hace 3 horas (debería marcarse como no-show)
INSERT INTO reservations (
    restaurant_id,
    customer_name,
    customer_phone,
    reservation_date,
    reservation_time,
    party_size,
    status
)
VALUES (
    'TU_RESTAURANT_ID', -- Reemplazar
    'Test Cliente',
    '+34600000000',
    CURRENT_DATE,
    (CURRENT_TIME - INTERVAL '3 hours')::TIME, -- Hace 3 horas
    2,
    'pending'
);
```

### **Test 2: Ejecutar Función**

```sql
SELECT * FROM mark_expired_reservations_as_noshow();
```

**Resultado esperado:** `updated_count: 1` (la reserva de prueba)

### **Test 3: Verificar**

```sql
SELECT * FROM reservations 
WHERE customer_name = 'Test Cliente'
AND status = 'noshow';
```

**Resultado esperado:** 1 fila con `status = 'no_show'`

### **Test 4: Limpiar**

```sql
-- Eliminar reserva de prueba
DELETE FROM reservations 
WHERE customer_name = 'Test Cliente';
```

---

## 📊 CÓMO AFECTA A LAS ESTADÍSTICAS

### **ANTES (Problema):**
```javascript
// Reservas de ayer en BD:
{
  id: "abc-123",
  status: "pending",  // ❌ Sigue pending
  reservation_date: "2025-10-10",
  reservation_time: "20:00"
}

// Estadísticas mostradas:
Tasa de No-Show: 0.0%  // ❌ INCORRECTO
```

### **DESPUÉS (Solucionado):**
```javascript
// Función se ejecuta automáticamente cada 30 min:
mark_expired_reservations_as_noshow()

// Reservas de ayer en BD:
{
  id: "abc-123",
  status: "no_show",  // ✅ Cambió automáticamente (con guion bajo)
  reservation_date: "2025-10-10",
  reservation_time: "20:00",
  updated_at: "2025-10-11 10:30:00"
}

// Estadísticas mostradas:
Tasa de No-Show: 12.5%  // ✅ CORRECTO (3 no-shows de 24 reservas)
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Migración SQL aplicada correctamente
- [ ] Función `mark_expired_reservations_as_noshow()` existe en Supabase
- [ ] Ejecutada manualmente la primera vez
- [ ] Las 3 reservas caducadas (1 del 09/10 + 2 del 06/10) ahora tienen `status = 'no_show'`
- [ ] Página No-Shows muestra tasa correcta (no 0%)
- [ ] (Opcional) Workflow N8n creado para automatización
- [ ] (Opcional) Test con reserva de prueba exitoso

---

## 🔍 TROUBLESHOOTING

### **Problema: La función no encuentra reservas**

**Causa:** No hay reservas `pending` con +2h caducadas

**Solución:** Crear una de prueba (ver Test 1)

---

### **Problema: Error "function does not exist"**

**Causa:** La migración no se aplicó correctamente

**Solución:** 
1. Verificar en Supabase → Database → Functions
2. Buscar `mark_expired_reservations_as_noshow`
3. Si no existe, volver a aplicar el SQL

---

### **Problema: Las estadísticas siguen en 0%**

**Causa posible 1:** El frontend tiene caché

**Solución:** Hard refresh (Ctrl + Shift + R)

**Causa posible 2:** La función `get_restaurant_noshow_metrics` tiene un error

**Solución:** Ejecutar en SQL Editor:
```sql
SELECT * FROM get_restaurant_noshow_metrics('TU_RESTAURANT_ID');
```

Ver qué retorna.

---

## 📚 ARCHIVOS RELACIONADOS

- **Migración SQL:** `supabase/migrations/20251011_001_auto_mark_expired_reservations_noshow.sql`
- **Página Frontend:** `src/pages/NoShowControlNuevo.jsx`
- **Función Métricas:** `supabase/migrations/FIX_get_restaurant_noshow_metrics.sql`
- **Documentación Sistema:** `docs/02-sistemas/SISTEMA-NOSHOWS-COMPLETO.md`

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Aplicar migración** (PASO 1)
2. ✅ **Ejecutar manualmente** primera vez (PASO 2)
3. ✅ **Verificar estadísticas** (PASO 3)
4. 🔄 **Configurar automatización** N8n (PASO 4 - Recomendado)
5. 📊 **Monitorear durante 1 semana**

---

**Última actualización:** 11 Octubre 2025  
**Estado:** ✅ LISTO PARA APLICAR  
**Prioridad:** 🔴 ALTA (Afecta métricas principales)


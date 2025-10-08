# 🕐 Mantenimiento Automático Diario de Disponibilidades

> **Fecha:** 8 de Octubre 2025  
> **Estado:** ✅ Activo  
> **Ejecución:** Automática a las 4:00 AM diaria

---

## 📋 **PROPÓSITO**

Mantener una **ventana móvil constante** de disponibilidades para reservas, asegurando que siempre haya X días disponibles hacia el futuro (según configuración de cada restaurante).

---

## 🎯 **PROBLEMA QUE RESUELVE**

**Sin mantenimiento automático:**
- Día 1: Tienes 30 días de disponibilidad (hasta 7/Nov)
- Día 2: Solo 29 días (hasta 7/Nov)
- Día 3: Solo 28 días (hasta 7/Nov)
- **La ventana se reduce cada día**

**Con mantenimiento automático:**
- Día 1: 30 días (hasta 7/Nov)
- Día 2: 30 días (hasta 8/Nov) ✅
- Día 3: 30 días (hasta 9/Nov) ✅
- **La ventana siempre se mantiene**

---

## ⚙️ **CÓMO FUNCIONA**

### **Ejecución Diaria (4:00 AM)**

```
┌─────────────────────────────────────┐
│  1. LIMPIAR SLOTS ANTIGUOS          │
│     - Solo slots LIBRES (status='free')
│     - Solo días PASADOS (< hoy)     │
│     - NUNCA tocar reservas          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  2. GENERAR NUEVO DÍA AL FINAL      │
│     - Día = hoy + advance_days      │
│     - Respetar días cerrados        │
│     - Crear slots según horarios    │
└─────────────────────────────────────┘
```

---

## 🔒 **REGLAS DE PROTECCIÓN**

### ✅ **LO QUE HACE:**
1. Elimina slots **LIBRES** de días pasados
2. Genera 1 nuevo día al final
3. Procesa **todos los restaurantes** automáticamente

### ❌ **LO QUE NUNCA HACE:**
1. ❌ Borrar reservas (tabla `reservations`)
2. ❌ Borrar slots con status ≠ 'free'
3. ❌ Tocar días con reservas activas
4. ❌ Generar en días marcados como cerrados

---

## 📊 **CONFIGURACIÓN**

Cada restaurante tiene su propia configuración en `restaurants.settings`:

```json
{
  "advance_booking_days": 30  // Ventana de días
}
```

**Ejemplos:**
- `advance_booking_days: 30` → Siempre 30 días disponibles
- `advance_booking_days: 15` → Siempre 15 días disponibles
- `advance_booking_days: 60` → Siempre 60 días disponibles

---

## 🗄️ **IMPLEMENTACIÓN TÉCNICA**

### **1. Función SQL**

```sql
daily_availability_maintenance()
```

**Ubicación:** `supabase/migrations/20251008_001_daily_availability_maintenance.sql`

**Retorna:**
```json
{
  "success": true,
  "executed_at": "2025-10-09T04:00:00Z",
  "date_reference": "2025-10-09",
  "restaurants_processed": 5,
  "total_slots_deleted": 120,
  "total_slots_created": 120,
  "errors": [],
  "summary": "Procesados 5 restaurantes. Eliminados 120 slots antiguos. Creados 120 slots nuevos."
}
```

### **2. Programación pg_cron**

```sql
SELECT cron.schedule(
    'daily-availability-maintenance',
    '0 4 * * *',  -- 4:00 AM diario
    'SELECT daily_availability_maintenance();'
);
```

---

## 🧪 **TESTING Y VERIFICACIÓN**

### **Ejecutar manualmente:**

```sql
SELECT daily_availability_maintenance();
```

### **Ver jobs programados:**

```sql
SELECT * FROM cron.job;
```

### **Ver historial de ejecuciones:**

```sql
SELECT 
    jobname,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
WHERE jobname = 'daily-availability-maintenance'
ORDER BY start_time DESC 
LIMIT 10;
```

---

## 📝 **LOGS ESPERADOS**

### **Ejecución Exitosa:**

```
🕐 [DAILY MAINTENANCE] Iniciando a las 2025-10-09 04:00:00
📅 Fecha de referencia: 2025-10-09

🏪 [1] Procesando restaurante: Casa Paco
📊 Configuración: 30 días de anticipación
🧹 Limpiando slots libres antiguos...
✅ Eliminados 24 slots libres antiguos
🆕 Generando nuevo día: 2025-11-08
✅ Creados 24 slots para el día 2025-11-08

🏪 [2] Procesando restaurante: Casa Lolita
...

🎉 [DAILY MAINTENANCE] Completado
📊 Resumen: 5 restaurantes, 120 eliminados, 120 creados
```

### **Con Errores:**

```
⚠️ Día 2025-11-08 está cerrado manualmente, saltando
⚠️ Ya existen slots para 2025-11-08, saltando generación
❌ Error generando slots para Casa X: ...
⚠️ Errores encontrados: 1
```

---

## 🚨 **MONITOREO Y ALERTAS**

### **Cómo saber si funciona:**

1. **Verificar último slot generado:**
```sql
SELECT restaurant_id, MAX(slot_date) as ultimo_dia
FROM availability_slots
GROUP BY restaurant_id;
```

**Resultado esperado:** `ultimo_dia` = HOY + `advance_booking_days`

2. **Ver logs de ejecución:**
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'daily-availability-maintenance'
AND start_time > NOW() - INTERVAL '7 days'
ORDER BY start_time DESC;
```

3. **Alertas (implementar):**
- Email si el job falla 2 días consecutivos
- Dashboard con última ejecución exitosa

---

## 🔧 **MANTENIMIENTO**

### **Deshabilitar temporalmente:**

```sql
SELECT cron.unschedule('daily-availability-maintenance');
```

### **Reactivar:**

```sql
SELECT cron.schedule(
    'daily-availability-maintenance',
    '0 4 * * *',
    'SELECT daily_availability_maintenance();'
);
```

### **Cambiar horario:**

```sql
-- Cambiar a 2:00 AM
SELECT cron.unschedule('daily-availability-maintenance');
SELECT cron.schedule(
    'daily-availability-maintenance',
    '0 2 * * *',  -- 2:00 AM
    'SELECT daily_availability_maintenance();'
);
```

---

## ⚠️ **NOTAS IMPORTANTES**

1. **Zona horaria:** pg_cron usa **UTC**. Si estás en España (CET/CEST), 4:00 AM UTC = 5:00/6:00 AM hora local.

2. **Primera ejecución:** Después de aplicar la migración, el job se ejecutará automáticamente al día siguiente a las 4:00 AM.

3. **Multi-tenant:** El job procesa **todos los restaurantes** en una sola ejecución.

4. **Idempotencia:** Si se ejecuta varias veces en el mismo día, no generará duplicados (verifica si ya existen slots).

5. **Rendimiento:** Para muchos restaurantes (>100), considerar optimizaciones o paralelización.

---

## 📚 **REFERENCIAS**

- **pg_cron docs:** https://github.com/citusdata/pg_cron
- **Supabase pg_cron:** https://supabase.com/docs/guides/database/extensions/pg_cron
- **Función de generación:** `cleanup_and_regenerate_availability()`

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [x] Crear función SQL `daily_availability_maintenance()`
- [x] Programar job con pg_cron
- [x] Documentar funcionamiento
- [ ] Ejecutar manualmente para probar
- [ ] Verificar logs después de primera ejecución automática
- [ ] Configurar alertas (opcional)
- [ ] Actualizar documentación si es necesario

---

**¡El sistema está listo para funcionar automáticamente!** 🚀


# 🚀 INSTRUCCIONES: Mantenimiento Automático Diario

## 📋 **PASOS PARA ACTIVAR**

### **1. Ir a Supabase SQL Editor**
1. Abre tu proyecto en Supabase
2. Ve a `SQL Editor` (menú izquierdo)
3. Click en `New Query`

---

### **2. Ejecutar el Script Principal**

**Archivo:** `EJECUTAR_EN_SUPABASE_DAILY_MAINTENANCE.sql`

1. Abre el archivo en tu editor local
2. Copia **TODO** el contenido
3. Pégalo en Supabase SQL Editor
4. Click en **RUN** (esquina superior derecha)

**Resultado esperado:**
```
✅ Success. No rows returned
```

Verás en los logs:
- `Job no existía previamente, continuando...` (normal en primera ejecución)
- Una tabla con el job programado

---

### **3. Verificar que Funcionó**

**Archivo:** `TEST_DAILY_MAINTENANCE.sql`

Ejecuta las queries una por una:

#### **Query 1: Ver job programado**
```sql
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active
FROM cron.job 
WHERE jobname = 'daily-availability-maintenance';
```

**Resultado esperado:**
| jobid | jobname | schedule | active |
|-------|---------|----------|--------|
| 123   | daily-availability-maintenance | 0 4 * * * | true |

✅ Si ves esto, **está activo**

---

#### **Query 2: Probar ejecución manual**
```sql
SELECT daily_availability_maintenance();
```

**Resultado esperado:**
```json
{
  "success": true,
  "executed_at": "2025-10-08T16:45:00Z",
  "restaurants_processed": 1,
  "total_slots_deleted": X,
  "total_slots_created": X,
  "errors": [],
  "summary": "Procesados 1 restaurantes. Eliminados X slots antiguos. Creados X slots nuevos."
}
```

✅ Si `success: true`, **funciona correctamente**

---

#### **Query 3: Verificar slots antiguos eliminados**
```sql
SELECT COUNT(*) as slots_antiguos_libres
FROM availability_slots
WHERE slot_date < CURRENT_DATE
  AND status = 'free';
```

**Resultado esperado:**
| slots_antiguos_libres |
|-----------------------|
| 0                     |

✅ Debe ser **0** (todos los slots libres antiguos eliminados)

---

#### **Query 4: Verificar nuevo día generado**
```sql
SELECT 
    r.name as restaurante,
    (r.settings->>'advance_booking_days')::INTEGER as dias_config,
    MAX(a.slot_date) as ultimo_dia_generado,
    MAX(a.slot_date) - CURRENT_DATE as dias_adelante
FROM restaurants r
LEFT JOIN availability_slots a ON a.restaurant_id = r.id
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.name, r.settings;
```

**Resultado esperado:**
| restaurante | dias_config | ultimo_dia_generado | dias_adelante |
|-------------|-------------|---------------------|---------------|
| Casa Lolita | 20          | 2025-10-28          | 20            |

✅ `dias_adelante` debe ser igual a `dias_config`

---

## ⏰ **HORARIO DE EJECUCIÓN**

- **Programado:** Todos los días a las **4:00 AM UTC**
- **Zona horaria España (CET/CEST):**
  - Invierno: 5:00 AM
  - Verano: 6:00 AM

---

## 🔍 **MONITOREO**

### **Ver historial de ejecuciones:**
```sql
SELECT 
    start_time,
    status,
    return_message,
    end_time - start_time as duration
FROM cron.job_run_details 
WHERE jobname = 'daily-availability-maintenance'
ORDER BY start_time DESC 
LIMIT 10;
```

### **Ver última ejecución exitosa:**
```sql
SELECT 
    start_time,
    return_message
FROM cron.job_run_details 
WHERE jobname = 'daily-availability-maintenance'
  AND status = 'succeeded'
ORDER BY start_time DESC 
LIMIT 1;
```

---

## 🛠️ **MANTENIMIENTO**

### **Desactivar temporalmente:**
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

### **Cambiar horario (ejemplo: 2:00 AM):**
```sql
SELECT cron.unschedule('daily-availability-maintenance');
SELECT cron.schedule(
    'daily-availability-maintenance',
    '0 2 * * *',  -- 2:00 AM UTC
    'SELECT daily_availability_maintenance();'
);
```

---

## ⚠️ **TROUBLESHOOTING**

### **Error: "extension pg_cron not available"**
- **Causa:** pg_cron no está habilitado en tu plan de Supabase
- **Solución:** Supabase Pro/Team tienen pg_cron. En Free tier, considera usar Edge Functions.

### **Error: "could not find valid entry for job"**
- **Causa:** Intentando borrar un job que no existe
- **Solución:** Ya corregido en el script con `DO $$ ... EXCEPTION`

### **No se ejecuta automáticamente**
- **Verificar:** `SELECT * FROM cron.job WHERE jobname = 'daily-availability-maintenance';`
- **Si `active = false`:** Reactivar con `cron.schedule`
- **Si no aparece:** Volver a ejecutar el script principal

---

## ✅ **CHECKLIST FINAL**

- [ ] Script principal ejecutado en Supabase
- [ ] Job aparece en `cron.job` con `active = true`
- [ ] Ejecución manual exitosa (`success: true`)
- [ ] Slots antiguos eliminados (query devuelve 0)
- [ ] Nuevo día generado correctamente
- [ ] Documentación revisada

**¡Listo! El sistema funcionará automáticamente cada día a las 4 AM.** 🎉

---

## 📚 **ARCHIVOS RELACIONADOS**

- `EJECUTAR_EN_SUPABASE_DAILY_MAINTENANCE.sql` - Script principal
- `TEST_DAILY_MAINTENANCE.sql` - Scripts de verificación
- `docs/DAILY_AVAILABILITY_MAINTENANCE.md` - Documentación técnica completa
- `supabase/migrations/20251008_001_daily_availability_maintenance.sql` - Migración original


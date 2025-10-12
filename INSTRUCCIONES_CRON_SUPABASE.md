# ⚡ CRON JOB AUTOMÁTICO EN SUPABASE

## 🎯 **¿QUÉ HACE ESTE CRON JOB?**

Marca automáticamente como `no_show` todas las reservas `pending` que pasaron hace más de 2 horas.

**Características:**
- ✅ Se ejecuta **cada 30 minutos** automáticamente
- ✅ Funciona **24/7 en la nube** (no depende de tu ordenador)
- ✅ **Gratis** (incluido en el plan de Supabase)
- ✅ Logs disponibles para monitoreo

---

## 📋 **PASO 1: APLICAR EL SQL**

Ve a **Supabase SQL Editor** y ejecuta:

```sql
-- ========================================
-- SUPABASE CRON JOB: Auto-marcar reservas caducadas como no-show
-- ========================================

-- 1. HABILITAR EXTENSIÓN pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. ELIMINAR JOB ANTERIOR (si existe)
SELECT cron.unschedule('mark-expired-reservations-noshow');

-- 3. CREAR CRON JOB: cada 30 minutos
SELECT cron.schedule(
    'mark-expired-reservations-noshow',
    '*/30 * * * *',
    $$
    SELECT mark_all_expired_reservations_as_noshow();
    $$
);
```

**Resultado esperado:**
```
schedule
--------
1
```

---

## ✅ **PASO 2: VERIFICAR QUE SE CREÓ**

Ejecuta esto para ver el cron job:

```sql
SELECT * FROM cron.job WHERE jobname = 'mark-expired-reservations-noshow';
```

**Resultado esperado:**
```
jobid | schedule    | command                                    | nodename  | nodeport | ...
------|-------------|--------------------------------------------|-----------|---------
1     | */30 * * * *| SELECT mark_all_expired_reservations...    | localhost | 5432
```

---

## 🕐 **PASO 3: ESPERAR 30 MINUTOS Y VERIFICAR**

Después de 30 minutos, ejecuta esto para ver el historial:

```sql
SELECT 
    job_pid,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
WHERE jobid = (
    SELECT jobid FROM cron.job 
    WHERE jobname = 'mark-expired-reservations-noshow'
)
ORDER BY start_time DESC 
LIMIT 5;
```

**Resultado esperado:**
```
job_pid | status    | return_message | start_time           | end_time
--------|-----------|----------------|----------------------|----------------------
12345   | succeeded | SELECT 1       | 2025-10-11 10:30:00 | 2025-10-11 10:30:01
12346   | succeeded | SELECT 1       | 2025-10-11 11:00:00 | 2025-10-11 11:00:01
```

---

## 🎉 **¡YA ESTÁ! FUNCIONANDO 24/7**

El cron job ahora:
- ✅ Se ejecuta **cada 30 minutos**
- ✅ Funciona **aunque tu ordenador esté apagado**
- ✅ Marca automáticamente reservas caducadas como `no_show`

---

## 📅 **EJEMPLO REAL**

**Reserva:** Andrea Martinez - HOY 11/10 a las 20:00

| Hora | Cron Job se ejecuta | ¿Qué pasa? |
|------|---------------------|------------|
| 20:00 | No | Reserva aún no pasó |
| 20:30 | ✅ | Reserva aún no pasó (solo 30 min) |
| 21:00 | ✅ | Reserva aún no pasó (solo 1h) |
| 21:30 | ✅ | Reserva aún no pasó (solo 1h 30min) |
| 22:00 | ✅ | Reserva aún no pasó (justo 2h) |
| **22:30** | ✅ | **SE MARCA COMO NO-SHOW** ✅ |

---

## 🔧 **COMANDOS ÚTILES**

### Ver todos los cron jobs:
```sql
SELECT jobid, jobname, schedule, command FROM cron.job;
```

### Ver últimas 20 ejecuciones:
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Desactivar el cron job:
```sql
SELECT cron.unschedule('mark-expired-reservations-noshow');
```

### Cambiar frecuencia (ejemplo: cada 15 min):
```sql
-- Primero desactivar
SELECT cron.unschedule('mark-expired-reservations-noshow');

-- Luego crear con nueva frecuencia
SELECT cron.schedule(
    'mark-expired-reservations-noshow',
    '*/15 * * * *',  -- Cada 15 minutos
    $$
    SELECT mark_all_expired_reservations_as_noshow();
    $$
);
```

---

## 🚨 **TROUBLESHOOTING**

### Error: "extension pg_cron is not available"
**Solución:** Contacta con soporte de Supabase para habilitar `pg_cron` en tu proyecto.

### Error: "permission denied for schema cron"
**Solución:** Necesitas permisos de administrador. Usa el usuario `postgres` en Supabase.

### El cron job no se ejecuta
**Solución:** Verifica que la función `mark_all_expired_reservations_as_noshow()` existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'mark_all_expired_reservations_as_noshow';
```

---

## 📊 **COMPARACIÓN: ANTES vs AHORA**

| Aspecto | ANTES (server.js) | AHORA (Supabase Cron) |
|---------|-------------------|----------------------|
| **Requiere ordenador encendido** | ❌ SÍ | ✅ NO |
| **Funciona 24/7** | ❌ NO | ✅ SÍ |
| **Costo adicional** | ❌ Consume recursos locales | ✅ Gratis |
| **Fiabilidad** | ⚠️ Baja (si apagas PC) | ✅ Alta (nube) |
| **Logs** | ⚠️ Solo en consola local | ✅ En BD permanente |
| **Mantenimiento** | ⚠️ Manual | ✅ Automático |

---

## ✅ **CHECKLIST FINAL**

- [ ] Ejecuté el SQL para crear el cron job
- [ ] Verifiqué que aparece en `cron.job`
- [ ] Esperé 30 minutos y verifiqué el historial
- [ ] Confirmé que el cron job se ejecutó exitosamente
- [ ] ✅ **LA APLICACIÓN AHORA FUNCIONA 24/7 SIN DEPENDER DE MI ORDENADOR**

---

## 🎯 **PRÓXIMOS PASOS**

1. **Aplicar el SQL en Supabase** (AHORA)
2. **Eliminar el cron job de `server.js`** (ya no es necesario)
3. **Monitorear las primeras ejecuciones** (30 min, 1h, 1h30min)
4. **¡LISTO! Tu aplicación funciona 24/7** 🚀



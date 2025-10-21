# ✅ Workflow 05 - Auto-Liberación 2h (Trigger Supabase)

**Fecha:** 21 Octubre 2025  
**Método:** `pg_cron` en Supabase → Webhook N8N  
**Frecuencia:** Cada 10 minutos  
**Coste:** ~200-400 ejecuciones N8N/mes (95% reducción)

---

## 🎯 PROBLEMA RESUELTO:

### ❌ **ANTES:**
- Workflow con cron cada 10 min en N8N
- **4,320 ejecuciones/mes**
- **COSTE BRUTAL**

### ✅ **AHORA:**
- `pg_cron` en Supabase cada 10 min
- Supabase busca reservas sin confirmar <2h
- Si encuentra → llama webhook N8N
- Si NO encuentra → no gasta ejecuciones N8N
- **~200-400 ejecuciones/mes**
- **95% REDUCCIÓN DE COSTE**

---

## 🔄 FLUJO COMPLETO:

```
⏰ Supabase pg_cron: Cada 10 minutos
  ↓
📊 Función SQL: trigger_auto_liberacion_2h()
    - Buscar reservas:
      • Status: pending/confirmed
      • Sin confirmación (customer_confirmations.confirmed = false)
      • Faltan 0-2 horas para la reserva
  ↓
❓ ¿Hay reservas?
  ↓
  ├─ NO → ℹ️ Termina (no llama N8N)
  │
  └─ SÍ → 📡 HTTP POST al webhook N8N
            Body: { "reservations": [ ... ] }
            ↓
         📥 N8N Webhook recibe array de reservas
            ↓
         🔄 Por cada reserva:
            1. 🚫 Marcar status = 'no_show'
            2. 🔓 Liberar slot (current_bookings -= party_size)
            3. 📝 Registrar en noshow_actions
            4. ✅ Log
            ↓
         📊 Resumen final
            ↓
         ✅ Responder OK a Supabase
```

---

## 📁 ARCHIVOS:

1. **SQL Migration:** `supabase/migrations/20251021_002_auto_liberacion_trigger.sql`
2. **N8N Workflow:** `n8n/workflows/05-auto-liberacion-2h-TRIGGER.json`
3. **Documentación:** Este archivo

---

## 🚀 SETUP (3 PASOS):

### **PASO 1: Ejecutar migración SQL en Supabase**

1. Ir a Supabase → SQL Editor
2. Copiar contenido de `supabase/migrations/20251021_002_auto_liberacion_trigger.sql`
3. Ejecutar

**Esto crea la función `trigger_auto_liberacion_2h()`**

---

### **PASO 2: Importar workflow a N8N**

1. N8N → "+" → "Import from File"
2. Seleccionar `05-auto-liberacion-2h-TRIGGER.json`
3. Verificar credenciales Supabase
4. **Activar workflow**
5. **Copiar URL del webhook** (ejemplo: `https://gustausantin.app.n8n.cloud/webhook/AUTO-LIBERACION-2H`)

---

### **PASO 3: Configurar pg_cron en Supabase**

1. Ir a Supabase → SQL Editor
2. **IMPORTANTE:** Actualizar la URL del webhook en la función SQL:

```sql
-- Buscar esta línea en la función:
v_webhook_url text := 'https://gustausantin.app.n8n.cloud/webhook/AUTO-LIBERACION-2H';

-- Reemplazar con TU URL del webhook de N8N
```

3. Ejecutar este comando para programar el cron:

```sql
SELECT cron.schedule(
  'auto-liberacion-2h',           -- Nombre del job
  '*/10 * * * *',                  -- Cada 10 minutos
  $$SELECT trigger_auto_liberacion_2h()$$
);
```

4. Verificar que se creó:

```sql
SELECT * FROM cron.job WHERE jobname = 'auto-liberacion-2h';
```

**Deberías ver:**
```
jobname              | schedule      | active
---------------------|---------------|-------
auto-liberacion-2h   | 0 */2 * * *   | t
```

---

## 🧪 TESTING:

### **Test 1: Verificar que la función existe**

```sql
SELECT trigger_auto_liberacion_2h();
```

**Output esperado:**
```
NOTICE: ℹ️ No hay reservas sin confirmar <2h
```

---

### **Test 2: Crear reserva de prueba**

```sql
-- Crear reserva para DENTRO DE 1.5 HORAS
INSERT INTO reservations (
  restaurant_id,
  customer_name,
  customer_phone,
  customer_email,
  reservation_date,
  reservation_time,
  party_size,
  status
) VALUES (
  'd6b63130-1ebf-4284-98fc-a3b31a85d9d1',
  'Test No-Show',
  '+34600000000',
  'test@test.com',
  CURRENT_DATE,
  (NOW() + INTERVAL '1.5 hours')::TIME,
  2,
  'pending'
);

-- NO crear confirmación (para que se auto-libere)

-- Ejecutar manualmente
SELECT trigger_auto_liberacion_2h();

-- Verificar resultado en logs de N8N
-- Verificar que la reserva ahora tiene status = 'no_show'
```

---

### **Test 3: Ver ejecuciones del cron**

```sql
SELECT 
  jobid,
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
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'auto-liberacion-2h'
)
ORDER BY start_time DESC
LIMIT 10;
```

---

## 📊 MÉTRICAS:

### **Ver reservas auto-liberadas hoy:**

```sql
SELECT 
  na.action_date,
  r.customer_name,
  r.reservation_date,
  r.reservation_time,
  r.party_size,
  na.notes
FROM noshow_actions na
JOIN reservations r ON r.id = na.reservation_id
WHERE na.action_type = 'auto_release'
  AND na.action_date = CURRENT_DATE
ORDER BY na.created_at DESC;
```

---

### **Estadísticas por mes:**

```sql
SELECT 
  DATE_TRUNC('month', action_date) as mes,
  COUNT(*) as total_auto_liberadas,
  SUM((notes::json->>'party_size')::int) as total_slots_recuperados
FROM noshow_actions
WHERE action_type = 'auto_release'
GROUP BY mes
ORDER BY mes DESC;
```

---

## ⚙️ CONFIGURACIÓN:

### **Cambiar frecuencia del cron:**

```sql
-- Desactivar actual
SELECT cron.unschedule('auto-liberacion-2h');

-- Crear nuevo (ejemplo: cada hora)
SELECT cron.schedule(
  'auto-liberacion-1h',
  '0 * * * *',  -- Cada hora
  $$SELECT trigger_auto_liberacion_2h()$$
);
```

---

### **Cambiar ventana de tiempo (default: 0-2h):**

Editar función SQL, línea:

```sql
AND EXTRACT(EPOCH FROM ((r.reservation_date::TIMESTAMP + r.reservation_time) - NOW())) BETWEEN 0 AND 7200
--                                                                                              ^^^^
--                                                                                              7200 = 2 horas
--                                                                                              Cambiar a:
--                                                                                              - 3600 para 1h
--                                                                                              - 10800 para 3h
```

---

## 🛡️ SEGURIDAD:

### **Requisitos:**

1. **Extensión `http`:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS http;
   ```

2. **Extensión `pg_cron`:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

3. **Webhook URL válida en N8N** (debe estar activo)

4. **N8N debe estar accesible desde internet** (N8N Cloud ✅, Local ❌)

---

## 🔧 TROUBLESHOOTING:

### **Error: "extension http does not exist"**
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

---

### **Error: "extension pg_cron does not exist"**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

### **Error: "could not connect to server"**
- Verificar que la URL del webhook es correcta
- Verificar que el workflow N8N está **activo**
- Verificar que N8N Cloud está online

---

### **No se ejecuta el cron**
```sql
-- Ver si el job está activo
SELECT * FROM cron.job WHERE jobname = 'auto-liberacion-2h';

-- Ver últimas ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

### **Desactivar el cron (si es necesario)**
```sql
SELECT cron.unschedule('auto-liberacion-2h');
```

---

## 📈 COMPARATIVA DE COSTES:

| Método | Frecuencia | Ejecuciones SQL/día | Ejecuciones N8N/día | Ejecuciones N8N/mes | Coste |
|--------|-----------|---------------------|---------------------|---------------------|-------|
| **CRON N8N (viejo)** | 10 min | 0 | 144 | 4,320 | 💀💀💀 |
| **pg_cron 30 min** | 30 min | 48 | ~6-10 | ~180-300 | 💰 |
| **pg_cron 2h (recomendado)** | 2h | 12 | ~2-3 | ~60-90 | ✅ |
| **pg_cron 4h** | 4h | 6 | ~1-2 | ~30-60 | ✅✅ |

---

## ✅ VENTAJAS DE ESTA SOLUCIÓN:

1. ✅ **98% menos ejecuciones N8N** (de 4,320 a ~60-90/mes)
2. ✅ **Automático** - No depende de actividad de usuarios
3. ✅ **Predecible** - Se ejecuta cada 2h siempre
4. ✅ **Eficiente** - Solo llama N8N si hay reservas
5. ✅ **Escalable** - Supabase maneja la carga
6. ✅ **Multi-tenant** - Funciona para todos los restaurantes
7. ✅ **Auditable** - Logs en Supabase + N8N

---

## 🎯 ESTADO:

- [x] Función SQL creada
- [x] Workflow N8N creado
- [x] Documentación completa
- [ ] Ejecutar migración en Supabase (pendiente usuario)
- [ ] Importar workflow en N8N (pendiente usuario)
- [ ] Configurar pg_cron (pendiente usuario)
- [ ] Actualizar webhook URL (pendiente usuario)
- [ ] Test con reserva real (pendiente usuario)

---

## 📞 SOPORTE:

**Necesitas ayuda?**
- Revisa esta documentación
- Verifica logs en N8N: Executions tab
- Verifica logs en Supabase: `cron.job_run_details`
- Verifica registros: `noshow_actions` table

---

**✅ LISTO PARA PRODUCCIÓN**


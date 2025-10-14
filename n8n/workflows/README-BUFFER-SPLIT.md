# 🔄 SISTEMA DE BUFFER DE WHATSAPP - ARQUITECTURA SPLIT

**Fecha:** 14 de octubre de 2025  
**Versión:** FINAL  
**Estado:** ✅ PRODUCCIÓN READY

---

## 🎯 PROBLEMA RESUELTO

### ❌ **PROBLEMA ANTERIOR:**
Cada mensaje de WhatsApp iniciaba una ejecución independiente del workflow. El nodo `Wait 10s` esperaba en cada ejecución por separado, causando que se procesaran **múltiples mensajes** en lugar de **uno consolidado**.

**Ejemplo del problema:**
```
Mensaje 1: "hola" → Ejecución 1 → Wait 10s → Procesa solo "hola"
Mensaje 2: "quiero reserva" → Ejecución 2 → Wait 10s → Procesa "hola\nquiero reserva"
Mensaje 3: "para 4" → Ejecución 3 → Wait 10s → Procesa todo
```

**Resultado:** 3 conversaciones en lugar de 1.

---

## ✅ **SOLUCIÓN IMPLEMENTADA**

Dividir el workflow en **2 workflows independientes**:

### **1A: ACUMULADOR (Webhook)**
- Recibe cada mensaje de WhatsApp
- Actualiza el buffer usando UPSERT atómico
- **Responde OK inmediatamente** (NO espera)
- **Ejecución rápida:** <500ms

### **1B: PROCESADOR (CRON)**
- Se ejecuta **cada 5 segundos** automáticamente
- Busca buffers con `last_message_at` > 10 segundos
- Procesa SOLO los buffers listos
- Elimina el buffer después de procesarlo
- Envía al Gateway Unificado

---

## 📊 FLUJO COMPLETO

### **ESCENARIO: Cliente envía 3 mensajes rápidos**

```
T=0s:  Cliente escribe "hola"
       ↓
       Workflow 1A: UPSERT buffer (buffer_key: +34671126148_1760425310000)
       ↓
       Responde OK → Twilio confirma recepción

T=2s:  Cliente escribe "quiero reserva"
       ↓
       Workflow 1A: UPSERT buffer (MISMO buffer_key)
       ↓
       Actualiza: messages = "hola\nquiero reserva"
       ↓
       Responde OK

T=4s:  Cliente escribe "para 4 personas"
       ↓
       Workflow 1A: UPSERT buffer (MISMO buffer_key)
       ↓
       Actualiza: messages = "hola\nquiero reserva\npara 4 personas"
       ↓
       Responde OK

T=5s:  Workflow 1B (CRON) ejecuta
       ↓
       Busca buffers con last_message_at > 10s
       ↓
       No encuentra ninguno (solo han pasado 5s)
       ↓
       Skip

T=10s: Workflow 1B (CRON) ejecuta
       ↓
       Busca buffers con last_message_at > 10s
       ↓
       No encuentra ninguno (solo han pasado 10s, pero el threshold es MAYOR que 10s)
       ↓
       Skip

T=15s: Workflow 1B (CRON) ejecuta
       ↓
       Encuentra buffer con last_message_at = T+4s (11s atrás) ✅
       ↓
       Procesa: "hola\nquiero reserva\npara 4 personas"
       ↓
       Envía al Gateway → Super Agent responde
       ↓
       Elimina buffer
```

**RESULTADO:** 1 sola conversación con 3 mensajes consolidados ✅

---

## 🗄️ TABLA: whatsapp_message_buffer

### Estructura:
```sql
CREATE TABLE whatsapp_message_buffer (
  buffer_key VARCHAR PRIMARY KEY,        -- +34XXX_timestamp (ventana 10s)
  restaurant_id UUID,
  customer_phone VARCHAR,
  customer_name VARCHAR,
  messages TEXT,                         -- Mensajes concatenados con \n
  message_count INTEGER,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,          -- CRÍTICO: se actualiza con cada mensaje
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Función UPSERT:
```sql
CREATE OR REPLACE FUNCTION upsert_whatsapp_buffer(
  p_buffer_key VARCHAR,
  p_restaurant_id UUID,
  p_customer_phone VARCHAR,
  p_customer_name VARCHAR,
  p_message_text TEXT,
  p_timestamp TIMESTAMPTZ
)
RETURNS TABLE (
  buffer_key VARCHAR,
  restaurant_id UUID,
  customer_phone VARCHAR,
  customer_name VARCHAR,
  messages TEXT,
  message_count INTEGER,
  is_new BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO whatsapp_message_buffer (
    buffer_key,
    restaurant_id,
    customer_phone,
    customer_name,
    messages,
    message_count,
    first_message_at,
    last_message_at
  )
  VALUES (
    p_buffer_key,
    p_restaurant_id,
    p_customer_phone,
    p_customer_name,
    p_message_text,
    1,
    p_timestamp,
    p_timestamp
  )
  ON CONFLICT (buffer_key) DO UPDATE SET
    messages = whatsapp_message_buffer.messages || E'\n' || p_message_text,
    message_count = whatsapp_message_buffer.message_count + 1,
    last_message_at = p_timestamp,
    updated_at = NOW()
  RETURNING
    whatsapp_message_buffer.buffer_key,
    whatsapp_message_buffer.restaurant_id,
    whatsapp_message_buffer.customer_phone,
    whatsapp_message_buffer.customer_name,
    whatsapp_message_buffer.messages,
    whatsapp_message_buffer.message_count,
    (xmax = 0) AS is_new;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 INSTALACIÓN

### **PASO 1: Verificar función UPSERT en Supabase**

Ejecuta este script en Supabase SQL Editor:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'upsert_whatsapp_buffer';
```

**Si NO devuelve resultados:** Ejecuta el script completo de la función (arriba).

---

### **PASO 2: Importar Workflow 1A (ACUMULADOR)**

1. Abre N8N
2. Click en **"Import from File"**
3. Selecciona `1A-whatsapp-buffer-ACUMULADOR.json`
4. **Activa el workflow** ✅

---

### **PASO 3: Importar Workflow 1B (PROCESADOR)**

1. Abre N8N
2. Click en **"Import from File"**
3. Selecciona `1B-whatsapp-buffer-PROCESADOR.json`
4. **Activa el workflow** ✅

---

### **PASO 4: Verificar Gateway ID**

En el Workflow 1B, nodo **"🚀 Ejecutar Gateway"**, verifica que el `workflowId` sea correcto:

```json
"workflowId": {
  "__rl": true,
  "value": "5LobAwicedK8INQQ",  // ← Verifica que sea tu Gateway ID
  "mode": "list"
}
```

---

## 🧪 PRUEBAS

### **Prueba 1: Mensajes rápidos (buffer funciona)**

1. Envía 3 mensajes rápidos por WhatsApp:
   - "hola"
   - "quiero reserva"
   - "para 4 mañana"

2. Espera 15 segundos

3. Verifica en Supabase:
```sql
-- Ver última conversación
SELECT 
    c.customer_name,
    m.sender,
    m.message_text,
    m.timestamp
FROM agent_conversations c
JOIN agent_messages m ON m.conversation_id = c.id
WHERE c.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
ORDER BY c.created_at DESC, m.timestamp ASC
LIMIT 10;
```

**Resultado esperado:** 1 conversación con 2 mensajes:
- `customer`: "hola\nquiero reserva\npara 4 mañana" (concatenado)
- `agent`: respuesta del agente

---

### **Prueba 2: Mensajes lentos (sin buffer)**

1. Envía 1 mensaje por WhatsApp: "hola"
2. Espera 20 segundos
3. Envía otro mensaje: "adiós"

**Resultado esperado:** 2 conversaciones independientes

---

### **Prueba 3: Verificar buffer vacío**

```sql
-- Debe estar vacío (o con buffers recientes < 10s)
SELECT 
    buffer_key,
    messages,
    message_count,
    EXTRACT(EPOCH FROM (NOW() - last_message_at)) as seconds_ago
FROM whatsapp_message_buffer
ORDER BY created_at DESC;
```

---

## 📊 MONITOREO

### **Script 1: Ver buffers activos**

```sql
SELECT 
    buffer_key,
    customer_name,
    message_count,
    EXTRACT(EPOCH FROM (NOW() - last_message_at)) as seconds_ago,
    messages
FROM whatsapp_message_buffer
ORDER BY created_at DESC;
```

---

### **Script 2: Ver ejecuciones del CRON**

En N8N:
1. Abre Workflow 1B
2. Click en **"Executions"**
3. Verifica que se ejecuta cada 5 segundos
4. Revisa los logs de cada ejecución

---

### **Script 3: Ver buffers huérfanos (>1 hora)**

```sql
-- Buffers que NO se procesaron (error)
SELECT 
    buffer_key,
    customer_name,
    messages,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - last_message_at)) / 60 as minutes_ago
FROM whatsapp_message_buffer
WHERE last_message_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at;
```

**Si encuentras buffers huérfanos:** Revisa los logs del Workflow 1B para ver si hay errores.

---

## 🧹 LIMPIEZA AUTOMÁTICA

### **Safety Net: Eliminar buffers huérfanos cada hora**

Ejecuta esto en Supabase (requiere extensión `pg_cron`):

```sql
-- Habilitar pg_cron (solo una vez)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar limpieza
SELECT cron.schedule(
  'cleanup-buffer-hourly',
  '0 * * * *',  -- Cada hora
  $$
  DELETE FROM whatsapp_message_buffer
  WHERE last_message_at < NOW() - INTERVAL '1 hour';
  $$
);

-- Verificar que se creó
SELECT * FROM cron.job WHERE jobname = 'cleanup-buffer-hourly';
```

---

## ⚙️ CONFIGURACIÓN

### **Cambiar tiempo de espera (10 segundos → X segundos)**

En **Workflow 1B**, nodo **"🔍 Filtrar Listos (>10s)"**, modifica esta línea:

```javascript
return secondsAgo >= 10;  // ← Cambiar este número
```

**Ejemplo para 15 segundos:**
```javascript
return secondsAgo >= 15;
```

---

### **Cambiar frecuencia del CRON (5 segundos → X segundos)**

En **Workflow 1B**, nodo **"⏰ Cada 5 segundos"**, modifica:

```json
"rule": {
  "interval": [
    {
      "field": "seconds",
      "secondsInterval": 5  // ← Cambiar este número
    }
  ]
}
```

---

## 🚨 TROUBLESHOOTING

### **Problema 1: Buffers no se procesan**

**Síntomas:** Buffers se acumulan en la tabla y nunca se eliminan.

**Causa:** Workflow 1B no está activo.

**Solución:**
1. Abre Workflow 1B en N8N
2. Verifica que el toggle en la esquina superior derecha esté **ACTIVO** (verde)
3. Verifica las ejecuciones recientes

---

### **Problema 2: Mensajes se procesan inmediatamente (no esperan)**

**Síntomas:** Cada mensaje se procesa por separado, incluso si se envían rápido.

**Causa:** El filtro en Workflow 1B está demasiado bajo.

**Solución:** Aumenta el threshold de `>= 10` a `>= 15` segundos.

---

### **Problema 3: Error "Gateway not found"**

**Síntomas:** Workflow 1B falla con error "Workflow not found".

**Causa:** El `workflowId` del Gateway es incorrecto.

**Solución:**
1. Abre el Workflow 2 (Gateway Unificado)
2. Copia el ID de la URL (ej: `5LobAwicedK8INQQ`)
3. Actualiza el nodo "🚀 Ejecutar Gateway" en Workflow 1B

---

## 📚 REFERENCIAS

- **Workflow 1A:** `1A-whatsapp-buffer-ACUMULADOR.json`
- **Workflow 1B:** `1B-whatsapp-buffer-PROCESADOR.json`
- **Función SQL:** `supabase/migrations/20251013_005_upsert_whatsapp_buffer.sql`
- **Auditoría completa:** `AUDITORIA_ALMACENAMIENTO_COMPLETA.md`

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Función `upsert_whatsapp_buffer` existe en Supabase
- [ ] Workflow 1A importado y activo
- [ ] Workflow 1B importado y activo
- [ ] Gateway ID correcto en Workflow 1B
- [ ] Prueba con 3 mensajes rápidos → 1 conversación
- [ ] Buffer se elimina después de procesar
- [ ] CRON de limpieza programado (opcional)

---

**FIN DE DOCUMENTACIÓN** ✅


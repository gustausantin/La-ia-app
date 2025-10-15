# 📋 **EXPLICACIÓN: ¿DÓNDE SE GUARDAN LOS MENSAJES?**

---

## 🔄 **FLUJO COMPLETO: Desde tu WhatsApp hasta la Base de Datos**

---

### **1️⃣ ENVÍAS UN MENSAJE POR WHATSAPP**

```
Tú escribes: "he intenado conatctar con vosotros 1000 veces. Necesitop hablar con el encargado."
```

---

### **2️⃣ TWILIO RECIBE EL MENSAJE**

Twilio detecta tu mensaje y hace un **webhook POST** a N8N.

---

### **3️⃣ WORKFLOW 2: GATEWAY UNIFICADO**

**📄 Archivo:** `n8n/workflows/2-gateway-unificado-FINAL.json`

**📍 Nodo:** `💾 Guardar Mensaje` (línea 232-271)

**🎯 Qué hace:**
- Guarda tu mensaje en la tabla `agent_messages` de Supabase
- Marca como `direction: "inbound"` (mensaje entrante del cliente)
- Marca como `sender: "customer"`

**📊 SQL equivalente:**
```sql
INSERT INTO agent_messages (
    conversation_id,
    restaurant_id,
    direction,
    sender,
    message_text,
    timestamp
) VALUES (
    '<conversation_id>',
    'd6b63130-1ebf-4284-98fc-a3b31a85d9d1',  -- Casa Paco
    'inbound',
    'customer',
    'he intenado conatctar con vosotros 1000 veces. Necesitop hablar con el encargado.',  ← TU MENSAJE
    '2025-10-15T08:45:00Z'
);
```

**✅ RESULTADO:** Tu mensaje YA está guardado en `agent_messages` con `direction = 'inbound'`

---

### **4️⃣ WORKFLOW 3: SUPER AGENT HÍBRIDO**

**📄 Archivo:** `n8n/workflows/3-super-agent-hibrido-FINAL.json`

**🎯 Qué hace:**
1. Recibe el contexto del Gateway (incluyendo tu mensaje)
2. Clasifica tu mensaje (detecta: "necesito hablar con el encargado" → `cliente_solicita`)
3. Decide usar respuesta fija → "Por supuesto, te paso con el encargado"
4. **Guarda la RESPUESTA DEL AGENTE** en `agent_messages`

**📍 Nodo:** `💾 Guardar Respuesta en BD` (línea 297-343)

**📊 SQL equivalente:**
```sql
INSERT INTO agent_messages (
    conversation_id,
    restaurant_id,
    direction,
    sender,
    message_text,
    timestamp
) VALUES (
    '<conversation_id>',
    'd6b63130-1ebf-4284-98fc-a3b31a85d9d1',
    'outbound',  ← Respuesta del agente
    'agent',
    'Por supuesto, te paso con el encargado. Un momento, por favor.',  ← RESPUESTA
    '2025-10-15T08:45:05Z'
);
```

---

### **5️⃣ TOOL-6: ESCALATE TO HUMAN**

**📄 Archivo:** `n8n/workflows/TOOL-6-FINAL-CON-BUSQUEDA-MENSAJE.json`

**🎯 Qué hace:**
1. **📍 Nodo: `🔍 Buscar Mensaje + Debug`**
   - Hace una query a Supabase para buscar tu mensaje original:
   
   ```javascript
   const response = await fetch(
     `https://uvjqrldtjhopfdvydywt.supabase.co/rest/v1/agent_messages?conversation_id=eq.${input.conversation_id}&direction=eq.inbound&order=timestamp.desc&limit=1`,
     ...
   );
   ```
   
   **SQL equivalente:**
   ```sql
   SELECT message_text, timestamp
   FROM agent_messages
   WHERE conversation_id = '<conversation_id>'
     AND direction = 'inbound'  ← Solo mensajes DEL CLIENTE
   ORDER BY timestamp DESC
   LIMIT 1;  ← El más reciente
   ```

2. **📍 Nodo: `📋 Preparar Escalado`**
   - Usa el `message_text` recuperado de la BD
   - Lo incluye en el mensaje de alerta

3. **📍 Nodo: `📱 Enviar WhatsApp Urgente`**
   - Envía al encargado:
   ```
   🚨🚨🚨 ALERTA - CLIENTE NECESITA ATENCIÓN
   
   💬 Mensaje del cliente:
   "he intenado conatctar con vosotros 1000 veces. Necesitop hablar con el encargado."  ← TU MENSAJE
   ```

---

## 📊 **TABLA EN SUPABASE: `agent_messages`**

Después de todo este flujo, la tabla `agent_messages` tiene **2 filas** para esta conversación:

| id | conversation_id | direction | sender | message_text | timestamp |
|----|----------------|-----------|--------|--------------|-----------|
| uuid-1 | abc-123 | **inbound** | **customer** | "he intenado conatctar..." | 08:45:00 |
| uuid-2 | abc-123 | **outbound** | **agent** | "Por supuesto, te paso..." | 08:45:05 |

---

## 🔍 **¿POR QUÉ TOOL-6 BUSCA EN LA BD?**

**Problema:**
Cuando el Super Agent llama a TOOL-6, NO le pasa directamente tu mensaje original. Solo le pasa:
- `conversation_id`
- `customer_phone`
- `customer_name`
- `reason: "cliente_solicita"`

**Solución:**
TOOL-6 usa el `conversation_id` para buscar en `agent_messages` el último mensaje `inbound` (del cliente) de esa conversación.

---

## ❌ **¿POR QUÉ ESTABA FALLANDO?**

**ANTES:**
- Intentaba usar un nodo de Supabase con filtros
- Los filtros NO se aplicaban correctamente
- Devolvía mensajes de OTRA conversación

**AHORA:**
- Usa `fetch()` directo con la API REST de Supabase
- Query explícita con filtros claros:
  - `conversation_id=eq.<tu_conversation_id>`
  - `direction=eq.inbound`
  - `order=timestamp.desc`
  - `limit=1`
- **Garantiza** que solo busca TU mensaje en TU conversación

---

## 📍 **RESUMEN: ¿DÓNDE ESTÁ CADA COSA?**

| Paso | Workflow | Nodo | Qué guarda | Tabla |
|------|----------|------|------------|-------|
| 1 | **Workflow 2** (Gateway) | `💾 Guardar Mensaje` | Tu mensaje original (`inbound`) | `agent_messages` |
| 2 | **Workflow 3** (Super Agent) | `💾 Guardar Respuesta en BD` | Respuesta del agente (`outbound`) | `agent_messages` |
| 3 | **TOOL-6** (Escalate) | `🔍 Buscar Mensaje + Debug` | **LEE** tu mensaje de la BD | `agent_messages` |
| 4 | **TOOL-6** (Escalate) | `💾 Registrar Escalado` | Info del escalado | `escalations` |

---

## ✅ **VERIFICACIÓN: ¿Está guardado mi mensaje?**

Puedes verificarlo con esta query en Supabase:

```sql
SELECT 
    conversation_id,
    direction,
    sender,
    message_text,
    timestamp
FROM agent_messages
WHERE customer_phone = '+34671126148'
ORDER BY timestamp DESC
LIMIT 10;
```

Deberías ver:
- Tu mensaje: `direction = 'inbound'`, `sender = 'customer'`
- Respuesta: `direction = 'outbound'`, `sender = 'agent'`

---

## 🎯 **CONCLUSIÓN**

**Tu mensaje SÍ se guarda correctamente** en el **Workflow 2 (Gateway)**, en el nodo `💾 Guardar Mensaje`.

**El problema era:** TOOL-6 NO lo estaba recuperando bien de la BD porque la query de Supabase no filtraba correctamente por `conversation_id`.

**La solución:** Usar `fetch()` directo con la API REST de Supabase, con filtros explícitos y correctos.

---

**🚀 Reimporta el workflow corregido y pruébalo de nuevo.**


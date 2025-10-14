# 📋 Instrucciones para Implementar Sistema Híbrido

## 🎯 OBJETIVO
Convertir el Workflow 3 actual en un sistema híbrido controlado con 6 herramientas y respuestas fijas.

---

## ✅ PASO 1: Crear Tabla `escalations` en Supabase

1. Ir a Supabase SQL Editor
2. Ejecutar: `supabase/migrations/20251014_007_create_escalations_table.sql`
3. Verificar que la tabla se creó correctamente:
```sql
SELECT * FROM escalations LIMIT 1;
```

---

## ✅ PASO 2: Crear Workflow de Escalado a Humano

1. Importar en N8N: `n8n/workflows/TOOL-6-escalate-to-human.json`
2. **Configurar credenciales:**
   - Supabase: "Supabase La-IA"
   - Twilio: "Twilio account"
3. **Activar workflow**
4. **Copiar el ID del workflow** (lo necesitarás en Paso 3, NODO 5)

---

## ✅ PASO 3: Modificar Workflow 3 (Super Agent)

### 🎯 RESUMEN: Vas a añadir 5 nodos nuevos en orden

```
Fusionar Contexto → [1] Lógica Híbrida → [2] IF → [3] Preparar Fija → [4] Necesita Escalado → [5] Escalar a Humano
```

---

### **NODO 1:** `🔀 Lógica Híbrida`

**Tipo:** Code Node  
**Posición:** DESPUÉS de "🔗 Fusionar Contexto Enriquecido"  
**Código:** Copiar TODO de `n8n/workflows/LOGICA-HIBRIDA-SIMPLIFICADA.js`  
**Conexión OUT:** → NODO 2

---

### **NODO 2:** `❓ ¿Usar Respuesta Fija?`

**Tipo:** IF Node  
**Condición:** `{{ $json.use_fixed_response }} is true`  
**Conexiones:**
- **TRUE** → NODO 3 (Preparar Respuesta Fija)
- **FALSE** → `🤖 Super Agent (GPT-4o)` (el que ya existe)

---

### **NODO 3:** `📝 Preparar Respuesta Fija`

**Tipo:** Code Node  
**Posición:** Rama TRUE del NODO 2  
**Código:**
```javascript
const data = $input.first().json;

return {
  conversation_id: data.conversation_id,
  customer_id: data.customer_id,
  customer_phone: data.customer_phone,
  customer_name: data.customer_name,
  restaurant_id: data.restaurant_id,
  channel: data.channel,
  agent_response: data.fixed_message,
  classification: data.classification,
  timestamp: new Date().toISOString(),
  should_escalate: data.should_escalate,
  escalate_reason: data.escalate_reason,
  escalate_urgency: data.escalate_urgency,
  whatsapp_from: data.restaurant_context?.phone || '',
  whatsapp_to: data.customer_phone
};
```
**Conexión OUT:** → NODO 4

---

### **NODO 4:** `❓ ¿Necesita Escalado?`

**Tipo:** IF Node  
**Condición:** `{{ $json.should_escalate }} is true`  
**Conexiones:**
- **TRUE** → NODO 5 (Escalar a Humano)
- **FALSE** → `💾 Guardar Respuesta en BD` (el que ya existe)

---

### **NODO 5:** `🆘 Escalar a Humano`

**Tipo:** Execute Workflow Node  
**Workflow:** Busca "TOOL-6-escalate-to-human" o usa el ID que copiaste en Paso 2  
**Parámetros:**
```json
{
  "restaurant_id": "{{ $json.restaurant_id }}",
  "customer_phone": "{{ $json.customer_phone }}",
  "customer_name": "{{ $json.customer_name }}",
  "customer_message": "{{ $json.classification.intent }}",
  "reason": "{{ $json.escalate_reason }}",
  "urgency": "{{ $json.escalate_urgency }}",
  "restaurant_name": "{{ $json.restaurant_context?.name }}",
  "restaurant_phone_for_escalation": "{{ $json.whatsapp_from }}",
  "conversation_id": "{{ $json.conversation_id }}"
}
```
**Conexión OUT:** → `💾 Guardar Respuesta en BD` (el que ya existe)

---

### 🔗 CONEXIONES FINALES (IMPORTANTE)

**Todos los caminos llevan a Roma:**

1. **Rama FIJA + ESCALADO:**  
   Lógica → IF (TRUE) → Preparar → Escalado (TRUE) → Escalar a Humano → `💾 Guardar Respuesta en BD`

2. **Rama FIJA SIN ESCALADO:**  
   Lógica → IF (TRUE) → Preparar → Escalado (FALSE) → `💾 Guardar Respuesta en BD`

3. **Rama LLM (actual):**  
   Lógica → IF (FALSE) → `🤖 Super Agent` → `📤 Procesar Respuesta` → `💾 Guardar Respuesta en BD`

**Después de `💾 Guardar Respuesta en BD`:** (esto ya existe, no toques nada)  
→ `📱 Enviar WhatsApp` → `🔀 Preparar Actualización` → `🔄 Actualizar Conversación`

---

## ✅ PASO 4: Añadir Tool "Escalate to Human" al Super Agent

**Posición:** Al lado de las otras 5 tools

**Nombre:** `🔧 Tool: Escalate to Human`

**Tipo:** Tool Workflow

**Configuración:**
```
name: escalate_to_human
description: Escala la conversación a un humano del restaurante cuando el agente no puede ayudar, el cliente lo solicita, o hay una queja grave.

workflowId: [ID DEL WORKFLOW del Paso 2]

fields:
- customer_phone
- customer_name
- customer_message
- reason
- urgency
```

**Conexión:**
→ Conectar a "🤖 Super Agent (GPT-4o)"

---

## ✅ PASO 5: Actualizar Prompt del Super Agent

1. Ir al nodo "🤖 Super Agent (GPT-4o)"
2. En "System Message", reemplazar TODO el contenido con:
   - Copiar de: `n8n/prompts/super-agent-ESTRICTO-CONTROLADO.txt`
3. Guardar

---

## ✅ PASO 6: Testing

### Test 1: Feedback Positivo
```
Mensaje: "Todo estuvo excelente, muy buena comida!"
Esperado: Respuesta fija sin escalado
```

### Test 2: Queja
```
Mensaje: "La comida estaba fría"
Esperado: Respuesta fija + escalado automático + WhatsApp al restaurante
```

### Test 3: Cliente Pide Humano
```
Mensaje: "¿Puedo hablar con el encargado?"
Esperado: Respuesta fija + escalado
```

### Test 4: Reserva Normal
```
Mensaje: "Quiero reservar para mañana"
Esperado: LLM conversacional (flujo actual)
```

### Test 5: Escalado Manual desde LLM
```
Si el LLM no puede ayudar, debería usar escalate_to_human tool
```

---

## ✅ PASO 7: Verificación en Supabase

### Verificar escalados registrados:
```sql
SELECT 
  id,
  customer_name,
  reason,
  urgency,
  status,
  escalated_at,
  customer_message
FROM escalations
ORDER BY escalated_at DESC
LIMIT 10;
```

### Verificar respuestas del agente:
```sql
SELECT 
  ac.customer_name,
  ac.interaction_type,
  ac.sentiment,
  am.message_text,
  am.created_at
FROM agent_conversations ac
JOIN agent_messages am ON am.conversation_id = ac.id
WHERE am.sender = 'agent'
ORDER BY am.created_at DESC
LIMIT 10;
```

---

## 📊 DIAGRAMA VISUAL DEL FLUJO MODIFICADO

```
┌──────────────────┐
│ Clasificador LLM │
└────────┬─────────┘
         ↓
     ┌───┴────┐
     │ 3 NODOS│ (paralelos: Reservas, Restaurante, Horarios)
     │Supabase│
     └───┬────┘
         ↓
    ┌────────┐
    │ Merge1 │ ← Combina 4 inputs
    └────┬───┘
         ↓
┌─────────────────────┐
│ 🔗 Fusionar Contexto│ ← Normaliza y limpia todo
└────────┬────────────┘
         ↓
┌─────────────────────┐
│ 🔀 Lógica Híbrida   │ ← NUEVO (recibe contexto limpio)
└────────┬────────────┘
         ↓
┌─────────────────────┐
│ ❓ ¿Usar Fija?      │ ← NUEVO
└──┬──────────────┬───┘
   │ TRUE         │ FALSE
   ↓              ↓
┌────────┐    ┌─────────────┐
│ Fija   │    │ Super Agent │
└───┬────┘    │  (LLM)      │
    ↓         └──────┬──────┘
┌────────────┐       │
│ ¿Escalar?  │←NUEVO │
└──┬─────────┘       │
   ↓ (si)            │
┌────────────┐       │
│🆘 Escalar  │←NUEVO │
└──┬─────────┘       │
   ↓                 ↓
   └────────┬────────┘
            ↓
   ┌──────────────┐
   │ WhatsApp     │
   └──────────────┘
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Credenciales:** Asegúrate de que Twilio y Supabase están configurados
2. **IDs:** Los IDs de workflows son específicos de tu instalación
3. **Testing:** Prueba TODO antes de activar en producción
4. **Logs:** Monitorea los logs de N8N durante las primeras horas
5. **Supabase:** Verifica que la tabla `escalations` se crea correctamente

---

## 🆘 TROUBLESHOOTING

### Error: "Tabla escalations no existe"
→ Ejecutar migración SQL en Supabase

### Error: "Tool escalate_to_human no encontrado"
→ Verificar que el workflow de escalado está importado y activo en N8N

### Respuestas fijas no funcionan
→ Revisar que el nodo "🔀 Lógica Híbrida" está conectado correctamente

### Escalado no envía WhatsApp
→ Verificar credenciales de Twilio en el workflow de escalado a humano

---

**Tiempo estimado de implementación:** 30-45 minutos  
**Dificultad:** Media  
**Riesgo:** Bajo (puedes revertir fácilmente)


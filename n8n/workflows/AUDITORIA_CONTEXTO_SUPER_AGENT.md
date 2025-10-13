# 🔍 AUDITORÍA: CONTEXTO DEL SUPER AGENT

## 📊 RESUMEN EJECUTIVO

**Estado:** ❌ **FALTAN DATOS CRÍTICOS**

---

## 1️⃣ DATOS QUE RECIBE EL SUPER AGENT (desde "🔗 Fusionar Contexto Enriquecido")

```javascript
{
  // ✅ Datos originales
  conversation_id: classifiedData.conversation_id,
  customer_id: classifiedData.customer_id,
  customer_name: classifiedData.customer_name,
  customer_phone: classifiedData.customer_phone,
  restaurant_id: classifiedData.restaurant_id,
  channel: classifiedData.channel,
  user_message: classifiedData.user_message,
  timestamp: classifiedData.timestamp,
  
  // ✅ Clasificación del LLM
  classification: {
    intent: classifiedData.intent,
    entities: classifiedData.entities,
    sentiment: classifiedData.sentiment,
    confidence: classifiedData.confidence,
    reasoning: classifiedData.classification.reasoning
  },
  
  // ✅ Contexto del cliente
  customer_context: {
    has_active_reservations: reservations.length > 0,
    reservations_count: reservations.length,
    reservations: reservations,
    reservations_summary: reservationsSummary
  },
  
  // ⚠️ Contexto del restaurante (INCOMPLETO)
  restaurant_context: {
    id: restaurant.id,
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    whatsapp: channels.whatsapp?.phone_number || '',
    operating_hours: operatingHours,
    hours_summary: hoursSummary,
    settings: settings  // ✅ TIENE settings
    // ❌ FALTA: agent_name
  }
}
```

---

## 2️⃣ DATOS QUE NECESITA EL PROMPT DEL SUPER AGENT

### ✅ **Datos disponibles:**
- `$json.restaurant_context.name` ✅
- `$json.restaurant_context.address` ✅
- `$json.restaurant_context.phone` ✅
- `$json.restaurant_context.email` ✅
- `$json.restaurant_context.hours_summary` ✅
- `$json.restaurant_context.settings.reservation_duration` ✅
- `$json.restaurant_context.settings.max_party_size` ✅
- `$json.customer_name` ✅
- `$json.customer_phone` ✅
- `$json.customer_context.reservations_summary` ✅
- `$json.classification.intent` ✅
- `$json.classification.confidence` ✅
- `$json.classification.sentiment` ✅
- `$json.classification.reasoning` ✅
- `$json.classification.entities.date` ✅
- `$json.classification.entities.time` ✅
- `$json.classification.entities.party_size` ✅
- `$json.classification.entities.reservation_id` ✅
- `$json.channel` ✅
- `$json.user_message` ✅

### ❌ **Datos NO disponibles:**
- `$json.restaurant_context.agent_name` ❌

---

## 3️⃣ PROBLEMA CRÍTICO DETECTADO

### ❌ **FALTA: `agent_name`**

**Usado en el prompt en:**
- Línea 1: `"Eres {{ $json.restaurant_context.agent_name || 'el asistente virtual' }}"`
- Línea 177: `"Soy {{ $json.restaurant_context.agent_name || 'el asistente' }}"`

**Solución:**
El nodo "🔗 Fusionar Contexto Enriquecido" debe extraer `agent_name` de `restaurant.settings.agent_name`.

---

## 4️⃣ SOLUCIÓN

### Modificar el nodo "🔗 Fusionar Contexto Enriquecido":

```javascript
// Contexto del restaurante
restaurant_context: {
  id: restaurant.id,
  name: restaurant.name,
  address: restaurant.address,
  phone: restaurant.phone,
  email: restaurant.email,
  whatsapp: channels.whatsapp?.phone_number || '',
  operating_hours: operatingHours,
  hours_summary: hoursSummary,
  settings: settings,
  agent_name: settings.agent_name || 'el asistente virtual'  // ✅ AGREGAR ESTA LÍNEA
}
```

---

## 5️⃣ VERIFICACIÓN FINAL

Una vez aplicado el fix, el Super Agent tendrá acceso a:

✅ **TODOS** los datos del cliente  
✅ **TODOS** los datos del restaurante (incluyendo `agent_name`)  
✅ **TODA** la clasificación del LLM Classifier  
✅ **TODAS** las reservas activas del cliente  
✅ **TODOS** los horarios del restaurante  

---

## 📋 ACCIÓN REQUERIDA

**Actualizar el archivo:** `n8n/workflows/3-super-agent-hibrido-ACTUAL.json`

**Nodo a modificar:** "🔗 Fusionar Contexto Enriquecido" (id: `549b50f0-01da-4fde-b558-ad90237fd229`)

**Línea a agregar en `restaurant_context`:**
```javascript
agent_name: settings.agent_name || 'el asistente virtual'
```


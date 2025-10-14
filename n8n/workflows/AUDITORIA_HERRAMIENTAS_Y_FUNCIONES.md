# 🔍 AUDITORÍA COMPLETA: HERRAMIENTAS Y FUNCIONES DISPONIBLES

**Fecha:** 14 Octubre 2025  
**Objetivo:** Verificar nombres exactos de herramientas en N8N y funciones RPC en Supabase

---

## 📋 1. HERRAMIENTAS DISPONIBLES EN N8N (Workflow 3)

Estas son las **5 herramientas** definidas en `3-super-agent-hibrido-ACTUAL.json`:

### ✅ **Tool 1: `get_restaurant_info`**
- **Nodo:** `🔧 Tool: Info Restaurante` (línea 401)
- **Descripción:** "Obtiene información del restaurante: horarios, menú, servicios, ubicación, políticas, etc."
- **Parámetros:**
  - `info_type` (string)

---

### ✅ **Tool 2: `check_availability`**
- **Nodo:** `🔧 Tool: Consultar Disponibilidad` (línea 375)
- **Descripción:** "Consulta la disponibilidad del restaurante para una fecha, hora y número de personas específicos."
- **Parámetros:**
  - `date` (string)
  - `time` (string)
  - `party_size` (number)

---

### ✅ **Tool 3: `cancel_reservation`**
- **Nodo:** `🔧 Tool: Cancelar Reserva` (línea 343)
- **Descripción:** "Cancela una reserva existente."
- **Parámetros:**
  - `reservation_id` (string)
  - `cancellation_reason` (string)

---

### ✅ **Tool 4: `modify_reservation`**
- **Nodo:** `🔧 Tool: Modificar Reserva` (línea 314)
- **Descripción:** "Modifica una reserva existente."
- **Parámetros:**
  - `reservation_id` (string)
  - `new_date` (string)
  - `new_time` (string)
  - `new_party_size` (number)

---

### ✅ **Tool 5: `create_reservation`**
- **Nodo:** `🔧 Tool: Crear Reserva` (línea 279)
- **Descripción:** "Crea una nueva reserva en el restaurante."
- **Parámetros:**
  - `reservation_date` (string)
  - `reservation_time` (string)
  - `party_size` (number)
  - `special_requests` (string)

---

## 🗄️ 2. FUNCIONES RPC EN SUPABASE (para referencia)

Estas son las funciones que **realmente existen** en Supabase según `AvailabilityService.js`:

### **Función: `check_availability`**
```javascript
await supabase.rpc('check_availability', {
  p_restaurant_id: restaurantId,
  p_date: date,
  p_time: time,
  p_party_size: partySize,
  p_duration_minutes: durationMinutes
});
```
**Retorna:**
- `available_slots` (number)
- `suggested_times` (array)
- `available_tables` (array)
- `hasAvailability` (boolean)

---

### **Función: `book_table`**
```javascript
await supabase.rpc('book_table', {
  p_restaurant_id: restaurantId,
  p_date: date,
  p_time: time,
  p_party_size: partySize,
  p_channel: channel,
  p_customer: customer,
  p_duration_minutes: durationMinutes,
  p_special_requests: specialRequests
});
```
**Retorna:**
- `success` (boolean)
- `reservation_id` (UUID)
- `table_info` (object)
- `message` (string)

---

## 📊 3. CONTEXTO ENRIQUECIDO DISPONIBLE

El nodo `🔗 Fusionar Contexto Enriquecido` proporciona estos datos al Super Agent:

### **Estructura del contexto:**
```javascript
{
  // Identificadores
  conversation_id: "UUID",
  customer_id: "UUID",
  customer_name: "Gustau",
  customer_phone: "+34671126148",
  restaurant_id: "UUID",
  channel: "whatsapp",
  user_message: "Hola!",
  timestamp: "2025-10-13T19:56:24.219Z",
  
  // Clasificación pre-procesada
  classification: {
    intent: "saludo",
    entities: {},
    sentiment: "neutral",
    confidence: 0.95,
    reasoning: "Clasificación automática"
  },
  
  // Contexto del cliente
  customer_context: {
    has_active_reservations: false,
    reservations_count: 0,
    reservations: [],
    reservations_summary: "No tiene reservas activas"
  },
  
  // Contexto del restaurante
  restaurant_context: {
    id: "UUID",
    name: "Casa Paco",
    address: "Felip II, 555",
    phone: "+14155238886",
    email: "gustausantin@icloud.com",
    whatsapp: "+14155238886",
    operating_hours: [],
    hours_summary: "Domingo: 18:00 - 22:00, Lunes: 10:00 - 22:00, ...",
    settings: {
      reservation_duration: 90,
      max_party_size: 12,
      min_booking_hours: 2,
      advance_booking_days: 30,
      cancellation_policy: "24h",
      agent: {
        name: "Daniela",
        role: "Agente de Reservas",
        bio: "Profesional, amable...",
        gender: "female"
      }
      // ... + otros settings
    },
    agent_name: "Daniela"
  }
}
```

---

## ✅ 4. CONCLUSIONES PARA EL PROMPT

### **Nombres correctos de herramientas a usar en el prompt:**

1. ✅ `get_restaurant_info` (NO "Info del restaurante")
2. ✅ `check_availability` (NO "Consultar disponibilidad")
3. ✅ `cancel_reservation` (NO "Cancelar reserva")
4. ✅ `modify_reservation` (NO "Modificar reserva")
5. ✅ `create_reservation` (NO "Crear reserva")

### **Parámetros exactos:**

**`check_availability`:**
- `date` (string: "YYYY-MM-DD")
- `time` (string: "HH:MM")
- `party_size` (number)

**`create_reservation`:**
- `reservation_date` (string: "YYYY-MM-DD")
- `reservation_time` (string: "HH:MM")
- `party_size` (number)
- `special_requests` (string)

**`modify_reservation`:**
- `reservation_id` (string: UUID)
- `new_date` (string: "YYYY-MM-DD", opcional)
- `new_time` (string: "HH:MM", opcional)
- `new_party_size` (number, opcional)

**`cancel_reservation`:**
- `reservation_id` (string: UUID)
- `cancellation_reason` (string, opcional)

**`get_restaurant_info`:**
- `info_type` (string: "menu" | "servicios" | "ubicacion" | "horarios" | "parking" | "contacto")

---

## ⚠️ ERRORES EN EL PROMPT ACTUAL

### **1. Sintaxis Handlebars incompatible:**
- ❌ `{{#if $json.customer_context.has_active_reservations}}`
- ❌ `{{else}}`
- ❌ `{{/if}}`
- ✅ N8N usa expresiones JavaScript simples con `={{ }}`

### **2. Operador ternario problemático:**
- ❌ `{{ $json.channel === 'whatsapp' ? 'WhatsApp' : 'teléfono' }}`
- ✅ Usar texto plano y dejar que el LLM interprete

### **3. Sobre-información:**
- ❌ Se envían ~2,500 tokens de contexto
- ✅ Debería enviarse ~400 tokens (solo lo esencial)

---

## 🎯 5. PLAN DE ACCIÓN

1. **Crear nuevo prompt** con:
   - Nombres correctos de herramientas
   - Parámetros exactos
   - Sin sintaxis Handlebars (solo variables simples)
   - Contexto optimizado

2. **Usar código optimizado** de `FIX_FUSIONAR_CONTEXTO_OPTIMIZADO.js`

3. **Probar** con mensaje de test

---

**AUDITORÍA COMPLETA ✅**



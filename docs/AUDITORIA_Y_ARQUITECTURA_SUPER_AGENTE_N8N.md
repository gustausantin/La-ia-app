# 🧠 AUDITORÍA COMPLETA Y ARQUITECTURA DEL SUPER AGENTE IA (N8N)

**Fecha:** 2 Octubre 2025  
**Versión:** 1.0  
**Estado:** Diseño Arquitectónico

---

## 📋 ÍNDICE

1. [Auditoría de Base de Datos](#1-auditoría-de-base-de-datos)
2. [Flujo Actual de Reservas](#2-flujo-actual-de-reservas)
3. [Canales de Comunicación](#3-canales-de-comunicación)
4. [Arquitectura Propuesta del Super Agente](#4-arquitectura-propuesta-del-super-agente)
5. [Especificación Técnica](#5-especificación-técnica)
6. [Plan de Implementación](#6-plan-de-implementación)

---

## 1. AUDITORÍA DE BASE DE DATOS

### 1.1 TABLAS PRINCIPALES (Estado Actual)

#### **RESERVAS Y OPERACIONES**
```sql
-- Tabla principal de reservas
reservations (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    customer_id UUID,
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR NOT NULL,
    customer_email VARCHAR,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL,
    status VARCHAR, -- 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
    source VARCHAR, -- 'agent', 'manual', 'web'
    special_requests TEXT,
    table_id UUID,
    created_by VARCHAR, -- 'agent', 'user'
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    metadata JSONB
)

-- Clientes
customers (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL UNIQUE,
    email VARCHAR,
    birthday DATE,
    total_spent DECIMAL(10,2) DEFAULT 0,
    visits_count INTEGER DEFAULT 0,
    last_visit_date DATE,
    segment_auto VARCHAR, -- 'nuevo', 'regular', 'vip', 'ocasional', 'inactivo'
    preferences TEXT,
    allergies TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- Mesas
tables (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    table_number VARCHAR NOT NULL,
    capacity INTEGER NOT NULL,
    zone VARCHAR NOT NULL,
    status VARCHAR, -- 'available', 'reserved', 'occupied', 'inactive'
    agent_priority INTEGER, -- Prioridad para asignación automática
    created_at TIMESTAMPTZ
)

-- Eventos especiales
special_events (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    event_date DATE NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR, -- 'holiday', 'private_event', 'maintenance'
    start_time TIME,
    end_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
)
```

#### **COMUNICACIONES Y AGENTE IA**
```sql
-- Conversaciones del agente (NUEVA - Ya migrada)
agent_conversations (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    customer_id UUID,
    customer_phone VARCHAR NOT NULL,
    customer_name VARCHAR,
    customer_email VARCHAR,
    source_channel VARCHAR NOT NULL, -- 'whatsapp', 'phone', 'instagram', 'facebook', 'webchat'
    interaction_type VARCHAR NOT NULL, -- 'reservation', 'modification', 'cancellation', 'inquiry', 'complaint', 'other'
    status VARCHAR DEFAULT 'active', -- 'active', 'resolved', 'abandoned'
    outcome VARCHAR, -- 'reservation_created', 'reservation_modified', 'reservation_cancelled', 'inquiry_answered', 'no_action', 'escalated'
    reservation_id UUID,
    created_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_time_seconds INTEGER, -- Calculado automáticamente
    sentiment VARCHAR, -- 'positive', 'neutral', 'negative'
    metadata JSONB
)

-- Mensajes del agente
agent_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    direction VARCHAR NOT NULL, -- 'inbound', 'outbound'
    sender VARCHAR NOT NULL, -- 'customer', 'agent', 'system'
    message_text TEXT NOT NULL,
    timestamp TIMESTAMPTZ,
    metadata JSONB,
    tokens_used INTEGER,
    confidence_score DECIMAL(3,2)
)
```

#### **CRM Y AUTOMATIZACIÓN**
```sql
-- Plantillas de mensajes
message_templates (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    channel VARCHAR NOT NULL, -- 'whatsapp', 'sms', 'email'
    content_markdown TEXT NOT NULL,
    variables TEXT[], -- ['customer_name', 'reservation_date', 'restaurant_name']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ
)

-- Reglas de automatización CRM
crm_automation_rules (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    rule_name VARCHAR NOT NULL,
    trigger_type VARCHAR NOT NULL, -- 'segment_change', 'reservation_completed', 'no_visit_days'
    trigger_conditions JSONB,
    action_type VARCHAR NOT NULL, -- 'send_message', 'create_alert', 'assign_segment'
    action_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0
)

-- Sugerencias del CRM
crm_suggestions (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    suggestion_type VARCHAR NOT NULL, -- 'win_back', 'birthday', 'vip_upgrade', 'feedback_request'
    priority VARCHAR, -- 'low', 'medium', 'high', 'critical'
    status VARCHAR DEFAULT 'pending', -- 'pending', 'executed', 'dismissed'
    suggested_action TEXT,
    suggested_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ
)
```

#### **FACTURACIÓN Y CONSUMOS**
```sql
-- Tickets de consumo
billing_tickets (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    reservation_id UUID,
    customer_id UUID,
    ticket_number VARCHAR UNIQUE,
    items JSONB NOT NULL, -- Array de items con nombre, cantidad, precio
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR,
    payment_status VARCHAR, -- 'pending', 'paid', 'cancelled'
    created_at TIMESTAMPTZ
)

-- Menú del restaurante
menu_items (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL, -- 'primeros', 'segundos', 'postres', 'bebidas'
    price DECIMAL(8,2) NOT NULL,
    cost DECIMAL(8,2),
    is_available BOOLEAN DEFAULT TRUE,
    allergens TEXT[],
    preparation_time INTEGER,
    popularity_score INTEGER DEFAULT 0
)
```

#### **CONFIGURACIÓN**
```sql
-- Restaurantes
restaurants (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    address VARCHAR,
    city VARCHAR,
    postal_code VARCHAR,
    cuisine_type VARCHAR,
    settings JSONB, -- Configuración completa del restaurante
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)

-- Configuración en settings JSONB:
{
    "agent": {
        "enabled": true,
        "name": "Sofia",
        "lastname": "Martínez",
        "role": "Agente de Reservas",
        "gender": "female",
        "avatar_url": "...",
        "bio": "...",
        "hired_date": "2025-10-01"
    },
    "general": {
        "contact_name": "Gustavo",
        "avg_ticket": 30
    },
    "reservation_duration": 120,
    "advance_booking_days": 60,
    "min_advance_hours": 2,
    "max_party_size": 12,
    "min_party_size": 1,
    "channels": {
        "voice": {
            "enabled": true,
            "phone_number": "+34600000000",
            "provider": "vapi"
        },
        "whatsapp": {
            "enabled": true,
            "phone_number": "+34600000000",
            "use_same_phone": true
        },
        "instagram": {
            "enabled": false
        },
        "facebook": {
            "enabled": false
        },
        "webchat": {
            "enabled": true,
            "site_domain": "restaurante.com"
        }
    }
}
```

---

## 2. FLUJO ACTUAL DE RESERVAS

### 2.1 CREACIÓN DE RESERVA

**Frontend (React):**
```javascript
// 1. Usuario introduce datos
const reservationData = {
    customer_name: "Juan Pérez",
    customer_phone: "+34600000000",
    customer_email: "juan@email.com",
    reservation_date: "2025-10-15",
    reservation_time: "20:30",
    party_size: 4,
    special_requests: "Mesa cerca de la ventana",
    source: "manual" | "agent" | "web",
    created_by: "user" | "agent"
}

// 2. Validaciones en frontend
- Comprobar disponibilidad en availability_slots
- Verificar capacidad (max_party_size, min_party_size)
- Validar horarios de apertura
- Comprobar eventos especiales (cerrado por evento)

// 3. Crear o buscar cliente
const customer = await supabase
    .from('customers')
    .upsert({
        restaurant_id,
        name: customer_name,
        phone: customer_phone,
        email: customer_email
    }, { onConflict: 'phone' })

// 4. Crear reserva
const reservation = await supabase
    .from('reservations')
    .insert({
        restaurant_id,
        customer_id: customer.id,
        customer_name,
        customer_phone,
        customer_email,
        reservation_date,
        reservation_time,
        party_size,
        status: 'confirmed',
        source: 'manual',
        created_by: 'user',
        special_requests
    })

// 5. Actualizar estadísticas del cliente
await supabase
    .from('customers')
    .update({
        visits_count: customer.visits_count + 1,
        last_visit_date: reservation_date
    })
    .eq('id', customer.id)
```

### 2.2 MODIFICACIÓN DE RESERVA

```javascript
// 1. Buscar reserva existente
const existingReservation = await supabase
    .from('reservations')
    .select('*')
    .eq('id', reservationId)
    .single()

// 2. Validar nueva disponibilidad (si cambió fecha/hora)
if (newDate !== oldDate || newTime !== oldTime) {
    // Comprobar availability_slots
}

// 3. Actualizar reserva
await supabase
    .from('reservations')
    .update({
        reservation_date: newDate,
        reservation_time: newTime,
        party_size: newPartySize,
        special_requests: newRequests,
        updated_at: new Date()
    })
    .eq('id', reservationId)

// 4. Registrar en agent_conversations (si fue el agente)
if (source === 'agent') {
    await supabase
        .from('agent_conversations')
        .update({
            outcome: 'reservation_modified',
            status: 'resolved'
        })
        .eq('reservation_id', reservationId)
}
```

### 2.3 CANCELACIÓN DE RESERVA

```javascript
// 1. Actualizar estado
await supabase
    .from('reservations')
    .update({
        status: 'cancelled',
        updated_at: new Date()
    })
    .eq('id', reservationId)

// 2. Enviar mensaje de seguimiento (opcional)
// - Plantilla "Cancelación - Feedback"
// - Ofrecer reprogramación
```

---

## 3. CANALES DE COMUNICACIÓN

### 3.1 CANALES DISPONIBLES

| Canal | Estado | Provider | Input | Output |
|-------|--------|----------|-------|--------|
| **VAPI (Voz)** | ✅ Implementado | VAPI | Transcripción de voz | Síntesis de voz |
| **WhatsApp** | 🔄 Prioritario | n8n + Twilio/WhatsApp Business | Texto/Audio | Texto |
| **Instagram** | 📅 Futuro | n8n + Meta API | Texto | Texto |
| **Facebook** | 📅 Futuro | n8n + Meta API | Texto | Texto |
| **Web Chat** | 📅 Futuro | Widget + WebSocket | Texto | Texto |

### 3.2 FORMATO DE ENTRADA ESPERADO

**Todos los canales deben enviar:**
```json
{
    "channel": "whatsapp",
    "customer_phone": "+34600000000",
    "customer_name": "Juan Pérez",
    "message_text": "Hola, quiero hacer una reserva para 4 personas el viernes a las 21:00",
    "timestamp": "2025-10-02T10:30:00Z",
    "metadata": {
        "message_id": "wamid.xxx",
        "media_url": "https://...", // Si es audio
        "media_type": "audio/ogg" // Si es audio
    }
}
```

---

## 4. ARQUITECTURA PROPUESTA DEL SUPER AGENTE

### 4.1 DIAGRAMA DE ARQUITECTURA

```
┌──────────────────────────────────────────────────────────────────┐
│                       CANALES DE ENTRADA                          │
├──────────────────────────────────────────────────────────────────┤
│  VAPI (Voz)  │  WhatsApp  │  Instagram  │  Facebook  │  WebChat  │
└──────┬───────┴──────┬─────┴──────┬──────┴──────┬──────┴──────┬───┘
       │              │            │             │             │
       ▼              ▼            ▼             ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SUB-AGENTES DE LIMPIEZA                        │
│   (Normalizan y limpian inputs específicos de cada canal)       │
├──────────────────────────────────────────────────────────────────┤
│  📞 Voice    │  💬 WhatsApp │  📸 Instagram │  👥 Facebook │  💻 Web│
│  Cleaner     │   Cleaner    │    Cleaner    │    Cleaner   │ Cleaner│
└──────┬───────┴──────┬─────────┴──────┬────────┴──────┬──────┴──────┘
       │              │                │               │
       └──────────────┴────────────────┴───────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   GATEWAY UNIFICADO (n8n)         │
              │   - Crea agent_conversation       │
              │   - Registra agent_message        │
              │   - Identifica customer           │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   SUPER AGENTE - CLASIFICADOR     │
              │   (OpenAI GPT-4 con functions)    │
              │                                   │
              │   INPUT: Mensaje limpio           │
              │   OUTPUT: {                       │
              │     "intent": "...",              │
              │     "confidence": 0.95            │
              │   }                               │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   ROUTER (n8n Switch)             │
              │   Enruta según intent             │
              └─┬─────────┬─────────┬─────────┬───┘
                │         │         │         │
        ┌───────▼─┐  ┌────▼────┐ ┌─▼────┐  ┌─▼──────┐
        │ RESERVA │  │MODIFIC. │ │CANCEL│  │ FAQ    │
        │ Agent   │  │ Agent   │ │Agent │  │ Agent  │
        └────┬────┘  └────┬────┘ └──┬───┘  └──┬─────┘
             │            │          │         │
             └────────────┴──────────┴─────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   EJECUTOR DE ACCIONES            │
              │   - Crear/Modificar/Cancelar      │
              │   - Consultar Supabase            │
              │   - Validar disponibilidad        │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   GENERADOR DE RESPUESTA          │
              │   (OpenAI GPT-4)                  │
              │   - Personalizado por restaurante │
              │   - Tono del agente (Sofia)       │
              └───────────────┬───────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   RESPONDER AL CLIENTE            │
              │   (Por el canal original)         │
              └───────────────────────────────────┘
```

### 4.2 COMPONENTES DETALLADOS

#### **4.2.1 SUB-AGENTES DE LIMPIEZA (Channel Cleaners)**

**Responsabilidad:** Normalizar inputs específicos de cada canal.

**Voice Cleaner (VAPI):**
```javascript
// n8n Function Node: "Voice Cleaner"
const rawInput = $input.all()[0].json;

return {
    json: {
        channel: 'phone',
        customer_phone: rawInput.call.customer.number || rawInput.phoneNumber,
        customer_name: rawInput.call.customer.name || 'Cliente',
        message_text: rawInput.transcript || rawInput.message,
        timestamp: new Date().toISOString(),
        metadata: {
            call_id: rawInput.call.id,
            call_duration: rawInput.call.endedAt ? 
                (new Date(rawInput.call.endedAt) - new Date(rawInput.call.startedAt)) / 1000 : null,
            sentiment: rawInput.analysis?.sentiment || null
        }
    }
};
```

**WhatsApp Cleaner:**
```javascript
// n8n Function Node: "WhatsApp Cleaner"
const rawInput = $input.all()[0].json;

// Detectar si es audio o texto
const isAudio = rawInput.messages?.[0]?.type === 'audio';
const messageText = isAudio ? 
    '[Audio - Transcripción pendiente]' : 
    rawInput.messages?.[0]?.text?.body || '';

return {
    json: {
        channel: 'whatsapp',
        customer_phone: rawInput.messages?.[0]?.from || rawInput.from,
        customer_name: rawInput.contacts?.[0]?.profile?.name || 'Cliente WhatsApp',
        message_text: messageText,
        timestamp: new Date(rawInput.messages?.[0]?.timestamp * 1000).toISOString(),
        metadata: {
            message_id: rawInput.messages?.[0]?.id,
            is_audio: isAudio,
            media_url: rawInput.messages?.[0]?.audio?.link || null,
            media_type: rawInput.messages?.[0]?.audio?.mime_type || null
        }
    }
};
```

#### **4.2.2 GATEWAY UNIFICADO (n8n Webhook + Supabase)**

**Función:** Recibir mensaje limpio y crear registros en DB.

```javascript
// n8n Function Node: "Gateway - Create Conversation"
const input = $input.all()[0].json;
const restaurantId = '{{$node["Supabase"].json["restaurant_id"]}}';

// 1. Buscar o crear customer
const customerData = {
    restaurant_id: restaurantId,
    name: input.customer_name,
    phone: input.customer_phone
};

// Se hace en nodo Supabase separado (UPSERT)

// 2. Crear conversation
const conversationData = {
    restaurant_id: restaurantId,
    customer_id: '{{$node["Upsert Customer"].json["id"]}}',
    customer_phone: input.customer_phone,
    customer_name: input.customer_name,
    source_channel: input.channel,
    interaction_type: 'unknown', // Se clasificará después
    status: 'active',
    metadata: input.metadata
};

// 3. Crear primer message
const messageData = {
    conversation_id: '{{$node["Create Conversation"].json["id"]}}',
    restaurant_id: restaurantId,
    direction: 'inbound',
    sender: 'customer',
    message_text: input.message_text,
    timestamp: input.timestamp,
    metadata: input.metadata
};

return {
    json: {
        conversation_id: '{{$node["Create Conversation"].json["id"]}}',
        customer_id: '{{$node["Upsert Customer"].json["id"]}}',
        message_text: input.message_text,
        channel: input.channel
    }
};
```

#### **4.2.3 SUPER AGENTE - CLASIFICADOR (OpenAI)**

**Función:** Identificar la intención del cliente.

```javascript
// n8n OpenAI Node: "Super Agent Classifier"
// Model: gpt-4-turbo
// Temperature: 0.3

System Prompt:
"""
Eres un clasificador de intenciones para un restaurante.
Analiza el mensaje del cliente y clasifícalo en UNA de estas categorías:

1. **reservation_new**: Cliente quiere hacer una nueva reserva
   - Debe mencionar: fecha, hora, número de personas
   - Ejemplos: "Quiero reservar para 4 el viernes a las 21h"

2. **reservation_modify**: Cliente quiere modificar una reserva existente
   - Debe mencionar que tiene una reserva y quiere cambiarla
   - Ejemplos: "Tengo una reserva para el viernes, puedo cambiarla al sábado?"

3. **reservation_cancel**: Cliente quiere cancelar
   - Ejemplos: "Quiero cancelar mi reserva"

4. **inquiry_hours**: Pregunta sobre horarios de apertura
   - Ejemplos: "¿A qué hora abrís?"

5. **inquiry_menu**: Pregunta sobre el menú
   - Ejemplos: "¿Tenéis opciones veganas?"

6. **inquiry_location**: Pregunta sobre ubicación/dirección
   - Ejemplos: "¿Dónde estáis ubicados?"

7. **inquiry_general**: Cualquier otra pregunta
   - Ejemplos: "¿Tenéis terraza?"

8. **complaint**: Queja o problema
   - Tono negativo, menciona problemas
   - Ejemplos: "La comida estaba fría"

9. **other**: No encaja en ninguna categoría anterior

Responde SOLO con un JSON:
{
    "intent": "categoria",
    "confidence": 0.0-1.0,
    "extracted_data": {
        // Datos relevantes extraídos (fechas, horas, personas, etc.)
    },
    "reasoning": "Breve explicación"
}
"""

User Message:
"{{$node["Gateway"].json["message_text"]}}"

Context:
- Canal: {{$node["Gateway"].json["channel"]}}
- Cliente: {{$node["Gateway"].json["customer_name"]}}
```

#### **4.2.4 ROUTER (n8n Switch)**

```javascript
// n8n Switch Node: "Intent Router"
const intent = $json.intent;

switch(intent) {
    case 'reservation_new':
        return 0; // Route a "Reservation Agent"
    case 'reservation_modify':
        return 1; // Route a "Modification Agent"
    case 'reservation_cancel':
        return 2; // Route a "Cancellation Agent"
    case 'inquiry_hours':
    case 'inquiry_menu':
    case 'inquiry_location':
    case 'inquiry_general':
        return 3; // Route a "FAQ Agent"
    case 'complaint':
        return 4; // Route a "Complaint Handler" (escalate)
    default:
        return 5; // Route a "General Agent"
}
```

#### **4.2.5 AGENTES ESPECIALIZADOS**

**A. RESERVATION AGENT (Crear reserva)**

```javascript
// System Prompt para OpenAI Function Calling
"""
Eres Sofia, la agente de reservas del restaurante {{restaurant_name}}.

Tu trabajo es ayudar a crear reservas. Necesitas recopilar:
1. **Fecha** (formato: YYYY-MM-DD)
2. **Hora** (formato: HH:MM)
3. **Número de personas** (1-12)
4. **Nombre del cliente** (si no lo tienes)
5. **Teléfono del cliente** (si no lo tienes)

Información del restaurante:
- Horarios: Lunes-Domingo 13:00-16:00 y 20:00-23:30
- Capacidad máxima por reserva: {{max_party_size}} personas
- Anticipación mínima: {{min_advance_hours}} horas
- Anticipación máxima: {{advance_booking_days}} días

IMPORTANTE:
- Si falta información, pregúntala de forma natural
- Si la fecha/hora no está disponible, ofrece alternativas
- Sé amable, profesional y eficiente
- Confirma SIEMPRE los datos antes de crear la reserva

Usa la función check_availability() para verificar disponibilidad.
Usa la función create_reservation() cuando tengas TODOS los datos.
"""

Functions:
[
    {
        "name": "check_availability",
        "description": "Verifica si hay disponibilidad para fecha, hora y personas",
        "parameters": {
            "type": "object",
            "properties": {
                "date": { "type": "string", "format": "date" },
                "time": { "type": "string", "format": "time" },
                "party_size": { "type": "integer" }
            },
            "required": ["date", "time", "party_size"]
        }
    },
    {
        "name": "create_reservation",
        "description": "Crea una reserva confirmada",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_name": { "type": "string" },
                "customer_phone": { "type": "string" },
                "customer_email": { "type": "string" },
                "date": { "type": "string", "format": "date" },
                "time": { "type": "string", "format": "time" },
                "party_size": { "type": "integer" },
                "special_requests": { "type": "string" }
            },
            "required": ["customer_name", "customer_phone", "date", "time", "party_size"]
        }
    }
]
```

**B. MODIFICATION AGENT (Modificar reserva)**

```javascript
System Prompt:
"""
Eres Sofia, ayudando a modificar una reserva existente.

Proceso:
1. Buscar la reserva del cliente (por teléfono + fecha próxima)
2. Preguntar qué quiere modificar (fecha, hora, personas)
3. Verificar nueva disponibilidad
4. Confirmar cambios

Functions disponibles:
- find_reservation(phone, date_range)
- check_availability(date, time, party_size)
- update_reservation(reservation_id, new_data)
"""
```

**C. CANCELLATION AGENT (Cancelar reserva)**

```javascript
System Prompt:
"""
Eres Sofia, ayudando con una cancelación.

Proceso:
1. Buscar reserva activa del cliente
2. Confirmar que quiere cancelar
3. Cancelar y ofrecer reprogramación (opcional)
4. Agradecer y despedirse cordialmente

Functions:
- find_reservation(phone)
- cancel_reservation(reservation_id, reason)
"""
```

**D. FAQ AGENT (Preguntas frecuentes)**

```javascript
System Prompt:
"""
Eres Sofia, respondiendo preguntas sobre el restaurante.

Información disponible:
- Horarios: {{opening_hours}}
- Ubicación: {{address}}
- Teléfono: {{phone}}
- Email: {{email}}
- Menú: [consultar menu_items table]
- Especialidades: {{specialties}}

Si no sabes algo, di que consultarás y alguien se pondrá en contacto.
NO inventes información.
"""
```

#### **4.2.6 EJECUTOR DE ACCIONES (Supabase)**

**Funciones que se ejecutan desde n8n:**

```javascript
// check_availability()
// n8n HTTP Request Node -> Supabase RPC
POST https://{{supabase_url}}/rest/v1/rpc/check_availability_for_agent
Headers: {
    "apikey": "{{supabase_key}}",
    "Content-Type": "application/json"
}
Body: {
    "p_restaurant_id": "{{restaurant_id}}",
    "p_date": "2025-10-15",
    "p_time": "20:30:00",
    "p_party_size": 4
}

Response: {
    "available": true,
    "available_slots": ["20:00", "20:30", "21:00"],
    "reason": null
}

// create_reservation()
// n8n Supabase Node -> Insert
Table: reservations
Data: {
    restaurant_id: "{{restaurant_id}}",
    customer_id: "{{customer_id}}",
    customer_name: "Juan Pérez",
    customer_phone: "+34600000000",
    customer_email: "juan@email.com",
    reservation_date: "2025-10-15",
    reservation_time: "20:30:00",
    party_size: 4,
    status: "confirmed",
    source: "agent",
    created_by: "agent",
    special_requests: "Mesa ventana"
}

// update_customer_stats()
// n8n Supabase Node -> Update
Table: customers
Data: {
    visits_count: visits_count + 1,
    last_visit_date: reservation_date
}
Where: id = customer_id
```

#### **4.2.7 GENERADOR DE RESPUESTA (OpenAI)**

```javascript
// n8n OpenAI Node: "Response Generator"
System Prompt:
"""
Eres Sofia, la agente del restaurante {{restaurant_name}}.

Personalidad:
- Profesional pero cercana
- Amable y paciente
- Eficiente y clara
- Usa emojis ocasionalmente (no exageres)

Genera una respuesta natural basada en:
- Acción realizada: {{action_result}}
- Datos de la reserva: {{reservation_data}}
- Canal: {{channel}}

Formato de respuesta según canal:
- WhatsApp: Informal, emojis ok
- Voz: Formal, sin emojis, oraciones cortas
- Web Chat: Semi-formal, emojis moderados

IMPORTANTE:
- Confirma SIEMPRE los datos de la reserva
- Sé específica con fecha/hora/personas
- Ofrece ayuda adicional
- Despídete cordialmente
"""

User Message:
"Genera respuesta para: {{action_summary}}"
```

---

## 5. ESPECIFICACIÓN TÉCNICA

### 5.1 RPC FUNCTIONS DE SUPABASE (Nuevas)

```sql
-- Function: check_availability_for_agent
CREATE OR REPLACE FUNCTION check_availability_for_agent(
    p_restaurant_id UUID,
    p_date DATE,
    p_time TIME,
    p_party_size INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_capacity INTEGER;
    v_current_reservations INTEGER;
    v_available BOOLEAN;
    v_reason TEXT;
    v_alternative_slots JSONB;
BEGIN
    -- 1. Verificar capacidad total
    SELECT SUM(capacity) INTO v_capacity
    FROM tables
    WHERE restaurant_id = p_restaurant_id
    AND status != 'inactive';
    
    -- 2. Contar reservas existentes en ese horario
    SELECT COUNT(*) INTO v_current_reservations
    FROM reservations
    WHERE restaurant_id = p_restaurant_id
    AND reservation_date = p_date
    AND reservation_time = p_time
    AND status IN ('confirmed', 'pending');
    
    -- 3. Verificar disponibilidad
    v_available := (v_current_reservations < v_capacity / p_party_size);
    
    IF NOT v_available THEN
        v_reason := 'No hay mesas disponibles para esa hora';
        
        -- Buscar horarios alternativos ±30min
        SELECT jsonb_agg(DISTINCT reservation_time)
        INTO v_alternative_slots
        FROM reservations
        WHERE restaurant_id = p_restaurant_id
        AND reservation_date = p_date
        AND reservation_time BETWEEN (p_time - INTERVAL '30 minutes') 
                                  AND (p_time + INTERVAL '30 minutes')
        AND status IN ('confirmed', 'pending')
        GROUP BY reservation_time
        HAVING COUNT(*) < v_capacity / p_party_size;
    END IF;
    
    RETURN jsonb_build_object(
        'available', v_available,
        'capacity', v_capacity,
        'current_reservations', v_current_reservations,
        'reason', v_reason,
        'alternative_slots', v_alternative_slots
    );
END;
$$ LANGUAGE plpgsql;

-- Function: find_reservation_by_phone
CREATE OR REPLACE FUNCTION find_reservation_by_phone(
    p_restaurant_id UUID,
    p_phone VARCHAR,
    p_date_from DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    reservation_id UUID,
    customer_name VARCHAR,
    reservation_date DATE,
    reservation_time TIME,
    party_size INTEGER,
    status VARCHAR,
    special_requests TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.customer_name,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.status,
        r.special_requests
    FROM reservations r
    WHERE r.restaurant_id = p_restaurant_id
    AND r.customer_phone = p_phone
    AND r.reservation_date >= p_date_from
    AND r.status IN ('confirmed', 'pending')
    ORDER BY r.reservation_date ASC, r.reservation_time ASC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function: get_restaurant_info_for_agent
CREATE OR REPLACE FUNCTION get_restaurant_info_for_agent(
    p_restaurant_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_restaurant RECORD;
    v_settings JSONB;
    v_menu JSONB;
BEGIN
    SELECT * INTO v_restaurant
    FROM restaurants
    WHERE id = p_restaurant_id;
    
    v_settings := v_restaurant.settings;
    
    -- Obtener menú resumido
    SELECT jsonb_agg(
        jsonb_build_object(
            'category', category,
            'items', (
                SELECT jsonb_agg(jsonb_build_object('name', name, 'price', price))
                FROM menu_items
                WHERE restaurant_id = p_restaurant_id
                AND category = mi.category
                AND is_available = true
            )
        )
    ) INTO v_menu
    FROM (SELECT DISTINCT category FROM menu_items WHERE restaurant_id = p_restaurant_id) mi;
    
    RETURN jsonb_build_object(
        'id', v_restaurant.id,
        'name', v_restaurant.name,
        'phone', v_restaurant.phone,
        'email', v_restaurant.email,
        'address', v_restaurant.address,
        'city', v_restaurant.city,
        'cuisine_type', v_restaurant.cuisine_type,
        'settings', v_settings,
        'menu', v_menu
    );
END;
$$ LANGUAGE plpgsql;
```

### 5.2 ESTRUCTURA DEL WORKFLOW N8N

```
Workflow: "Super Agent AI - La-IA"

Nodes:
1. [Webhook] VAPI Input
2. [Webhook] WhatsApp Input
3. [Function] Voice Cleaner
4. [Function] WhatsApp Cleaner
5. [Merge] Unified Input
6. [Supabase] Upsert Customer
7. [Supabase] Create Conversation
8. [Supabase] Create Message (Inbound)
9. [Supabase] Get Restaurant Info
10. [OpenAI] Super Agent Classifier
11. [Switch] Intent Router
    ├─ [OpenAI] Reservation Agent → [Function] Check Availability → [Supabase] Create Reservation
    ├─ [OpenAI] Modification Agent → [Supabase] Find Reservation → [Supabase] Update Reservation
    ├─ [OpenAI] Cancellation Agent → [Supabase] Find Reservation → [Supabase] Cancel Reservation
    ├─ [OpenAI] FAQ Agent
    └─ [OpenAI] General Agent
12. [OpenAI] Response Generator
13. [Supabase] Create Message (Outbound)
14. [Supabase] Update Conversation (Status, Outcome)
15. [Switch] Channel Output Router
    ├─ [HTTP Request] VAPI Response
    ├─ [HTTP Request] WhatsApp Send Message
    └─ [HTTP Request] WebChat Send Message
```

### 5.3 VARIABLES DE ENTORNO N8N

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx... (para operaciones admin)

# OpenAI
OPENAI_API_KEY=sk-xxx...
OPENAI_MODEL=gpt-4-turbo
OPENAI_TEMPERATURE=0.3

# VAPI
VAPI_API_KEY=xxx
VAPI_ASSISTANT_ID=xxx

# WhatsApp (Twilio o WhatsApp Business API)
WHATSAPP_API_URL=https://api.whatsapp.com/...
WHATSAPP_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx

# Configuración
RESTAURANT_ID=xxx (o dinámico por webhook)
```

---

## 6. PLAN DE IMPLEMENTACIÓN

### FASE 1: FUNDAMENTOS (Semana 1) ⭐ PRIORITARIO

**Objetivo:** Conectar VAPI + WhatsApp con el Super Agente básico.

**Tasks:**
1. ✅ Crear RPC functions en Supabase:
   - `check_availability_for_agent()`
   - `find_reservation_by_phone()`
   - `get_restaurant_info_for_agent()`

2. ✅ Crear workflow n8n básico:
   - Webhook VAPI (ya existe)
   - Webhook WhatsApp (nuevo)
   - Voice Cleaner
   - WhatsApp Cleaner
   - Gateway Unificado

3. ✅ Implementar Super Agent Classifier:
   - OpenAI con function calling
   - Clasificación de intents

4. ✅ Implementar Reservation Agent:
   - Conversación multi-turno
   - Validaciones de disponibilidad
   - Creación de reserva en Supabase

5. ✅ Testing end-to-end:
   - VAPI → Reserva creada
   - WhatsApp → Reserva creada

**Entregables:**
- Script SQL con RPC functions
- Workflow n8n exportado (JSON)
- Documentación de testing

---

### FASE 2: MODIFICACIÓN Y CANCELACIÓN (Semana 2)

**Objetivo:** Completar flujos de modificación y cancelación.

**Tasks:**
1. Implementar Modification Agent
2. Implementar Cancellation Agent
3. Agregar lógica de búsqueda de reservas
4. Testing de modificaciones y cancelaciones

---

### FASE 3: FAQ Y ESCALACIÓN (Semana 3)

**Objetivo:** Manejar preguntas frecuentes y casos complejos.

**Tasks:**
1. Implementar FAQ Agent con info del restaurante
2. Agregar lógica de escalación (complaints)
3. Integrar con CRM para casos complejos
4. Testing de FAQs

---

### FASE 4: OPTIMIZACIÓN Y MÉTRICAS (Semana 4)

**Objetivo:** Mejorar rendimiento y visibilidad.

**Tasks:**
1. Implementar logging avanzado
2. Dashboard de métricas del agente
3. A/B testing de prompts
4. Optimización de costos OpenAI

---

### FASE 5: CANALES ADICIONALES (Futuro)

**Objetivo:** Agregar Instagram, Facebook, WebChat.

**Tasks:**
1. Implementar Instagram Cleaner
2. Implementar Facebook Cleaner
3. Implementar WebChat Widget
4. Testing multi-canal

---

## 7. RECOMENDACIONES FINALES

### 7.1 ARQUITECTURA: SUB-AGENTES + SUPER AGENTE ✅

**Tu propuesta es EXCELENTE.** Te recomiendo:

1. **SUB-AGENTES por canal** (Cleaners):
   - ✅ Normalizan inputs
   - ✅ Fácil de mantener
   - ✅ Escalable a nuevos canales

2. **SUPER AGENTE Clasificador**:
   - ✅ Una sola fuente de verdad para intents
   - ✅ Fácil de mejorar prompts
   - ✅ Reutilizable para todos los canales

3. **AGENTES ESPECIALIZADOS** por intent:
   - ✅ Expertos en su tarea
   - ✅ Prompts específicos y optimizados
   - ✅ Fácil de debuggear

### 7.2 PRIORIDADES

1. **AHORA: VAPI + WhatsApp** (Texto y Audio)
   - Son los canales más usados
   - Mayor ROI inmediato

2. **DESPUÉS: Instagram + Facebook**
   - Menos urgente
   - Arquitectura ya preparada

3. **FUTURO: WebChat**
   - Cuando tengas más restaurantes

### 7.3 MEJORAS SUGERIDAS

1. **Transcripción de audio WhatsApp:**
   - Usar Whisper API (OpenAI) en n8n
   - Node: OpenAI Audio Transcription

2. **Context Window:**
   - Guardar últimos 5 mensajes de la conversación
   - Pasar contexto al agente para respuestas coherentes

3. **Fallback a humano:**
   - Si confidence < 0.7, escalar a staff
   - Notificación push al restaurante

4. **Testing automatizado:**
   - Suite de tests en n8n
   - Casos de uso reales

---

## 8. SIGUIENTE PASO INMEDIATO

**¿Qué hacemos AHORA?**

**OPCIÓN A: Implementar FASE 1 completa** ⭐ Recomendada
- Creo los RPC functions SQL
- Diseño el workflow n8n completo
- Implemento Reservation Agent
- Testing end-to-end

**OPCIÓN B: Prototipo rápido**
- Solo Reservation Agent básico
- Sin sub-agentes (limpieza manual)
- Testing rápido con VAPI

**Mi recomendación: OPCIÓN A** - Hacerlo bien desde el principio, arquitectura sólida y escalable.

---

**¿Empezamos con la FASE 1?** 🚀


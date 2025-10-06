# 📱 Integración N8n - WhatsApp para Reservas

## 🎯 Objetivo
Automatizar el envío de mensajes WhatsApp a clientes para:
1. **Aprobación de grupo grande** (cuando restaurante aprueba)
2. **Rechazo de grupo grande** (cuando restaurante rechaza)
3. **Confirmación 24h antes** (recordatorio automático)

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│  Supabase: reservations table                           │
│  - Cambios de estado detectados por N8n                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Supabase: message_templates table                      │
│  - Templates de WhatsApp con variables                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  N8n Workflow                                            │
│  - Reemplaza variables                                  │
│  - Envía WhatsApp                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Workflows N8n Necesarios

### **1. Workflow: Aprobación/Rechazo de Grupo Grande**

**Trigger:** Supabase Realtime (escuchar cambios en `reservations`)

**Condiciones:**
```javascript
// APROBACIÓN
if (oldStatus === 'pending_approval' && newStatus === 'pending') {
  // Enviar template 'aprobacion_grupo'
}

// RECHAZO
if (oldStatus === 'pending_approval' && newStatus === 'cancelled') {
  // Enviar template 'rechazo_grupo'
}
```

**Steps:**
1. **Trigger:** Supabase Realtime → Listen to `reservations` table
2. **Filter:** Status change from `pending_approval`
3. **Query:** Get reservation details
4. **Query:** Get template from `message_templates`
5. **Transform:** Replace variables in template
6. **Send:** WhatsApp message
7. **Log:** Record in `customer_interactions` (opcional)

---

### **2. Workflow: Confirmación 24h Antes**

**Trigger:** Cron (diario a las 10:00 AM)

**Query SQL:**
```sql
SELECT 
  r.id,
  r.customer_name,
  r.customer_phone,
  r.reservation_date,
  r.reservation_time,
  r.party_size,
  r.restaurant_id,
  rest.name as restaurant_name
FROM reservations r
JOIN restaurants rest ON r.restaurant_id = rest.id
WHERE r.status = 'pending'
  AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
  AND r.customer_phone IS NOT NULL;
```

**Steps:**
1. **Trigger:** Cron (10:00 AM daily)
2. **Query:** Get reservations for tomorrow
3. **Loop:** For each reservation:
   - Get template `confirmacion_24h` from `message_templates`
   - Replace variables
   - Send WhatsApp
   - Log interaction

---

## 📋 Variables Disponibles por Template

### **Template: Aprobación Grupo Grande**
```javascript
{
  customer_name: "Juan Pérez",           // reservations.customer_name
  restaurant_name: "Casa Lolita",       // restaurants.name
  reservation_date: "7 de octubre",     // reservations.reservation_date (formateado)
  reservation_time: "20:00",            // reservations.reservation_time
  party_size: "10",                     // reservations.party_size
  zone: "Terraza"                       // reservation_tables.tables.zone
}
```

**Query para obtener zona:**
```sql
SELECT t.zone
FROM reservation_tables rt
JOIN tables t ON rt.table_id = t.id
WHERE rt.reservation_id = :reservation_id
LIMIT 1;
```

---

### **Template: Rechazo Grupo Grande**
```javascript
{
  customer_name: "Juan Pérez",           // reservations.customer_name
  restaurant_name: "Casa Lolita",       // restaurants.name
  reservation_date: "7 de octubre",     // reservations.reservation_date (formateado)
  reservation_time: "20:00",            // reservations.reservation_time
  party_size: "10",                     // reservations.party_size
  rejection_reason: "No disponible",    // reservations.cancellation_reason
  restaurant_phone: "622333444"         // restaurants.phone
}
```

---

### **Template: Confirmación 24h Antes**
```javascript
{
  customer_name: "Juan Pérez",           // reservations.customer_name
  restaurant_name: "Casa Lolita",       // restaurants.name
  reservation_date: "7 de octubre",     // reservations.reservation_date (formateado)
  reservation_time: "20:00",            // reservations.reservation_time
  party_size: "10"                      // reservations.party_size
}
```

---

## 🔍 Queries N8n

### **1. Obtener Template**
```sql
SELECT 
  content_markdown,
  variables
FROM message_templates
WHERE restaurant_id = :restaurant_id
  AND template_type = :template_type  -- 'aprobacion_grupo', 'rechazo_grupo', 'confirmacion_24h'
  AND is_active = true
LIMIT 1;
```

### **2. Obtener Datos de Reserva Completos**
```sql
SELECT 
  r.*,
  rest.name as restaurant_name,
  rest.phone as restaurant_phone,
  rest.email as restaurant_email
FROM reservations r
JOIN restaurants rest ON r.restaurant_id = rest.id
WHERE r.id = :reservation_id;
```

### **3. Obtener Zona de Reserva (para grupos grandes)**
```sql
SELECT 
  t.zone,
  STRING_AGG(COALESCE(t.name, 'Mesa ' || t.table_number), ' + ') as table_names
FROM reservation_tables rt
JOIN tables t ON rt.table_id = t.id
WHERE rt.reservation_id = :reservation_id
GROUP BY t.zone
LIMIT 1;
```

---

## 📱 Formato de Número de Teléfono

**Importante:** Los números en la BD pueden tener diferentes formatos:
- `666859998` (sin prefijo)
- `+34666859998` (con prefijo internacional)

**Normalización en N8n:**
```javascript
// Si no tiene +34, agregarlo
let phone = item.customer_phone;
if (!phone.startsWith('+34')) {
  phone = '+34' + phone;
}
return phone;
```

---

## 🔄 Webhook para Respuestas (Confirmación 24h)

Cuando el cliente responde al mensaje de confirmación:

**Endpoint:** `POST https://tu-backend.com/api/whatsapp-webhook`

**Payload:**
```json
{
  "from": "+34666859998",
  "message": "SÍ",
  "timestamp": "2025-10-06T10:30:00Z"
}
```

**Lógica:**
```javascript
// Buscar reserva por teléfono y fecha
const reservation = await findReservation(from, tomorrow);

if (message.toLowerCase().includes('sí') || message.toLowerCase().includes('si')) {
  // Actualizar a confirmed
  await updateReservation(reservation.id, { status: 'confirmed' });
} else if (message.toLowerCase().includes('no')) {
  // Actualizar a cancelled
  await updateReservation(reservation.id, { status: 'cancelled' });
}
```

---

## 📊 Logging (Opcional pero Recomendado)

Registrar cada mensaje enviado en `customer_interactions`:

```sql
INSERT INTO customer_interactions (
  customer_id,
  restaurant_id,
  interaction_type,
  channel,
  message_content,
  status,
  metadata
) VALUES (
  :customer_id,
  :restaurant_id,
  'automated_message',
  'whatsapp',
  :message_sent,
  'sent',
  jsonb_build_object(
    'template_type', :template_type,
    'reservation_id', :reservation_id
  )
);
```

---

## ✅ Checklist de Implementación

### **Workflow 1: Aprobación/Rechazo**
- [ ] Configurar Supabase Realtime trigger
- [ ] Filtrar cambios de `pending_approval`
- [ ] Query para obtener datos de reserva
- [ ] Query para obtener zona (JOIN con reservation_tables)
- [ ] Query para obtener template
- [ ] Función para reemplazar variables
- [ ] Integración con WhatsApp API
- [ ] Logging en customer_interactions

### **Workflow 2: Confirmación 24h**
- [ ] Configurar Cron (10:00 AM diario)
- [ ] Query para reservas de mañana
- [ ] Loop por cada reserva
- [ ] Query para obtener template
- [ ] Función para reemplazar variables
- [ ] Integración con WhatsApp API
- [ ] Webhook para recibir respuestas
- [ ] Actualizar status según respuesta

---

## 🚀 Ejemplo Completo N8n (JSON)

```json
{
  "nodes": [
    {
      "name": "Cron",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300],
      "parameters": {
        "triggerTimes": {
          "item": [
            {
              "hour": 10,
              "minute": 0
            }
          ]
        }
      }
    },
    {
      "name": "Supabase Query",
      "type": "n8n-nodes-base.postgres",
      "position": [450, 300],
      "parameters": {
        "query": "SELECT r.*, rest.name as restaurant_name FROM reservations r JOIN restaurants rest ON r.restaurant_id = rest.id WHERE r.status = 'pending' AND r.reservation_date = CURRENT_DATE + INTERVAL '1 day'"
      }
    },
    {
      "name": "Get Template",
      "type": "n8n-nodes-base.postgres",
      "position": [650, 300],
      "parameters": {
        "query": "SELECT content_markdown FROM message_templates WHERE restaurant_id = '{{$json.restaurant_id}}' AND template_type = 'confirmacion_24h' AND is_active = true"
      }
    },
    {
      "name": "Replace Variables",
      "type": "n8n-nodes-base.function",
      "position": [850, 300],
      "parameters": {
        "functionCode": "let message = items[0].json.content_markdown;\nmessage = message.replace('{{customer_name}}', items[0].json.customer_name);\nmessage = message.replace('{{restaurant_name}}', items[0].json.restaurant_name);\nreturn [{json: {message, phone: items[0].json.customer_phone}}];"
      }
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.whatsapp.com/send",
        "body": {
          "to": "={{$json.phone}}",
          "message": "={{$json.message}}"
        }
      }
    }
  ]
}
```

---

## 📞 Soporte

Para cualquier duda sobre la integración:
- Revisar logs en N8n
- Verificar templates en Supabase (`message_templates`)
- Comprobar que `customer_phone` no sea NULL

**¡Listo para implementar!** 🚀

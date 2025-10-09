# 🤖 WORKFLOWS N8N PARA SISTEMA DE NO-SHOWS

**Fecha:** 9 de Octubre, 2025  
**Versión:** 1.0  
**Total Workflows:** 5

---

## 📋 **ÍNDICE DE WORKFLOWS**

1. [Workflow 1: Confirmación 24h Antes](#workflow-1-confirmación-24h-antes)
2. [Workflow 2: Recordatorio 4h Antes](#workflow-2-recordatorio-4h-antes)
3. [Workflow 3: Procesar Respuestas WhatsApp](#workflow-3-procesar-respuestas-whatsapp)
4. [Workflow 4: Crear Alarmas T-2h 15min](#workflow-4-crear-alarmas-t-2h-15min)
5. [Workflow 5: Auto-liberar T-2h](#workflow-5-auto-liberar-t-2h)

---

## 🚀 **WORKFLOW 1: CONFIRMACIÓN 24H ANTES**

### **Propósito:**
Enviar WhatsApp de confirmación 24 horas antes de la reserva

### **Trigger:**
**Cron:** `0 * * * *` (Cada hora a las :00)

### **Nodos:**

#### **1. Schedule Trigger**
- **Tipo:** Cron
- **Expresión:** `0 * * * *`

#### **2. Supabase - Get Tomorrow Reservations**
- **Tipo:** Supabase
- **Operación:** Select Rows
- **Tabla:** `reservations`
- **Filtros:**
  ```json
  {
    "reservation_date": "{{ $now.plus({days: 1}).toISODate() }}",
    "status": ["pending", "confirmed", "pendiente", "confirmada"]
  }
  ```
- **Campos:** `id, customer_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, restaurant_id`

#### **3. Filter - Has Phone**
- **Tipo:** IF
- **Condición:** `{{ $json.customer_phone }}` is not empty

#### **4. Supabase - Check Already Sent**
- **Tipo:** Supabase
- **Operación:** Select Rows
- **Tabla:** `customer_confirmations`
- **Filtros:**
  ```json
  {
    "reservation_id": "{{ $json.id }}",
    "message_type": "Confirmación 24h antes"
  }
  ```

#### **5. Filter - Not Sent Yet**
- **Tipo:** IF
- **Condición:** `{{ $json.length === 0 }}`

#### **6. Supabase - Register Confirmation**
- **Tipo:** Supabase Function (RPC)
- **Función:** `record_customer_confirmation`
- **Parámetros:**
  ```json
  {
    "p_reservation_id": "{{ $node['Supabase - Get Tomorrow Reservations'].json.id }}",
    "p_message_type": "Confirmación 24h antes",
    "p_message_channel": "whatsapp",
    "p_message_content": "¡Hola {{ $node['Supabase - Get Tomorrow Reservations'].json.customer_name }}! 👋\n\nTe recordamos tu reserva para MAÑANA:\n📅 Fecha: {{ $node['Supabase - Get Tomorrow Reservations'].json.reservation_date }}\n🕐 Hora: {{ $node['Supabase - Get Tomorrow Reservations'].json.reservation_time }}\n👥 Personas: {{ $node['Supabase - Get Tomorrow Reservations'].json.party_size }}\n\nPor favor, responde SI para confirmar tu asistencia.\n\nGracias!"
  }
  ```

#### **7. WhatsApp - Send Message**
- **Tipo:** HTTP Request (API WhatsApp/VAPI)
- **Método:** POST
- **URL:** `{{ $env.WHATSAPP_API_URL }}/send`
- **Body:**
  ```json
  {
    "to": "{{ $node['Supabase - Get Tomorrow Reservations'].json.customer_phone }}",
    "message": "¡Hola {{ $node['Supabase - Get Tomorrow Reservations'].json.customer_name }}! 👋\n\nTe recordamos tu reserva para MAÑANA:\n📅 Fecha: {{ $node['Supabase - Get Tomorrow Reservations'].json.reservation_date }}\n🕐 Hora: {{ $node['Supabase - Get Tomorrow Reservations'].json.reservation_time }}\n👥 Personas: {{ $node['Supabase - Get Tomorrow Reservations'].json.party_size }}\n\nPor favor, responde SI para confirmar tu asistencia.\n\nGracias!"
  }
  ```

---

## 📱 **WORKFLOW 2: RECORDATORIO 4H ANTES**

### **Propósito:**
Enviar recordatorio 4 horas antes (mensaje personalizado según si confirmó o no)

### **Trigger:**
**Cron:** `*/15 * * * *` (Cada 15 minutos)

### **Nodos:**

#### **1. Schedule Trigger**
- **Tipo:** Cron
- **Expresión:** `*/15 * * * *`

#### **2. Supabase - Get Reservations in 4h**
- **Tipo:** Supabase
- **Query SQL:**
  ```sql
  SELECT * FROM reservations
  WHERE restaurant_id = '{{ $env.RESTAURANT_ID }}'
  AND status IN ('pending', 'confirmed', 'pendiente', 'confirmada')
  AND reservation_date = CURRENT_DATE
  AND reservation_time BETWEEN 
      (CURRENT_TIME + INTERVAL '3 hours 45 minutes') 
      AND (CURRENT_TIME + INTERVAL '4 hours 15 minutes')
  ```

#### **3. Filter - Has Phone**
- **Tipo:** IF
- **Condición:** `{{ $json.customer_phone }}` is not empty

#### **4. Supabase - Calculate Risk**
- **Tipo:** Supabase Function (RPC)
- **Función:** `calculate_dynamic_risk_score`
- **Parámetros:**
  ```json
  {
    "p_reservation_id": "{{ $json.id }}"
  }
  ```

#### **5. Set - Prepare Message**
- **Tipo:** Set
- **Campos:**
  ```javascript
  // Si ya confirmó (risk_score < 40)
  confirmed_message: "Hola {{ $json.customer_name }}! 😊\nTe esperamos en 4 horas para tu reserva.\n¡Nos vemos pronto!"
  
  // Si NO confirmó (risk_score >= 40)
  unconfirmed_message: "Hola {{ $json.customer_name }},\n\nAún no hemos recibido tu confirmación para HOY a las {{ $json.reservation_time }}.\n\n¿Podrías confirmarnos tu asistencia?\nEs importante para nosotros. Gracias 🙏"
  
  // Mensaje a usar
  final_message: {{ $node['Supabase - Calculate Risk'].json.risk_score < 40 ? $value.confirmed_message : $value.unconfirmed_message }}
  ```

#### **6. Supabase - Register Reminder**
- **Tipo:** Supabase Function (RPC)
- **Función:** `record_customer_confirmation`
- **Parámetros:**
  ```json
  {
    "p_reservation_id": "{{ $node['Supabase - Get Reservations in 4h'].json.id }}",
    "p_message_type": "Recordatorio 4h antes",
    "p_message_channel": "whatsapp",
    "p_message_content": "{{ $node['Set - Prepare Message'].json.final_message }}"
  }
  ```

#### **7. WhatsApp - Send Message**
- **Tipo:** HTTP Request
- **Método:** POST
- **Body:**
  ```json
  {
    "to": "{{ $node['Supabase - Get Reservations in 4h'].json.customer_phone }}",
    "message": "{{ $node['Set - Prepare Message'].json.final_message }}"
  }
  ```

---

## 🔔 **WORKFLOW 3: PROCESAR RESPUESTAS WHATSAPP**

### **Propósito:**
Recibir respuestas de clientes y actualizar el sistema

### **Trigger:**
**Webhook** (desde API de WhatsApp)

### **Nodos:**

#### **1. Webhook**
- **Tipo:** Webhook Trigger
- **Método:** POST
- **Path:** `/webhook/whatsapp-response`

#### **2. Extract Data**
- **Tipo:** Set
- **Campos:**
  ```javascript
  phone: {{ $json.from }}
  message: {{ $json.body }}
  timestamp: {{ $json.timestamp }}
  ```

#### **3. Supabase - Find Reservation**
- **Tipo:** Supabase
- **Query SQL:**
  ```sql
  SELECT r.id, r.customer_name, r.reservation_date, r.reservation_time
  FROM reservations r
  WHERE r.customer_phone = '{{ $node['Extract Data'].json.phone }}'
  AND r.reservation_date >= CURRENT_DATE
  AND r.status IN ('pending', 'confirmed', 'pendiente', 'confirmada')
  ORDER BY r.reservation_date ASC, r.reservation_time ASC
  LIMIT 1
  ```

#### **4. Filter - Reservation Found**
- **Tipo:** IF
- **Condición:** `{{ $json.id }}` exists

#### **5. Supabase - Find Confirmation**
- **Tipo:** Supabase
- **Operación:** Select Rows
- **Tabla:** `customer_confirmations`
- **Filtros:**
  ```json
  {
    "reservation_id": "{{ $node['Supabase - Find Reservation'].json.id }}",
    "responded_at": null
  }
  ```
- **Order:** `sent_at DESC`
- **Limit:** 1

#### **6. AI - Analyze Response**
- **Tipo:** OpenAI / Claude
- **Prompt:**
  ```
  Analiza esta respuesta de cliente y determina si está confirmando su reserva.
  Respuesta: "{{ $node['Extract Data'].json.message }}"
  
  Responde SOLO con JSON:
  {
    "confirmed": true/false,
    "confidence": 0-100
  }
  ```

#### **7. Supabase - Update Confirmation**
- **Tipo:** Supabase Function (RPC)
- **Función:** `update_confirmation_response`
- **Parámetros:**
  ```json
  {
    "p_confirmation_id": "{{ $node['Supabase - Find Confirmation'].json.id }}",
    "p_response_content": "{{ $node['Extract Data'].json.message }}",
    "p_confirmed": {{ $node['AI - Analyze Response'].json.confirmed }}
  }
  ```

#### **8. Supabase - Recalculate Risk**
- **Tipo:** Supabase Function (RPC)
- **Función:** `calculate_dynamic_risk_score`
- **Parámetros:**
  ```json
  {
    "p_reservation_id": "{{ $node['Supabase - Find Reservation'].json.id }}"
  }
  ```

#### **9. IF - Risk High → Cancel Alarm**
- **Tipo:** IF
- **Condición:** `{{ $node['Supabase - Recalculate Risk'].json.risk_score < 60 }}`

#### **10. Supabase - Cancel Alarm (if exists)**
- **Tipo:** Supabase
- **Query SQL:**
  ```sql
  UPDATE noshow_alerts
  SET status = 'resolved',
      resolved_at = NOW(),
      resolution_method = 'auto_confirmed_via_whatsapp'
  WHERE reservation_id = '{{ $node['Supabase - Find Reservation'].json.id }}'
  AND status = 'active'
  ```

---

## 🚨 **WORKFLOW 4: CREAR ALARMAS T-2H 15MIN**

### **Propósito:**
Crear alarmas en Dashboard para reservas de alto riesgo

### **Trigger:**
**Cron:** `*/5 * * * *` (Cada 5 minutos)

### **Nodos:**

#### **1. Schedule Trigger**
- **Tipo:** Cron
- **Expresión:** `*/5 * * * *`

#### **2. Supabase - Get Reservations in 2h 15min**
- **Tipo:** Supabase
- **Query SQL:**
  ```sql
  SELECT * FROM reservations
  WHERE restaurant_id = '{{ $env.RESTAURANT_ID }}'
  AND status IN ('pending', 'confirmed', 'pendiente', 'confirmada')
  AND reservation_date = CURRENT_DATE
  AND reservation_time BETWEEN 
      (CURRENT_TIME + INTERVAL '2 hours 10 minutes') 
      AND (CURRENT_TIME + INTERVAL '2 hours 20 minutes')
  ```

#### **3. Supabase - Calculate Risk**
- **Tipo:** Supabase Function (RPC)
- **Función:** `calculate_dynamic_risk_score`
- **Parámetros:**
  ```json
  {
    "p_reservation_id": "{{ $json.id }}"
  }
  ```

#### **4. Filter - High Risk**
- **Tipo:** IF
- **Condición:** `{{ $json.risk_score > 60 }}`

#### **5. Supabase - Check Alarm Exists**
- **Tipo:** Supabase
- **Operación:** Select Rows
- **Tabla:** `noshow_alerts`
- **Filtros:**
  ```json
  {
    "reservation_id": "{{ $node['Supabase - Get Reservations in 2h 15min'].json.id }}",
    "status": "active"
  }
  ```

#### **6. Filter - Alarm Not Exists**
- **Tipo:** IF
- **Condición:** `{{ $json.length === 0 }}`

#### **7. Supabase - Create Alarm**
- **Tipo:** Supabase Function (RPC)
- **Función:** `create_noshow_alert`
- **Parámetros:**
  ```json
  {
    "p_reservation_id": "{{ $node['Supabase - Get Reservations in 2h 15min'].json.id }}",
    "p_minutes_before_release": 15
  }
  ```

---

## ⏰ **WORKFLOW 5: AUTO-LIBERAR T-2H**

### **Propósito:**
Liberar automáticamente reservas no confirmadas

### **Trigger:**
**Cron:** `* * * * *` (Cada minuto)

### **Nodos:**

#### **1. Schedule Trigger**
- **Tipo:** Cron
- **Expresión:** `* * * * *`

#### **2. Supabase - Auto Release**
- **Tipo:** Supabase Function (RPC)
- **Función:** `auto_release_expired_alerts`
- **Sin parámetros**

#### **3. Filter - Has Released**
- **Tipo:** IF
- **Condición:** `{{ $json.released_count > 0 }}`

#### **4. Loop Through Released**
- **Tipo:** Split In Batches
- **Batch Size:** 1

#### **5. Supabase - Get Reservation Details**
- **Tipo:** Supabase
- **Operación:** Select Rows
- **Tabla:** `reservations`
- **Filtros:**
  ```json
  {
    "id": "{{ $json }}"
  }
  ```

#### **6. Notification - Send to Dashboard**
- **Tipo:** HTTP Request (o Email)
- **Método:** POST
- **URL:** `{{ $env.APP_URL }}/api/notifications`
- **Body:**
  ```json
  {
    "type": "noshow_auto_released",
    "title": "Reserva Auto-liberada",
    "message": "Reserva de {{ $json.customer_name }} para {{ $json.reservation_time }} fue auto-liberada por no confirmar.",
    "reservation_id": "{{ $json.id }}"
  }
  ```

---

## 🔐 **VARIABLES DE ENTORNO NECESARIAS**

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Restaurant
RESTAURANT_ID=d6b63130-1ebf-4284-98fc-a3b31a85d9d1

# WhatsApp API
WHATSAPP_API_URL=https://api.whatsapp.com/v1
WHATSAPP_API_KEY=xxx

# OpenAI (para analizar respuestas)
OPENAI_API_KEY=sk-xxx

# App URL
APP_URL=https://tu-app.vercel.app
```

---

## 🧪 **TESTING DE WORKFLOWS**

### **Test 1: Confirmación 24h**
```bash
# Crear reserva para mañana
# Ejecutar workflow manualmente
# Verificar que se envió WhatsApp
# Verificar que se registró en customer_confirmations
```

### **Test 2: Respuesta Cliente**
```bash
# Enviar webhook simulado
# Verificar que se actualizó confirmation_response
# Verificar que risk_score bajó
```

### **Test 3: Alarma Creada**
```bash
# Crear reserva en 2h 15min con riesgo alto
# Ejecutar workflow
# Verificar que alarma aparece en Dashboard
```

---

## 📊 **MONITOREO**

### **Métricas a trackear:**
1. Mensajes enviados por día
2. Tasa de respuesta
3. Alarmas creadas vs resueltas
4. Auto-liberaciones ejecutadas

### **Logs importantes:**
- Errores al enviar WhatsApp
- Respuestas no procesadas
- Reservas sin teléfono

---

**¿Listo para implementar?** 🚀

**Siguiente paso:** Crear estos 5 workflows en N8n y empezar a prevenir no-shows reales.


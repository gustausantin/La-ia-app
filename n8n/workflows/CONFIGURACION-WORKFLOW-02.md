# 📋 Configuración Detallada - Workflow 02: Recordatorio 4h Antes

## ✅ Checklist de Nodos Configurados

### ✅ Nodo 1: ⏰ Cron Cada 30 min
**Tipo:** `scheduleTrigger`  
**Configuración:**
```
Cron Expression: */30 * * * *
```
**Qué hace:** Se ejecuta cada 30 minutos (48 veces al día)

---

### ✅ Nodo 2: 📊 Obtener Reservas 4h Window
**Tipo:** `supabase`  
**Configuración:**
```
Resource: Row
Operation: executeQuery
Query: SELECT * FROM get_reservations_4h_window()
Credentials: Supabase La-IA
```

**Campos que retorna:**
- `id` (UUID de reserva)
- `restaurant_id` (UUID)
- `customer_id` (UUID)
- `customer_name` (TEXT)
- `customer_phone` (TEXT)
- `customer_email` (TEXT)
- `reservation_date` (DATE)
- `reservation_time` (TIME)
- `party_size` (INTEGER)
- `status` (TEXT)
- `confirmacion_4h_sent` (BOOLEAN o NULL)

---

### ✅ Nodo 3: 🔍 Filtrar: Sin Mensaje 4h Previo
**Tipo:** `code` (JavaScript)  
**Configuración:**
```javascript
// Filtra solo reservas que:
// 1. Tienen teléfono válido
// 2. NO han recibido mensaje de 4h (confirmacion_4h_sent es null/false)

const items = $input.all();
const filtered = items.filter(item => {
  const data = item.json;
  return data.customer_phone && 
         data.customer_phone !== '' &&
         (!data.confirmacion_4h_sent || data.confirmacion_4h_sent === false);
});
return filtered;
```

---

### ✅ Nodo 4: ❓ ¿Hay Reservas?
**Tipo:** `if`  
**Configuración:**
```
Condition: {{ $input.all().length }} > 0
```
**Salidas:**
- TRUE → Continúa al Loop
- FALSE → Va a "✅ Fin: Sin Reservas"

---

### ✅ Nodo 5: 🔁 Loop Cada Reserva
**Tipo:** `splitInBatches`  
**Configuración:**
```
Batch Size: 1 (por defecto)
Mode: Loop Items
```
**Qué hace:** Procesa cada reserva una por una

---

### ✅ Nodo 6: 📞 Normalizar Teléfono
**Tipo:** `code` (JavaScript)  
**Configuración:**
```javascript
// 1. Normaliza teléfono agregando +34 si falta
// 2. Calcula horas restantes hasta la reserva

const items = $input.all();
const results = items.map(item => {
  const data = item.json;
  let phone = data.customer_phone || '';
  
  // Normalizar
  if (phone && !phone.startsWith('+')) {
    if (phone.startsWith('34')) {
      phone = '+' + phone;
    } else if (phone.startsWith('0034')) {
      phone = '+' + phone.substring(2);
    } else {
      phone = '+34' + phone;
    }
  }
  
  // Calcular horas restantes
  const now = new Date();
  const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
  const hoursRemaining = Math.round((reservationDateTime - now) / (1000 * 60 * 60));
  
  return {
    json: {
      ...data,
      customer_phone_normalized: phone,
      hours_remaining: hoursRemaining
    }
  };
});
return results;
```

**Salida:**
- Agrega `customer_phone_normalized`
- Agrega `hours_remaining`

---

### ✅ Nodo 7: 📍 Obtener Config Restaurante
**Tipo:** `supabase`  
**Configuración:**
```
Resource: Row
Operation: getAll
Table: restaurants
Return All: true
Filters:
  - Field: id
    Condition: eq (equals)
    Value: {{ $json.restaurant_id }}
Credentials: Supabase La-IA
```

**Campos que usa:**
- `phone` → Número de WhatsApp del restaurante

---

### ✅ Nodo 8: 📱 Twilio: Enviar WhatsApp 4h
**Tipo:** `twilio`  
**Configuración:**
```
Resource: SMS
Operation: send
From: {{ $json.phone }}
To: {{ $('📞 Normalizar Teléfono').item.json.customer_phone_normalized }}
To Whatsapp: ON
Message: 
  Hola {{ $node["📞 Normalizar Teléfono"].json.customer_name }}! 👋

  Te recordamos que tu reserva es *en {{ $node["📞 Normalizar Teléfono"].json.hours_remaining }} horas* 
  (a las {{ $node["📞 Normalizar Teléfono"].json.reservation_time }}) 
  para *{{ $node["📞 Normalizar Teléfono"].json.party_size }} personas*.

  ¿Todo sigue en pie? 🤔

  ✅ Responde SÍ para confirmar
  ❌ Responde NO si necesitas cancelar

  Gracias! 🍽️

Credentials: Twilio account
```

**Variables del mensaje:**
- `customer_name` → Nombre del cliente
- `hours_remaining` → Horas calculadas hasta la reserva
- `reservation_time` → Hora de la reserva (HH:MM:SS)
- `party_size` → Número de personas

---

### ✅ Nodo 9: 💾 Registrar Confirmación 4h
**Tipo:** `supabase`  
**Configuración:**
```
Resource: Row
Operation: create
Table: customer_confirmations
Fields:
  - reservation_id: {{ $node["📞 Normalizar Teléfono"].json.id }}
  - restaurant_id: {{ $node["📞 Normalizar Teléfono"].json.restaurant_id }}
  - message_type: "Confirmación 4h antes"
  - sent_at: {{ new Date().toISOString() }}
  - message_content: {{ $node["📱 Twilio: Enviar WhatsApp 4h"].json.body }}
Credentials: Supabase La-IA
```

**Tabla:** `customer_confirmations`  
**Columnas que usa:**
- `reservation_id` (UUID, NOT NULL)
- `restaurant_id` (UUID, NOT NULL)
- `customer_id` (UUID, NULL)
- `message_type` (TEXT, NOT NULL)
- `sent_at` (TIMESTAMPTZ, NOT NULL)
- `message_content` (TEXT)

---

### ✅ Nodo 10: ✅ Fin: Sin Reservas
**Tipo:** `noOp`  
**Configuración:** Ninguna (solo marca el fin del flujo)

---

## 📊 Tablas de Supabase Utilizadas

### 1. `reservations` (vía RPC)
```sql
Columnas leídas:
- id
- restaurant_id
- customer_id
- customer_name
- customer_phone
- customer_email
- reservation_date
- reservation_time
- party_size
- status
```

### 2. `restaurants`
```sql
Columnas leídas:
- id (filtro)
- phone (teléfono de Twilio)
```

### 3. `customer_confirmations`
```sql
Columnas escritas:
- reservation_id
- restaurant_id
- customer_id (opcional)
- message_type
- sent_at
- message_content
```

---

## 🔗 Flujo de Datos

```
Cron (cada 30 min)
    ↓
RPC: get_reservations_4h_window()
    ↓ retorna Array de reservas
Code: Filtrar sin mensaje 4h previo
    ↓ retorna Array filtrado
IF: ¿length > 0?
    ↓ TRUE
Loop: Cada reserva
    ↓ 1 item a la vez
Code: Normalizar teléfono + calcular horas
    ↓ agrega: customer_phone_normalized, hours_remaining
Supabase: Obtener restaurants WHERE id = restaurant_id
    ↓ retorna: { phone, ... }
Twilio: Enviar WhatsApp
    ↓ FROM: restaurant.phone, TO: customer_phone_normalized
    ↓ retorna: { sid, body, status, ... }
Supabase: INSERT INTO customer_confirmations
    ↓ guarda: reservation_id, message_type, sent_at, etc.
    ↓ vuelve al Loop
```

---

## ✅ Checklist de Importación

Antes de importar, verifica:

- [ ] Migración `20251010_001_n8n_helper_functions.sql` ejecutada
- [ ] Migración `20251010_002_normalize_customer_data.sql` ejecutada
- [ ] Migración `20251010_003_normalize_phone_numbers.sql` ejecutada
- [ ] Tabla `customer_confirmations` creada
- [ ] Credencial "Supabase La-IA" configurada en N8n
- [ ] Credencial "Twilio account" configurada en N8n
- [ ] Workflow 01 (24h) activo (recomendado)

---

## 🚀 Para Activar

1. Importar JSON en N8n
2. Verificar credenciales
3. **Activar workflow** (toggle ON)
4. Esperar 30 minutos para primera ejecución
5. Verificar logs en N8n

---

## 🧪 Para Probar

```sql
-- 1. Crear reserva de prueba en 4.5 horas
INSERT INTO reservations (
  restaurant_id,
  customer_phone,
  customer_name,
  reservation_date,
  reservation_time,
  party_size,
  status
) VALUES (
  'tu-restaurant-id',
  '671126148',
  'Test Cliente',
  CURRENT_DATE,
  (CURRENT_TIME + INTERVAL '4 hours 30 minutes')::TIME,
  2,
  'pending'
);

-- 2. Ver si RPC la detecta
SELECT * FROM get_reservations_4h_window();

-- 3. Esperar 30 min o ejecutar manualmente en N8n

-- 4. Verificar envío
SELECT * FROM customer_confirmations 
WHERE message_type = 'Confirmación 4h antes'
ORDER BY sent_at DESC
LIMIT 5;
```

---

✅ **WORKFLOW 100% CONFIGURADO Y LISTO PARA USAR**



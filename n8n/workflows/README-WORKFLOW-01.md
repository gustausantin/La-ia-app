# 📱 Workflow N8n: Recordatorio 24h Antes

## 📋 Descripción
Workflow automatizado que envía recordatorios por WhatsApp 24 horas antes de cada reserva.

## 🔄 Flujo del Workflow

```
⏰ Cron (10:00 AM diario)
    ↓
📊 Obtener TODAS las Reservas
    ↓
🔍 Filtrar: Mañana + Pending
    ↓
❓ ¿Hay Reservas?
    ↓ (Si)
🔁 Loop Cada Reserva
    ↓
📞 Normalizar Teléfono
    ↓
📍 Obtener Config Restaurante
    ↓
📱 Twilio: Enviar WhatsApp
    ↓
💾 Registrar Confirmación
    ↓ (volver al loop)
```

## 🎯 Multi-Tenant

El workflow es **100% multi-tenant**:

- ✅ Obtiene el teléfono FROM desde `restaurants.phone` dinámicamente
- ✅ Obtiene datos del cliente desde `reservations` (vinculado a `customers` vía `customer_id`)
- ✅ No hay IDs hardcodeados (excepto credentials de N8n)

## 📊 Datos de Supabase

### Tabla `reservations`
```sql
SELECT 
  id,
  restaurant_id,
  customer_id,          -- FK a customers
  customer_phone,       -- DEPRECATED: usar customers.phone
  customer_name,        -- DEPRECATED: usar customers.name
  reservation_date,
  reservation_time,
  party_size,
  status
FROM reservations
WHERE reservation_date = tomorrow
  AND status = 'pending'
```

### Tabla `customers` (via customer_id)
```sql
SELECT
  id,
  name,
  email,
  phone
FROM customers
WHERE id = reservations.customer_id
```

### Tabla `restaurants`
```sql
SELECT
  phone,              -- Número de Twilio para enviar WhatsApp
  settings
FROM restaurants
WHERE id = reservations.restaurant_id
```

### Tabla `customer_confirmations`
```sql
INSERT INTO customer_confirmations (
  reservation_id,
  restaurant_id,
  customer_id,        -- Opcional (nullable)
  message_type,       -- 'Confirmación 24h antes'
  sent_at,
  message_content
)
```

## ⚙️ Configuración

### 1. Credenciales Supabase
- **Host**: `ktsqwvhqamedpmzkzjaz.supabase.co`
- **Service Role Key**: (configurado en N8n)

### 2. Credenciales Twilio
- **Account SID**: (configurado en N8n)
- **Auth Token**: (configurado en N8n)
- **From Number**: Dinámico desde `restaurants.phone`

### 3. Horario
- **Cron**: `0 10 * * *` (10:00 AM UTC diario)
- **Nota**: Debería ser configurable por restaurante (zona horaria)

## 🔧 Normalización de Teléfono

El nodo "📞 Normalizar Teléfono" agrega el prefijo `+34` si falta:

```javascript
let phone = data.customer_phone || '';

if (phone && !phone.startsWith('+')) {
  if (phone.startsWith('34')) {
    phone = '+' + phone;
  } else if (phone.startsWith('0034')) {
    phone = '+' + phone.substring(2);
  } else {
    phone = '+34' + phone;  // ⚠️ HARDCODED para España
  }
}
```

**⚠️ Limitación**: Solo funciona para España (+34).

## 📝 Mensaje de WhatsApp

```
Hola {{customer_name}}! 👋

Te esperamos *mañana a las {{reservation_time}}* para *{{party_size}} personas*.

¿Confirmas tu asistencia?

✅ Responde SÍ para confirmar
❌ Responde NO si necesitas cancelar

Gracias! 🍽️
```

**⚠️ Limitación**: Mensaje en español hardcodeado.

## 🐛 Troubleshooting

### Error: "The 'To' number is not a valid phone number"
- **Causa**: El número no está en el Sandbox de Twilio
- **Solución**: Agregar el número al Sandbox o usar cuenta de pago

### Error: "Invalid From and To pair"
- **Causa**: Falta el prefijo `whatsapp:` en FROM o TO
- **Solución**: Verificar que ambos tengan `whatsapp:+...`

### Error: "Channel not found"
- **Causa**: El número FROM no tiene WhatsApp habilitado en Twilio
- **Solución**: Habilitar WhatsApp en ese número desde Twilio Console

### No llegan mensajes
- **Causa 1**: El workflow se ejecutó pero Twilio tiene restricciones
- **Causa 2**: El número TO no está verificado en Sandbox
- **Solución**: Revisar logs de Twilio y verificar números

## 🚀 Mejoras Futuras

1. **Multi-idioma**: Obtener plantillas de mensajes desde BD por idioma
2. **Zona horaria dinámica**: Cron configurable por restaurante
3. **Código de país dinámico**: Obtener desde `restaurants.settings.country_code`
4. **Usar datos de customers**: Migrar completamente a usar `customer_id` en vez de campos duplicados

## 📊 Métricas

El workflow registra en `customer_confirmations`:
- Cuántos mensajes se enviaron
- A qué hora se enviaron
- Contenido del mensaje
- ID de la reserva y restaurante

Esto permite trackear:
- Tasa de respuesta de clientes
- Tiempo de respuesta promedio
- Efectividad del sistema de recordatorios

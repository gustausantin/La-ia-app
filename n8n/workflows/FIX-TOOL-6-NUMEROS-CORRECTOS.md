# ✅ FIX COMPLETADO - TOOL-6: Números de WhatsApp Correctos

## 🎯 PROBLEMA IDENTIFICADO

El workflow estaba usando los números al revés:
- ❌ **FROM:** Número del cliente
- ❌ **TO:** Número de emergencia

**Resultado:** Twilio no podía enviar porque el FROM no era un número válido de Twilio.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Configuración correcta:**

```
FROM (quien envía) → Número de Twilio del restaurante
TO (quien recibe)  → Número de emergencia del encargado
```

### **Estructura en BD:**

```json
{
  "channels": {
    "whatsapp": {
      "phone_number": "+14155238886",      // ← Twilio (ENVÍA mensajes)
      "emergency_phone": "+34671126148"     // ← Encargado (RECIBE alertas)
    }
  }
}
```

---

## 🔧 CAMBIOS REALIZADOS

### **1. Nodo "🚨 Construir Alerta"**

**ANTES:**
```javascript
const emergencyPhone = whatsapp.emergency_phone || whatsapp.phone_number || restaurant.phone;
```

**AHORA:**
```javascript
// ✅ NÚMERO DE TWILIO (quien ENVÍA - FROM)
const twilioNumber = whatsapp.phone_number || restaurant.phone;

// ✅ NÚMERO DE EMERGENCIA (quien RECIBE - TO)
const emergencyPhone = whatsapp.emergency_phone;

// Validaciones
if (!twilioNumber) {
  throw new Error('❌ No se encontró número de Twilio');
}

if (!emergencyPhone) {
  throw new Error('❌ No se encontró teléfono de emergencia');
}
```

**Output:**
```json
{
  "twilio_number": "+14155238886",
  "emergency_phone": "+34671126148",
  "alert_message": "🚨🚨🚨 ALERTA..."
}
```

### **2. Nodo "📱 Enviar WhatsApp Urgente"**

**ANTES:**
```json
{
  "from": "={{ $json.customerPhone }}",  // ❌ INCORRECTO
  "to": "={{ $json.emergency_phone }}"
}
```

**AHORA:**
```json
{
  "from": "={{ $json.twilio_number }}",     // ✅ Número de Twilio
  "to": "={{ $json.emergency_phone }}"      // ✅ Número del encargado
}
```

---

## 📋 CONFIGURACIÓN REQUERIDA EN SUPABASE

### **Ejecutar este SQL:**

```sql
-- Actualizar restaurante con los números correctos
UPDATE restaurants
SET channels = jsonb_set(
  jsonb_set(
    COALESCE(channels, '{}'::jsonb),
    '{whatsapp,phone_number}',
    '"+14155238886"'::jsonb  -- TU número de Twilio
  ),
  '{whatsapp,emergency_phone}',
  '"+34671126148"'::jsonb    -- Número del encargado
)
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';
```

### **Verificar configuración:**

```sql
SELECT 
  name,
  channels->'whatsapp'->>'phone_number' as twilio_number,
  channels->'whatsapp'->>'emergency_phone' as emergency_phone
FROM restaurants
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';
```

**Resultado esperado:**
```
name                      | twilio_number      | emergency_phone
--------------------------+--------------------+------------------
La Terraza de Guillermo   | +14155238886       | +34671126148
```

---

## 🧪 TESTING

### **Test manual:**

1. **Configurar números en Supabase** (SQL arriba)
2. **Importar workflow actualizado** `TOOL-6-escalate-to-human.json`
3. **Ejecutar con input de prueba:**

```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "customer_phone": "+34671126148",
  "customer_name": "Gustau",
  "customer_message": "Quiero hablar con el encargado",
  "reason": "cliente_solicita",
  "urgency": "high"
}
```

4. **Verificar que recibes el WhatsApp** en el `emergency_phone`

### **Mensaje esperado:**

```
🚨🚨🚨 ALERTA - CLIENTE NECESITA ATENCIÓN

🙋 El cliente solicita hablar con una persona

👤 Cliente: Gustau
📞 Teléfono: +34671126148
⏰ Hora: 14/10/2025, 22:47:28

💬 Mensaje del cliente:
"Quiero hablar con el encargado"

⚡ Acción requerida: Contactar al cliente URGENTEMENTE

---
Restaurante: La Terraza de Guillermo
```

---

## 📊 LOGS DE VALIDACIÓN

El workflow ahora muestra estos logs en consola:

```
📤 Configuración envío:
   FROM (Twilio): +14155238886
   TO (Emergencia): +34671126148
   Mensaje: 🚨🚨🚨 ALERTA - CLIENTE NECESITA ATENCIÓN...
```

Si falta algún número, lanza error descriptivo:
```
❌ No se encontró número de Twilio para el restaurante (channels.whatsapp.phone_number)
❌ No se encontró teléfono de emergencia para el restaurante (channels.whatsapp.emergency_phone)
```

---

## ✅ CHECKLIST FINAL

- [x] Código actualizado en "🚨 Construir Alerta"
- [x] Nodo Twilio corregido (FROM y TO)
- [x] SQL de configuración creado
- [x] Validaciones añadidas
- [x] Logs mejorados
- [x] Documentación completa

---

## 🚀 ESTADO

**TODO LISTO PARA TESTING EN PRODUCCIÓN** ✅

Archivos actualizados:
- `n8n/workflows/TOOL-6-escalate-to-human.json`
- `supabase/migrations/CONFIGURAR_EMERGENCY_PHONE.sql`



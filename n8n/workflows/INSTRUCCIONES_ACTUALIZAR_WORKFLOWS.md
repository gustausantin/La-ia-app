# 🔧 INSTRUCCIONES: Actualizar Workflows N8n para usar Plantillas CRM

## ✅ **Estado Actual:** Plantillas creadas en Supabase

---

## 📝 **WORKFLOW 1: Recordatorio 24h antes**

### **CAMBIOS A REALIZAR:**

#### **1. AÑADIR NODO: "📄 Obtener Plantilla 24h"**

**Posición:** Entre "📍 Obtener Config Restaurante" y "📱 Twilio: Enviar WhatsApp"

**Configuración:**
```
Tipo de nodo: Supabase
Operación: Execute Query
Query: 
SELECT * FROM get_reminder_template(
  '{{ $node["📍 Obtener Config Restaurante"].json.id }}', 
  'Recordatorio 24h antes'
)
```

**Credenciales:** Supabase La-IA

---

#### **2. AÑADIR NODO: "🔄 Reemplazar Variables"**

**Posición:** Entre "📄 Obtener Plantilla 24h" y "📱 Twilio: Enviar WhatsApp"

**Tipo:** Code (JavaScript)

**Código:**
```javascript
// Obtener la plantilla desde Supabase
const template = $json.content || '';

// Obtener datos de nodos anteriores
const reserva = $node["📞 Normalizar Teléfono"].json;
const restaurant = $node["📍 Obtener Config Restaurante"].json;

// Preparar variables a reemplazar
const variables = {
  customer_name: reserva.customer_name || 'Cliente',
  restaurant_name: restaurant.name || 'Restaurante',
  reservation_time: reserva.reservation_time || '',
  party_size: (reserva.party_size || 1).toString()
};

// Reemplazar cada variable en la plantilla
let message = template;
for (const [key, value] of Object.entries(variables)) {
  const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
  message = message.replace(regex, value);
}

// Retornar el mensaje personalizado
return [{
  json: {
    ...reserva,
    message_final: message,
    template_used: 'Recordatorio 24h antes'
  }
}];
```

---

#### **3. MODIFICAR NODO: "📱 Twilio: Enviar WhatsApp"**

**Cambiar el campo `message` de:**
```
ANTES (hardcodeado):
Hola {{ $node["📞 Normalizar Teléfono"].json.customer_name }}! 👋

Te esperamos *mañana a las {{ $node["📞 Normalizar Teléfono"].json.reservation_time }}* para *{{ $node["📞 Normalizar Teléfono"].json.party_size }} personas*.

¿Confirmas tu asistencia?

✅ Responde SÍ para confirmar
❌ Responde NO si necesitas cancelar

Gracias! 🍽️
```

**A:**
```
AHORA (desde plantilla):
={{ $json.message_final }}
```

---

#### **4. ACTUALIZAR CONEXIONES:**

```
📍 Obtener Config Restaurante 
    ↓
📄 Obtener Plantilla 24h (NUEVO)
    ↓
🔄 Reemplazar Variables (NUEVO)
    ↓
📱 Twilio: Enviar WhatsApp (MODIFICADO)
    ↓
💾 Registrar Confirmación
```

---

## 📝 **WORKFLOW 2: Recordatorio 4h antes (Alerta Urgente)**

### **CAMBIOS A REALIZAR:**

**EXACTAMENTE LO MISMO** que el workflow 24h, pero cambiar:

#### **En el nodo "📄 Obtener Plantilla 4h":**
```sql
SELECT * FROM get_reminder_template(
  '{{ $node["📍 Obtener Config Restaurante"].json.id }}', 
  'Recordatorio 4h antes'
)
```

#### **En el nodo "🔄 Reemplazar Variables":**
Cambiar la línea:
```javascript
template_used: 'Recordatorio 4h antes'  // ← Cambiar aquí
```

---

## 🧪 **PROBAR LOS WORKFLOWS**

### **1. Ejecutar manualmente el workflow:**
- N8n → Workflow → Execute Workflow

### **2. Verificar que:**
- ✅ Se obtiene la plantilla desde Supabase
- ✅ Se reemplazan las variables correctamente
- ✅ El mensaje final tiene los datos reales (no {{variables}})
- ✅ Se envía el WhatsApp con el mensaje personalizado

### **3. Consulta SQL para verificar envíos:**
```sql
SELECT 
    customer_id,
    message_type,
    message_content,
    sent_at
FROM customer_confirmations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
ORDER BY sent_at DESC
LIMIT 5;
```

---

## 🎨 **SIGUIENTE PASO: Interfaz para Editar Plantillas**

Una vez que los workflows funcionen, crearemos una página en la app para que puedas:
- Ver todas tus plantillas
- Editar el mensaje
- Activar/desactivar plantillas
- Ver variables disponibles
- Probar plantillas antes de guardar

---

## 📊 **VENTAJAS DE ESTE SISTEMA**

✅ **Multi-tenant:** Cada restaurante tiene sus propias plantillas  
✅ **Personalizable:** Cambias el mensaje desde la app, no desde N8n  
✅ **Escalable:** Añadir nuevas plantillas es trivial  
✅ **Sin hardcodeo:** Todo el contenido está en la BD  
✅ **Versionado:** Historial de cambios en Supabase  
✅ **Centralizado:** Una única fuente de verdad para todos los mensajes  

---

## 🚨 **IMPORTANTE**

- **NO toques** el nodo "📞 Normalizar Teléfono" (sigue igual)
- **NO toques** el nodo "📍 Obtener Config Restaurante" (sigue igual)
- **NO toques** el nodo "💾 Registrar Confirmación" (sigue igual)
- **SOLO añades** 2 nodos nuevos en medio
- **SOLO modificas** el campo `message` del nodo Twilio

---

**Fecha:** 11 Octubre 2025  
**Estado:** ✅ LISTO PARA IMPLEMENTAR EN N8N  
**Siguiente:** Actualizar workflows en N8n siguiendo estas instrucciones



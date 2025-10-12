# ✅ WORKFLOWS N8N CON PLANTILLAS CRM - LISTOS PARA IMPORTAR

## 🎯 **¿QUÉ HEMOS HECHO?**

✅ **Plantillas creadas en Supabase** (ya ejecutado)  
✅ **2 Workflows listos para importar en N8n**  

---

## 📂 **ARCHIVOS PARA IMPORTAR EN N8N**

### 1️⃣ **Recordatorio 24h antes**
📄 Archivo: `02-recordatorio-24h-CON-PLANTILLAS-FINAL.json`

**Qué hace:**
- Se ejecuta cada día a las 10:00 AM
- Busca reservas para mañana con status `pending`
- **Descarga la plantilla desde Supabase**
- Reemplaza variables (`{{customer_name}}`, etc.)
- Envía WhatsApp personalizado
- Registra el envío en `customer_confirmations`

---

### 2️⃣ **Alerta Urgente 4h antes**
📄 Archivo: `03-alerta-urgente-4h-CON-PLANTILLAS-FINAL.json`

**Qué hace:**
- Se ejecuta cada hora
- Busca reservas HOY entre 4-6h en el futuro con status `pending`
- **Descarga la plantilla desde Supabase**
- Reemplaza variables
- Envía WhatsApp urgente
- Registra el envío

---

## 🔧 **CÓMO IMPORTAR EN N8N**

### **Paso 1: Ir a N8n**
```
https://tu-n8n.com
```

### **Paso 2: Importar Workflow 24h**
1. Click en **"+ New Workflow"**
2. Click en **"⋮" (menú)** → **"Import from File"**
3. Selecciona: `02-recordatorio-24h-CON-PLANTILLAS-FINAL.json`
4. Click **"Save"**
5. ✅ Activa el workflow

### **Paso 3: Importar Workflow 4h**
1. Click en **"+ New Workflow"**
2. Click en **"⋮" (menú)** → **"Import from File"**
3. Selecciona: `03-alerta-urgente-4h-CON-PLANTILLAS-FINAL.json`
4. Click **"Save"**
5. ✅ Activa el workflow

---

## 🧪 **PROBAR LOS WORKFLOWS**

### **Opción 1: Ejecución Manual**
1. Abre el workflow en N8n
2. Click en **"Execute Workflow"**
3. Verifica que:
   - Se obtiene la plantilla desde Supabase ✅
   - Se reemplazan las variables ✅
   - Se genera el mensaje final ✅

### **Opción 2: Crear reserva de prueba**
```sql
-- Crear reserva para mañana (prueba 24h)
INSERT INTO reservations (
    restaurant_id,
    customer_name,
    customer_phone,
    customer_email,
    reservation_date,
    reservation_time,
    party_size,
    status,
    channel
) VALUES (
    'd6b63130-1ebf-4284-98fc-a3b31a85d9d1',
    'Test Cliente',
    '+34666777888',
    'test@test.com',
    CURRENT_DATE + INTERVAL '1 day',
    '20:00:00',
    2,
    'pending',
    'web'
);
```

Espera a las 10:00 AM y debería enviar el WhatsApp automáticamente.

---

## 📊 **VERIFICAR ENVÍOS**

```sql
-- Ver últimos mensajes enviados
SELECT 
    c.customer_id,
    r.customer_name,
    r.customer_phone,
    c.message_type,
    c.message_content,
    c.sent_at
FROM customer_confirmations c
JOIN reservations r ON r.id = c.reservation_id
WHERE c.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
ORDER BY c.sent_at DESC
LIMIT 10;
```

---

## 🎨 **EDITAR PLANTILLAS (Desde Supabase por ahora)**

```sql
-- Ver plantillas actuales
SELECT 
    name,
    content_markdown,
    is_active,
    updated_at
FROM message_templates
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND name LIKE '%Recordatorio%';

-- Editar plantilla 24h
UPDATE message_templates
SET content_markdown = 'Tu nuevo mensaje aquí con {{customer_name}} y {{reservation_time}}'
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND name = 'Recordatorio 24h antes';

-- Editar plantilla 4h
UPDATE message_templates
SET content_markdown = 'Tu nuevo mensaje urgente con {{customer_name}}'
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND name = 'Recordatorio 4h antes';
```

**Nota:** N8n usará automáticamente el nuevo mensaje sin necesidad de tocar nada en N8n.

---

## 🚀 **PRÓXIMO PASO: Interfaz en la App**

Crearemos una página `/configuracion/plantillas` donde podrás:
- ✅ Ver todas tus plantillas
- ✅ Editar el mensaje con editor visual
- ✅ Ver variables disponibles
- ✅ Activar/desactivar plantillas
- ✅ Probar plantillas antes de guardar
- ✅ Ver historial de cambios

---

## ✅ **RESUMEN DE CAMBIOS**

### **Nodos Nuevos Añadidos:**
1. **📄 Obtener Plantilla** (Supabase Query)
   - Consulta: `SELECT * FROM get_reminder_template(...)`
   - Descarga la plantilla desde Supabase

2. **🔄 Reemplazar Variables** (Code)
   - Reemplaza `{{customer_name}}` → `Juan`
   - Reemplaza `{{reservation_time}}` → `20:00`
   - etc.

### **Nodos Modificados:**
- **📱 Twilio: Enviar WhatsApp**
  - Antes: Mensaje hardcodeado
  - Ahora: `={{ $json.message_final }}`

---

## 🔍 **VARIABLES DISPONIBLES**

En tus plantillas puedes usar:
- `{{customer_name}}` - Nombre del cliente
- `{{restaurant_name}}` - Nombre del restaurante  
- `{{reservation_time}}` - Hora (ej: 20:00)
- `{{reservation_date}}` - Fecha (ej: 2025-10-12)
- `{{party_size}}` - Número de personas
- `{{restaurant_phone}}` - Teléfono del restaurante

---

## 🎯 **VENTAJAS**

✅ **Sin hardcodeo:** Todo el contenido está en la BD  
✅ **Multi-tenant:** Cada restaurante tiene sus plantillas  
✅ **Personalizable:** Cambias mensaje sin tocar N8n  
✅ **Escalable:** Añadir plantillas es trivial  
✅ **Versionado:** Historial en Supabase  
✅ **Centralizado:** Una única fuente de verdad  

---

**Fecha:** 11 Octubre 2025  
**Estado:** ✅ **LISTO PARA USAR**  
**Siguiente paso:** Importar en N8n y activar workflows



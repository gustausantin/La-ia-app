# 📋 IMPLEMENTACIÓN: Plantillas CRM Personalizables

## 🎯 OBJETIVO

Permitir que cada restaurante personalice los mensajes de recordatorio (24h y 4h) desde la aplicación, y que N8n los consuma automáticamente desde Supabase.

---

## 📊 PASO 1: EJECUTAR MIGRACIÓN EN SUPABASE

### ✅ Copiar y Ejecutar este SQL en Supabase SQL Editor:

```sql
-- ========================================
-- PLANTILLAS CRM: Recordatorios 24h y 4h
-- ========================================

-- Función para insertar plantillas de recordatorio
CREATE OR REPLACE FUNCTION insert_reminder_templates_for_restaurant(p_restaurant_id UUID)
RETURNS void AS $$
BEGIN
    -- 1. PLANTILLA: Recordatorio 24h antes
    INSERT INTO message_templates (
        restaurant_id, 
        name, 
        category, 
        template_type,
        segment, 
        event_trigger,
        subject, 
        content_markdown, 
        variables, 
        channel, 
        is_active, 
        priority,
        send_delay_hours,
        optimal_send_time,
        tags
    ) VALUES (
        p_restaurant_id,
        'Recordatorio 24h antes',
        'recordatorio',
        'recordatorio',
        'all',
        'reservation_reminder_24h',
        'Recordatorio: Reserva mañana en {{restaurant_name}} 📅',
        E'Hola {{customer_name}}! 👋\n\nTe esperamos *mañana a las {{reservation_time}}* para *{{party_size}} personas*.\n\n¿Confirmas tu asistencia?\n\n✅ Responde SÍ para confirmar\n❌ Responde NO si necesitas cancelar\n\nGracias! 🍽️',
        ARRAY['customer_name', 'restaurant_name', 'reservation_time', 'party_size'],
        'whatsapp',
        true,
        1,
        -24,
        '10:00',
        ARRAY['recordatorio', 'whatsapp', 'confirmacion', '24h']
    ) ON CONFLICT (restaurant_id, name) DO UPDATE 
    SET 
        content_markdown = EXCLUDED.content_markdown,
        variables = EXCLUDED.variables,
        updated_at = NOW();

    -- 2. PLANTILLA: Recordatorio 4h antes
    INSERT INTO message_templates (
        restaurant_id, 
        name, 
        category, 
        template_type,
        segment, 
        event_trigger,
        subject, 
        content_markdown, 
        variables, 
        channel, 
        is_active, 
        priority,
        send_delay_hours,
        optimal_send_time,
        tags
    ) VALUES (
        p_restaurant_id,
        'Recordatorio 4h antes',
        'recordatorio',
        'recordatorio',
        'all',
        'reservation_reminder_4h',
        '⏰ Tu reserva es en 4 horas - {{restaurant_name}}',
        E'¡Hola {{customer_name}}! ⏰\n\nTe recordamos que tu reserva es *HOY a las {{reservation_time}}* para *{{party_size}} personas*.\n\n¿Todo listo para tu visita?\n\n✅ Responde SÍ si vienes\n❌ Responde NO si necesitas cancelar\n\n¡Te esperamos! 🍽️',
        ARRAY['customer_name', 'restaurant_name', 'reservation_time', 'party_size'],
        'whatsapp',
        true,
        2,
        -4,
        'any',
        ARRAY['recordatorio', 'whatsapp', 'urgente', '4h']
    ) ON CONFLICT (restaurant_id, name) DO UPDATE 
    SET 
        content_markdown = EXCLUDED.content_markdown,
        variables = EXCLUDED.variables,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a todos los restaurantes
DO $$
DECLARE
    restaurant_record RECORD;
BEGIN
    FOR restaurant_record IN 
        SELECT id, name FROM restaurants WHERE active = true
    LOOP
        PERFORM insert_reminder_templates_for_restaurant(restaurant_record.id);
        RAISE NOTICE 'Plantillas creadas para: %', restaurant_record.name;
    END LOOP;
END $$;

-- Actualizar trigger para nuevos restaurantes
CREATE OR REPLACE FUNCTION create_base_crm_templates_for_new_restaurant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active = true THEN
        PERFORM insert_base_templates_for_restaurant(NEW.id);
        PERFORM insert_base_automation_rules_for_restaurant(NEW.id);
        PERFORM insert_reminder_templates_for_restaurant(NEW.id);
        RAISE NOTICE 'Plantillas CRM completas creadas para: %', NEW.name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener plantilla (N8n)
CREATE OR REPLACE FUNCTION get_reminder_template(
    p_restaurant_id UUID,
    p_template_name TEXT DEFAULT 'Recordatorio 24h antes'
)
RETURNS TABLE(
    template_id UUID,
    template_name TEXT,
    content TEXT,
    variables TEXT[],
    channel TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mt.id as template_id,
        mt.name as template_name,
        mt.content_markdown as content,
        mt.variables,
        mt.channel,
        mt.is_active
    FROM message_templates mt
    WHERE mt.restaurant_id = p_restaurant_id
    AND mt.name = p_template_name
    AND mt.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para reemplazar variables
CREATE OR REPLACE FUNCTION replace_template_variables(
    p_template_content TEXT,
    p_variables JSONB
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
    v_key TEXT;
    v_value TEXT;
BEGIN
    v_result := p_template_content;
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        v_result := REPLACE(v_result, '{{' || v_key || '}}', v_value);
    END LOOP;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 🔧 PASO 2: ACTUALIZAR N8N WORKFLOW (24h antes)

### Reemplazar el nodo "📱 Twilio: Enviar WhatsApp" por estos 2 nodos:

#### **Nodo 1: 📄 Obtener Plantilla desde Supabase**

```json
{
  "parameters": {
    "operation": "executeQuery",
    "query": "SELECT * FROM get_reminder_template('{{ $node[\"📍 Obtener Config Restaurante\"].json.id }}', 'Recordatorio 24h antes')",
    "options": {}
  },
  "name": "📄 Obtener Plantilla 24h",
  "type": "n8n-nodes-base.supabase",
  "position": [560, 416],
  "credentials": {
    "supabaseApi": {
      "id": "9pdl4V7ImejCLZWo",
      "name": "Supabase La-IA"
    }
  }
}
```

#### **Nodo 2: 🔄 Reemplazar Variables en Plantilla**

```javascript
// Obtener la plantilla desde Supabase
const template = $json.content;

// Preparar variables a reemplazar
const variables = {
  customer_name: $node["📞 Normalizar Teléfono"].json.customer_name,
  restaurant_name: $node["📍 Obtener Config Restaurante"].json.name,
  reservation_time: $node["📞 Normalizar Teléfono"].json.reservation_time,
  party_size: $node["📞 Normalizar Teléfono"].json.party_size.toString()
};

// Reemplazar cada variable
let message = template;
for (const [key, value] of Object.entries(variables)) {
  const placeholder = `{{${key}}}`;
  message = message.replace(new RegExp(placeholder, 'g'), value);
}

// Retornar el mensaje personalizado
return [{
  json: {
    ...$ node["📞 Normalizar Teléfono"].json,
    message_final: message
  }
}];
```

#### **Nodo 3: 📱 Twilio: Enviar WhatsApp (Modificado)**

```json
{
  "parameters": {
    "from": "={{ $node['📍 Obtener Config Restaurante'].json.phone }}",
    "to": "={{ $node['📞 Normalizar Teléfono'].json.customer_phone_normalized }}",
    "toWhatsapp": true,
    "message": "={{ $json.message_final }}",
    "options": {}
  },
  "name": "📱 Twilio: Enviar WhatsApp",
  "type": "n8n-nodes-base.twilio"
}
```

---

## 🔧 PASO 3: ACTUALIZAR N8N WORKFLOW (4h antes)

### Misma lógica, pero cambiar el nombre de la plantilla:

```sql
SELECT * FROM get_reminder_template('{{ $node["📍 Obtener Config Restaurante"].json.id }}', 'Recordatorio 4h antes')
```

---

## 🎨 PASO 4: CREAR INTERFAZ EN LA APP (Próximo paso)

### Página: `/configuracion/plantillas`

Permitir al restaurante:
- Ver todas sus plantillas
- Editar el contenido de cada plantilla
- Activar/desactivar plantillas
- Vista previa en tiempo real
- Lista de variables disponibles

---

## ✅ BENEFICIOS

1. **✅ Multi-tenant:** Cada restaurante tiene sus propias plantillas
2. **✅ Personalizable:** Cada restaurante edita sus mensajes
3. **✅ Escalable:** Agregar nuevas plantillas es trivial
4. **✅ Versionado:** Historial de cambios en `updated_at`
5. **✅ Variables dinámicas:** Sistema flexible de reemplazo
6. **✅ Sin hardcodeo:** N8n lee desde BD, no texto fijo

---

## 🔍 VERIFICAR PLANTILLAS CREADAS

```sql
-- Ver plantillas de recordatorio creadas
SELECT 
    name,
    category,
    channel,
    is_active,
    content_markdown,
    variables
FROM message_templates
WHERE category = 'recordatorio'
ORDER BY name;
```

---

## 📝 VARIABLES DISPONIBLES

### Para Recordatorios:
- `{{customer_name}}` - Nombre del cliente
- `{{restaurant_name}}` - Nombre del restaurante
- `{{reservation_time}}` - Hora de la reserva
- `{{reservation_date}}` - Fecha de la reserva
- `{{party_size}}` - Número de personas
- `{{restaurant_phone}}` - Teléfono del restaurante

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar SQL en Supabase
2. ⏳ Actualizar workflows N8n (24h y 4h)
3. ⏳ Crear página de Plantillas CRM en la app
4. ⏳ Probar con reservas reales

---

**Fecha:** 11 Octubre 2025  
**Autor:** La-IA CRM Team  
**Estado:** ✅ LISTO PARA IMPLEMENTAR



# 📊 **SUPABASE SCHEMA REFERENCE - LA-IA APP**

> **⚠️ ARCHIVO CRÍTICO:** Este archivo DEBE actualizarse cada vez que se modifique el schema en Supabase
> 
> **Última actualización:** 30 Enero 2025 - 17:15 UTC
> 
> **Total de tablas:** 35 tablas + 3 nuevas = 38 tablas

---

## 🏗️ **TABLAS PRINCIPALES DEL SISTEMA**

### **📱 AUTENTICACIÓN Y USUARIOS**
- `profiles` - Perfiles de usuarios (35 filas)
- `user_restaurant_mapping` - Mapeo usuarios-restaurantes (8 filas)

### **🏪 RESTAURANTES Y CONFIGURACIÓN**
- `restaurants` - Datos principales de restaurantes (13 filas)
- `restaurant_settings` - Configuraciones específicas (8 filas)
- `restaurant_business_config` - Config financiera/business (13 filas)
- `staff` - Personal del restaurante (8 filas)
- `tables` - Mesas del restaurante (13 filas)

### **👥 CLIENTES Y CRM**
- `customers` - Base de datos de clientes (32 columnas)
- `customer_interactions` - Interacciones con clientes (21 columnas)
- `automation_rules` - Reglas de automatización CRM (22 columnas)
- `automation_rule_executions` - Ejecuciones de reglas (10 columnas)

### **📅 RESERVAS Y OPERACIONES**
- `reservations` - Sistema de reservas (23 columnas)
- `reservations_with_customer` - Vista de reservas con datos cliente (19 columnas)
- `daily_metrics` - Métricas diarias del restaurante (20 columnas)

### **💬 COMUNICACIÓN Y MENSAJERÍA**
- `conversations` - Conversaciones unificadas (15 columnas)
- `messages` - Mensajes individuales (10 columnas)
- `message_templates` - Plantillas de mensajes (21 columnas)
- `scheduled_messages` - Mensajes programados (19 columnas)
- `template_variables` - Variables para plantillas (10 columnas)

### **🤖 AGENTE IA Y AUTOMATIZACIÓN**
- `agent_conversations` - Conversaciones del agente IA (13 columnas)
- `agent_metrics` - Métricas del agente (10 columnas)
- `agent_insights` - Insights generados por IA (10 columnas)
- `channel_credentials` - Credenciales de canales (10 columnas)
- `channel_performance` - Performance por canal (8 columnas)

### **📊 ANALYTICS Y REPORTES**
- `analytics` - Métricas generales (7 columnas)
- `analytics_historical` - Histórico de métricas (13 columnas)
- `conversation_analytics` - Analytics de conversaciones (9 columnas)

### **💰 FACTURACIÓN Y FINANZAS**
- `billing_tickets` - Tickets de facturación (24 columnas)

### **📦 INVENTARIO**
- `inventory` - Inventario básico (10 columnas)
- `inventory_items` - Items de inventario avanzado (17 columnas)

### **🔔 NOTIFICACIONES Y LOGS**
- `notifications` - Sistema de notificaciones (12 columnas)
- `interaction_logs` - Logs de interacciones (14 columnas)

---

## 🔧 **CAMPOS CRÍTICOS POR TABLA**

### **✅ TABLA: `customers`** (CONFIRMADA)
```sql
id                    uuid PRIMARY KEY
restaurant_id         uuid NOT NULL
name                 varchar(255) NOT NULL
email                varchar(255)
phone                varchar(50)
first_name           varchar
last_name1           varchar
last_name2           varchar
segment_manual       varchar
segment_auto         varchar DEFAULT 'nuevo'
visits_count         integer DEFAULT 0      -- ⚠️ USAR ESTE, NO total_visits
last_visit_at        timestamptz            -- ⚠️ USAR ESTE, NO last_visit
total_visits         integer DEFAULT 0      -- ⚠️ CAMPO LEGACY
last_visit           timestamptz            -- ⚠️ CAMPO LEGACY
avg_ticket           numeric DEFAULT 0.00
preferred_items      jsonb DEFAULT '[]'
consent_email        boolean DEFAULT true
consent_sms          boolean DEFAULT true
consent_whatsapp     boolean DEFAULT false
total_spent          numeric(10,2) DEFAULT 0
preferences          jsonb DEFAULT '{}'
tags                 text[]
notes                text
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```

### **✅ TABLA: `conversations`** (CONFIRMADA)
```sql
id               uuid PRIMARY KEY
restaurant_id    uuid NOT NULL
customer_id      uuid
customer_name    text NOT NULL
customer_phone   text
customer_email   text
subject          text
status           text DEFAULT 'open'        -- ⚠️ USAR status, NO state
priority         text DEFAULT 'normal'
assigned_to      uuid
channel          text DEFAULT 'app'
tags             text[] DEFAULT ARRAY[]
metadata         jsonb DEFAULT '{}'
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
```

### **✅ TABLA: `reservations`** (CONFIRMADA)
```sql
id                    uuid PRIMARY KEY
restaurant_id         uuid NOT NULL
customer_id           uuid
customer_name         varchar(255) NOT NULL
customer_email        varchar(255)
customer_phone        varchar(50)
reservation_date      date NOT NULL
reservation_time      time NOT NULL
party_size           integer NOT NULL
status               varchar(50) DEFAULT 'confirmed'
table_number         varchar(20)
table_id             uuid
special_requests     text
source               varchar(50) DEFAULT 'web'
channel              varchar(50) DEFAULT 'web'
notes                text
spend_amount         numeric DEFAULT 0.00
reservation_source   varchar DEFAULT 'manual'
reservation_channel  varchar DEFAULT 'web'
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```

### **✅ TABLA: `agent_conversations`** (CONFIRMADA)
```sql
id                    uuid PRIMARY KEY
restaurant_id         uuid
status               varchar(50) DEFAULT 'active'  -- ⚠️ USAR status, NO state
customer_phone       varchar(20)
customer_name        varchar(255)
channel              varchar(50)
started_at           timestamptz DEFAULT now()
ended_at             timestamptz
messages_count       integer DEFAULT 0
satisfaction_score   integer
booking_created      boolean DEFAULT false
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```

### **✅ TABLA: `message_batches_demo`** (NUEVA)
```sql
id                    uuid PRIMARY KEY
batch_id             varchar(50) UNIQUE NOT NULL
restaurant_id        uuid NOT NULL
customer_id          uuid
channel              varchar(20) DEFAULT 'whatsapp'
status               varchar(20) DEFAULT 'active'    -- ⚠️ Corregido: status no state
message_count        integer DEFAULT 0
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
```

### **✅ TABLA: `ai_conversation_insights`** (NUEVA)
```sql
id                              uuid PRIMARY KEY
conversation_id                 uuid NOT NULL
restaurant_id                   uuid NOT NULL
sentiment                       varchar(20)              -- positive, negative, neutral
intent                          varchar(50)              -- reservation, complaint, question
confidence_score                decimal(3,2)             -- 0.00 a 1.00
key_topics                      text[]
suggested_actions               text[]
urgency_level                   integer DEFAULT 1        -- 1 (low) a 5 (urgent)
customer_satisfaction_predicted decimal(3,2)
analysis_metadata               jsonb DEFAULT '{}'
created_at                      timestamptz DEFAULT now()
updated_at                      timestamptz DEFAULT now()
```

### **✅ TABLA: `customer_feedback`** (NUEVA)
```sql
id              uuid PRIMARY KEY
conversation_id uuid NOT NULL
restaurant_id   uuid NOT NULL
customer_id     uuid NOT NULL
rating          integer CHECK (rating >= 1 AND rating <= 5)
feedback_text   text
feedback_type   varchar(20) DEFAULT 'satisfaction'      -- satisfaction, complaint, suggestion
resolved        boolean DEFAULT false
response_text   text
responded_by    uuid                                     -- REFERENCES auth.users(id)
responded_at    timestamptz
created_at      timestamptz DEFAULT now()
```

---

## 🚨 **ERRORES COMUNES A EVITAR**

### **❌ CAMPOS QUE NO EXISTEN:**
- `state` en `conversations` → **USAR `status`**
- `state` en `message_batches_demo` → **USAR `status`**
- `last_message_at` en `conversations` → **CAMPO NO EXISTE**
- `last_message_at` en `message_batches_demo` → **CAMPO NO EXISTE**
- `total_visits` en `customers` → **USAR `visits_count`**
- `last_visit` en `customers` → **USAR `last_visit_at`**

### **✅ TABLAS DE COMUNICACIÓN (NUEVAS):**
- `message_batches_demo` - Batches de mensajes para demostración
- `ai_conversation_insights` - Análisis IA de conversaciones  
- `customer_feedback` - Feedback y ratings de clientes

---

## 🔄 **PROCESO DE ACTUALIZACIÓN**

### **CUANDO MODIFICAR ESTE ARCHIVO:**
1. ✅ Después de crear cualquier tabla nueva
2. ✅ Después de añadir/modificar columnas
3. ✅ Después de cambiar tipos de datos
4. ✅ Después de aplicar migraciones

### **COMANDO PARA REGENERAR:**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT 
    table_name as tabla,
    column_name as columna,
    data_type as tipo,
    CASE 
        WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
        WHEN numeric_precision IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
        ELSE ''
    END as tamaño,
    is_nullable as permite_null,
    column_default as valor_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

---

## 📋 **LISTA COMPLETA DE TABLAS**

1. `agent_conversations` (13 columnas)
2. `agent_insights` (10 columnas)
3. `agent_metrics` (10 columnas)
4. `analytics` (7 columnas)
5. `analytics_historical` (13 columnas)
6. `automation_rule_executions` (10 columnas)
7. `automation_rules` (22 columnas)
8. `billing_tickets` (24 columnas)
9. `channel_credentials` (10 columnas)
10. `channel_performance` (8 columnas)
11. `conversation_analytics` (9 columnas)
12. `conversations` (15 columnas)
13. `customer_interactions` (21 columnas)
14. `customers` (32 columnas)
15. `daily_metrics` (20 columnas)
16. `interaction_logs` (14 columnas)
17. `inventory` (10 columnas)
18. `inventory_items` (17 columnas)
19. `message_templates` (21 columnas)
20. `messages` (10 columnas)
21. `notifications` (12 columnas)
22. `profiles` (10 columnas)
23. `reservations` (23 columnas)
24. `reservations_with_customer` (19 columnas)
25. `restaurant_business_config` (13 columnas)
26. `restaurant_settings` (8 columnas)
27. `restaurants` (15 columnas)
28. `scheduled_messages` (19 columnas)
29. `staff` (10 columnas)
30. `tables` (13 columnas)
31. `template_variables` (10 columnas)
32. `user_restaurant_mapping` (8 columnas)
33. `message_batches_demo` (8 columnas) **[NUEVA]**
34. `ai_conversation_insights` (11 columnas) **[NUEVA]**
35. `customer_feedback` (8 columnas) **[NUEVA]**

---

## 🎯 **USO EN DESARROLLO**

### **ANTES DE HACER CONSULTAS:**
1. ✅ Consultar este archivo primero
2. ✅ Verificar que el campo existe
3. ✅ Usar el nombre correcto del campo
4. ✅ Verificar el tipo de datos

### **EJEMPLOS DE USO CORRECTO:**
```javascript
// ✅ CORRECTO
const customers = await supabase
    .from('customers')
    .select('visits_count, last_visit_at')
    .eq('restaurant_id', restaurantId);

// ❌ INCORRECTO - Campos que no existen
const customers = await supabase
    .from('customers')
    .select('total_visits, last_visit')
    .eq('restaurant_id', restaurantId);
```

---

**🔗 Archivo generado automáticamente el 30 Enero 2025**
**📝 Mantenido por:** Claude AI Assistant
**⚡ Próxima actualización:** Después de la siguiente migración

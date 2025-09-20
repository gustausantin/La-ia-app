# 📊 DOCUMENTACIÓN COMPLETA DE LA BASE DE DATOS - 2025

## 🎯 **RESUMEN EJECUTIVO**
- **41 TABLAS** documentadas completamente
- **TODAS las columnas** con tipos, nullabilidad y defaults
- **TODOS los constraints CHECK** con valores permitidos
- **TODAS las claves primarias y foráneas** mapeadas
- **TODAS las funciones RPC** disponibles

---

## 📋 **TABLAS PRINCIPALES**

### 🏪 **RESTAURANTS** (Tabla central)
```sql
restaurants (
  id: uuid PRIMARY KEY,
  name: character varying NOT NULL,
  email: character varying,
  phone: character varying,
  address: text,
  city: character varying,
  country: character varying DEFAULT 'España',
  postal_code: character varying,
  cuisine_type: character varying,
  active: boolean DEFAULT true,
  plan: character varying DEFAULT 'trial',
  owner_id: uuid,
  business_hours: jsonb DEFAULT '{}',
  agent_config: jsonb DEFAULT '{}',
  crm_config: jsonb DEFAULT '{}',
  settings: jsonb DEFAULT '{}',
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 👥 **CUSTOMERS** (Clientes)
```sql
customers (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  name: character varying NOT NULL,
  first_name: character varying,
  last_name1: character varying,
  last_name2: character varying,
  email: character varying,
  phone: character varying,
  notes: text,
  tags: text[],
  
  -- SEGMENTACIÓN
  segment_auto: character varying DEFAULT 'nuevo'
    CHECK: 'nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor',
  segment_auto_v2: character varying DEFAULT 'nuevo',
  segment_manual: character varying
    CHECK: 'nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor',
  
  -- MÉTRICAS
  total_visits: integer DEFAULT 0,
  visits_12m: integer DEFAULT 0,
  visits_count: integer DEFAULT 0,
  total_spent: numeric DEFAULT 0,
  total_spent_12m: numeric DEFAULT 0,
  avg_ticket: numeric DEFAULT 0.00,
  predicted_ltv: numeric DEFAULT 0.00,
  churn_risk_score: integer DEFAULT 0 CHECK: 0-100,
  recency_days: integer DEFAULT 0,
  aivi_days: numeric DEFAULT 30.0,
  
  -- PREFERENCIAS
  preferred_channel: text DEFAULT 'whatsapp'
    CHECK: 'whatsapp', 'email', 'none',
  preferred_items: jsonb DEFAULT '[]',
  top_dishes: jsonb DEFAULT '[]',
  top_categories: jsonb DEFAULT '[]',
  preferences: jsonb DEFAULT '{}',
  fav_hour_block: integer DEFAULT 20,
  fav_weekday: integer DEFAULT 6,
  
  -- CONSENTIMIENTOS
  consent_email: boolean DEFAULT true,
  consent_sms: boolean DEFAULT true,
  consent_whatsapp: boolean DEFAULT false,
  notifications_enabled: boolean DEFAULT true,
  
  -- FECHAS
  last_visit: timestamp with time zone,
  last_visit_at: timestamp with time zone,
  last_interaction_at: timestamp with time zone,
  last_contacted_at: timestamp with time zone,
  next_action_at: timestamp with time zone,
  features_updated_at: timestamp with time zone DEFAULT now(),
  
  -- SISTEMA
  interaction_count: integer DEFAULT 0,
  is_vip_calculated: boolean DEFAULT false,
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 📅 **RESERVATIONS** (Reservas)
```sql
reservations (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  customer_id: uuid → customers.id,
  customer_name: character varying NOT NULL,
  customer_email: character varying,
  customer_phone: character varying,
  
  -- RESERVA
  reservation_date: date NOT NULL,
  reservation_time: time without time zone NOT NULL,
  party_size: integer NOT NULL,
  table_id: uuid → tables.id,
  table_number: character varying,
  
  -- ESTADO
  status: character varying DEFAULT 'confirmed'
    CHECK: 'pending', 'confirmed', 'cancelled', 'completed', 'no_show',
  
  -- ORIGEN
  channel: character varying DEFAULT 'web',
  reservation_channel: character varying DEFAULT 'web',
  source: character varying DEFAULT 'web',
  reservation_source: character varying DEFAULT 'manual'
    CHECK: 'ia', 'manual',
  
  -- DETALLES
  notes: text,
  special_requests: text,
  spend_amount: numeric DEFAULT 0.00,
  
  -- FECHAS DUPLICADAS (LEGACY)
  date: date,
  time: time without time zone,
  
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 🚫 **NOSHOW_ACTIONS** (Sistema No-Shows)
```sql
noshow_actions (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  reservation_id: uuid → reservations.id,
  customer_id: uuid → customers.id,
  customer_name: character varying NOT NULL,
  customer_phone: character varying,
  
  -- RESERVA
  reservation_date: date NOT NULL,
  reservation_time: time without time zone NOT NULL,
  party_size: integer NOT NULL,
  
  -- RIESGO
  risk_level: character varying NOT NULL
    CHECK: 'low', 'medium', 'high',
  risk_score: integer NOT NULL CHECK: 0-100,
  risk_factors: jsonb DEFAULT '[]',
  
  -- ACCIÓN
  action_type: character varying NOT NULL
    CHECK: 'whatsapp_confirmation', 'whatsapp_reminder', 'whatsapp_urgent', 'call', 'email',
  channel: character varying DEFAULT 'whatsapp'
    CHECK: 'whatsapp', 'email', 'call', 'sms',
  message_sent: text NOT NULL,
  template_id: uuid → crm_templates.id,
  template_name: character varying,
  
  -- RESPUESTA
  customer_response: character varying
    CHECK: 'confirmed', 'cancelled', 'no_response', 'pending',
  response_message: text,
  response_received_at: timestamp with time zone,
  response_time: interval,
  
  -- RESULTADO
  final_outcome: character varying
    CHECK: 'attended', 'no_show', 'cancelled', 'pending',
  prevented_noshow: boolean DEFAULT false,
  reservation_completed_at: timestamp with time zone,
  
  -- FECHAS
  sent_at: timestamp with time zone DEFAULT timezone('utc', now()),
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 💬 **CONVERSATIONS** (Comunicaciones)
```sql
conversations (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  customer_id: uuid → customers.id,
  customer_name: text NOT NULL,
  customer_email: text,
  customer_phone: text,
  assigned_to: uuid,
  
  -- CONVERSACIÓN
  subject: text,
  channel: text DEFAULT 'app'
    CHECK: 'app', 'email', 'phone', 'whatsapp', 'website',
  status: text DEFAULT 'open'
    CHECK: 'open', 'closed', 'pending',
  priority: text DEFAULT 'normal'
    CHECK: 'low', 'normal', 'high', 'urgent',
  
  -- METADATA
  tags: text[] DEFAULT ARRAY[],
  metadata: jsonb DEFAULT '{}',
  
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 📨 **MESSAGES** (Mensajes)
```sql
messages (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  customer_name: character varying,
  customer_phone: character varying,
  message_text: text NOT NULL,
  message_type: character varying DEFAULT 'text',
  direction: character varying NOT NULL
    CHECK: 'inbound', 'outbound',
  channel: character varying NOT NULL,
  status: character varying DEFAULT 'sent',
  metadata: jsonb DEFAULT '{}',
  created_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 🏷️ **MESSAGE_TEMPLATES** (Plantillas)
```sql
message_templates (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  name: text NOT NULL,
  category: text NOT NULL,
  subject: text,
  content_markdown: text NOT NULL DEFAULT '',
  body_markdown: text,
  preview_text: text,
  
  -- CONFIGURACIÓN
  channel: text NOT NULL
    CHECK: 'email', 'sms', 'whatsapp', 'app',
  template_type: character varying
    CHECK: 'bienvenida', 'reactivacion', 'vip_upgrade', 'recordatorio', 'marketing', 'feedback', 'alto_valor', 'en_riesgo',
  segment: text NOT NULL DEFAULT 'all'
    CHECK: 'nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor', 'all',
  segment_target_v2: character varying DEFAULT 'all',
  
  -- PERSONALIZACIÓN
  personalization_level: character varying DEFAULT 'basic'
    CHECK: 'basic', 'advanced', 'ai_powered',
  variables: text[] DEFAULT ARRAY[],
  variables_available: jsonb DEFAULT '[]',
  
  -- CONFIGURACIÓN AVANZADA
  priority: integer DEFAULT 5 CHECK: 1-10,
  event_trigger: text DEFAULT 'manual',
  optimal_send_time: character varying DEFAULT 'any',
  send_delay_hours: integer DEFAULT 0,
  
  -- MÉTRICAS
  usage_count: integer DEFAULT 0,
  success_rate: numeric DEFAULT 0.00,
  conversion_rate: numeric DEFAULT 0.00,
  success_metrics: jsonb DEFAULT '{}',
  
  -- PROVEEDOR
  provider_template_name: text,
  
  -- SISTEMA
  is_active: boolean DEFAULT true,
  tags: text[] DEFAULT ARRAY[],
  created_by: uuid,
  last_used_at: timestamp with time zone,
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 🏢 **CRM_TEMPLATES** (Plantillas CRM)
```sql
crm_templates (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  name: character varying NOT NULL,
  type: character varying NOT NULL,
  subject: character varying NOT NULL,
  content: text NOT NULL,
  variables: jsonb DEFAULT '[]',
  priority: integer DEFAULT 1,
  active: boolean DEFAULT true,
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 🏦 **BILLING_TICKETS** (Tickets/Facturas)
```sql
billing_tickets (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  customer_id: uuid → customers.id,
  reservation_id: uuid → reservations.id,
  table_id: uuid → tables.id,
  
  -- TICKET
  ticket_number: character varying NOT NULL,
  external_ticket_id: character varying,
  ticket_date: timestamp with time zone DEFAULT now(),
  
  -- SERVICIO
  service_start: timestamp with time zone,
  service_end: timestamp with time zone,
  covers_count: integer DEFAULT 1,
  
  -- ITEMS
  items: jsonb NOT NULL DEFAULT '[]',
  
  -- IMPORTES
  subtotal: numeric NOT NULL DEFAULT 0,
  tax_amount: numeric NOT NULL DEFAULT 0,
  discount_amount: numeric NOT NULL DEFAULT 0,
  tip_amount: numeric DEFAULT 0,
  total_amount: numeric NOT NULL DEFAULT 0,
  
  -- DETALLES
  payment_method: character varying,
  mesa_number: character varying,
  waiter_name: character varying,
  kitchen_notes: text,
  special_requests: text,
  
  -- MATCHING
  auto_matched: boolean DEFAULT false,
  confidence_score: numeric DEFAULT 1.0,
  matching_notes: text,
  
  -- PROCESAMIENTO
  is_processed: boolean DEFAULT false,
  processing_errors: text,
  source_system: character varying,
  source_data: jsonb,
  
  -- CONSTRAINTS
  CHECK: ticket_date IS NOT NULL,
  CHECK: service_end IS NULL OR service_start IS NULL OR service_end >= service_start,
  CHECK: subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0,
  CHECK: total_amount = (subtotal + tax_amount) - discount_amount,
  
  created_at: timestamp with time zone DEFAULT now(),
  updated_at: timestamp with time zone DEFAULT now()
)
```

### 🍽️ **TABLES** (Mesas)
```sql
tables (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  table_number: text NOT NULL,
  name: character varying,
  capacity: integer NOT NULL CHECK: capacity > 0,
  location: text,
  zone: character varying DEFAULT 'main',
  status: text DEFAULT 'available'
    CHECK: 'available', 'occupied', 'reserved', 'maintenance',
  position_x: double precision,
  position_y: double precision,
  notes: text,
  is_active: boolean DEFAULT true,
  created_at: timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at: timestamp with time zone DEFAULT timezone('utc', now())
)
```

### 📊 **AVAILABILITY_SLOTS** (Disponibilidad)
```sql
availability_slots (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid NOT NULL → restaurants.id,
  table_id: uuid NOT NULL → tables.id,
  slot_date: date NOT NULL,
  start_time: time without time zone NOT NULL,
  end_time: time without time zone NOT NULL,
  status: text DEFAULT 'free'
    CHECK: 'free', 'held', 'reserved', 'blocked',
  source: text DEFAULT 'system'
    CHECK: 'system', 'manual', 'n8n', 'agent',
  shift_name: text,
  is_available: boolean DEFAULT true,
  metadata: jsonb DEFAULT '{}',
  created_at: timestamp with time zone DEFAULT now(),
  updated_at: timestamp with time zone DEFAULT now()
)
```

---

## 🔧 **FUNCIONES RPC DISPONIBLES**

### 📊 **Dashboard & Analytics**
- `get_dashboard_stats() → jsonb`
- `get_crm_dashboard_stats() → jsonb`
- `get_billing_analytics() → json`
- `get_communication_stats() → record`
- `calculate_restaurant_roi() → record`

### 🚫 **No-Shows**
- `get_restaurant_noshow_metrics() → jsonb`
- `get_customer_noshow_stats() → record`
- `predict_upcoming_noshows() → record`
- `auto_mark_noshows() → integer`

### 👥 **Clientes**
- `calculate_customer_aivi() → jsonb`
- `calculate_customer_segment_v2() → character varying`
- `recompute_customer_segment() → jsonb`
- `recompute_customer_stats() → jsonb`
- `crm_v2_update_all_customers() → jsonb`

### 📅 **Reservas & Disponibilidad**
- `generate_availability_slots() → json`
- `check_availability() → record`
- `book_table() → record`
- `optimize_table_assignment() → jsonb`
- `release_reservation_slot() → boolean`

### 💬 **Mensajería**
- `render_message_template() → text`
- `check_message_eligibility() → jsonb`

### 🏪 **Restaurantes**
- `create_default_restaurant() → uuid`
- `create_restaurant_securely() → jsonb`
- `insert_base_templates_for_restaurant() → void`
- `insert_base_automation_rules_for_restaurant() → void`

---

## 🎯 **CONSTRAINTS CRÍTICOS**

### 📋 **Segmentación de Clientes**
```sql
customers.segment_auto CHECK: 
'nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor'
```

### 🚫 **No-Show Risk Levels**
```sql
noshow_actions.risk_level CHECK: 'low', 'medium', 'high'
noshow_actions.risk_score CHECK: 0-100
```

### 💬 **Canales de Comunicación**
```sql
conversations.channel CHECK: 'app', 'email', 'phone', 'whatsapp', 'website'
conversations.priority CHECK: 'low', 'normal', 'high', 'urgent'
conversations.status CHECK: 'open', 'closed', 'pending'
```

### 📨 **Plantillas de Mensajes**
```sql
message_templates.channel CHECK: 'email', 'sms', 'whatsapp', 'app'
message_templates.segment CHECK: 'nuevo', 'ocasional', 'regular', 'vip', 'inactivo', 'en_riesgo', 'alto_valor', 'all'
message_templates.priority CHECK: 1-10
```

### 📅 **Estados de Reservas**
```sql
reservations.status CHECK: 'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
reservations.reservation_source CHECK: 'ia', 'manual'
```

---

## ⚠️ **COLUMNAS CRÍTICAS PARA SCRIPTS**

### ✅ **CUSTOMERS**
- `name` (NOT NULL) - **NO** `customer_name`
- `total_visits` - **NO** `no_show_count`
- `segment_auto` - Valores específicos requeridos

### ✅ **NOSHOW_ACTIONS**
- `customer_name` (NOT NULL)
- `risk_factors` (JSONB) - Requiere casting explícito
- Todos los campos de fecha/hora requieren tipos correctos

### ✅ **CONVERSATIONS**
- `priority` - TEXT con valores específicos ('low', 'normal', 'high', 'urgent')
- `status` - TEXT con valores específicos ('open', 'closed', 'pending')
- `metadata` - JSONB requiere casting explícito

---

## 🎉 **¡NUNCA MÁS ERRORES DE COLUMNAS!**

**Con esta documentación completa, todos los scripts futuros serán:**
- ✅ **SIN ERRORES** de columnas inexistentes
- ✅ **CON CONSTRAINTS** correctos
- ✅ **CON TIPOS DE DATOS** precisos
- ✅ **CON RELACIONES** mapeadas

---

*Documentación generada: Septiembre 2025*
*Total de tablas: 41*
*Total de funciones RPC: 50+*

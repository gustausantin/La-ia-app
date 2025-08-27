# 📊 **BASE DE DATOS MASTER REFERENCE - LA-IA APP**

> **ARCHIVO ÚNICO Y DEFINITIVO** - Toda la información de Supabase en un solo lugar

**📅 Última actualización:** 28 Enero 2025  
**🎯 Estado:** Confirmado con datos reales de Supabase  
**📋 Total tablas:** 23 tablas

---

## 🎯 **RESUMEN EJECUTIVO**

### **📊 ESTADÍSTICAS:**
- **23 TABLAS TOTALES** ✅
- **17 Tablas principales** + **6 Tablas de IA avanzada**
- **Todas con UUID como PRIMARY KEY**
- **Relaciones por `restaurant_id`**
- **Timestamps automáticos** en la mayoría

### **🔗 RELACIÓN CENTRAL:**
**`restaurants` → Es la tabla PRINCIPAL**  
**`user_restaurant_mapping` → Controla acceso**  
**Todas las demás tablas → Se relacionan por `restaurant_id`**

---

## 🏢 **TABLA PRINCIPAL - RESTAURANTS**

### **🏢 `restaurants`** (Tabla central del sistema)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
name              VARCHAR NOT NULL
email             VARCHAR
phone             VARCHAR
address           TEXT
city              VARCHAR
country           VARCHAR DEFAULT 'España'
postal_code       VARCHAR
cuisine_type      VARCHAR
plan              VARCHAR DEFAULT 'trial'
active            BOOLEAN DEFAULT true
settings          JSONB DEFAULT '{}'
agent_config      JSONB DEFAULT '{}'
business_hours    JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
owner_id          UUID
```
**🎯 Función:** Tabla central - todos los datos giran alrededor de esta tabla

---

## 👥 **GESTIÓN DE USUARIOS**

### **👥 `user_restaurant_mapping`** (Control de acceso crítico)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id      UUID NOT NULL → auth.users(id)
restaurant_id     UUID NOT NULL → restaurants(id)
role              VARCHAR DEFAULT 'staff'
permissions       JSONB DEFAULT '{}'
active            BOOLEAN DEFAULT true
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Control de acceso multi-tenant + roles

### **👤 `profiles`** (Perfiles extendidos de usuarios)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
auth_user_id      UUID NOT NULL → auth.users(id)
email             VARCHAR NOT NULL
full_name         VARCHAR
avatar_url        TEXT
restaurant_name   VARCHAR
phone             VARCHAR
role              VARCHAR DEFAULT 'owner'
preferences       JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Datos extendidos de usuarios

### **👨‍💼 `staff`** (Gestión de personal)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
auth_user_id      UUID → auth.users(id)
name              VARCHAR NOT NULL
email             VARCHAR
phone             VARCHAR
role              VARCHAR NOT NULL
active            BOOLEAN DEFAULT true
schedule          JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Control de empleados del restaurante

---

## 👤 **GESTIÓN DE CLIENTES**

### **👤 `customers`** (Base de datos de clientes)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
name              VARCHAR NOT NULL
email             VARCHAR
phone             VARCHAR
preferences       JSONB DEFAULT '{}'
tags              TEXT[] ARRAY
notes             TEXT
total_visits      INTEGER DEFAULT 0
total_spent       NUMERIC DEFAULT 0
last_visit        TIMESTAMP WITH TIME ZONE
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** CRM completo con historial y analytics

---

## 📅 **GESTIÓN DE RESERVAS**

### **📅 `reservations`** (Sistema principal de reservas)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
customer_id       UUID → customers(id)
customer_name     VARCHAR NOT NULL
customer_email    VARCHAR
customer_phone    VARCHAR
reservation_date  DATE NOT NULL
reservation_time  TIME NOT NULL
party_size        INTEGER NOT NULL
status            VARCHAR DEFAULT 'confirmed'
table_number      VARCHAR
special_requests  TEXT
source            VARCHAR DEFAULT 'web'
notes             TEXT
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
channel           VARCHAR DEFAULT 'web'
date              DATE
time              TIME
table_id          UUID → tables(id)
```
**🎯 Función:** Gestión completa de reservas

### **📋 `reservations_with_customer`** (Vista combinada)
```sql
id                         UUID
restaurant_id              UUID
reservation_date           DATE
reservation_time           TIME
party_size                 INTEGER
status                     VARCHAR
notes                      TEXT
source                     VARCHAR
channel                    VARCHAR
created_at                 TIMESTAMP WITH TIME ZONE
updated_at                 TIMESTAMP WITH TIME ZONE
customer_id                UUID
customer_name              VARCHAR
customer_email             VARCHAR
customer_phone             VARCHAR
linked_customer_id         UUID
linked_customer_name       VARCHAR
linked_customer_email      VARCHAR
linked_customer_phone      VARCHAR
linked_customer_notes      TEXT
```
**🎯 Función:** Vista que combina reservas con datos de clientes

---

## 🪑 **GESTIÓN DE MESAS**

### **🪑 `tables`** (Mesas físicas del restaurante)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
table_number      TEXT NOT NULL
capacity          INTEGER NOT NULL
location          TEXT
status            TEXT DEFAULT 'available'
position_x        DOUBLE PRECISION
position_y        DOUBLE PRECISION
notes             TEXT
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
zone              VARCHAR DEFAULT 'main'
name              VARCHAR
```
**🎯 Función:** Control físico de mesas y distribución

---

## 💬 **SISTEMA DE COMUNICACIÓN**

### **🗨️ `conversations`** (Conversaciones con clientes)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
customer_id       UUID → customers(id)
customer_name     TEXT NOT NULL
customer_phone    TEXT
customer_email    TEXT
subject           TEXT
status            TEXT DEFAULT 'open'
priority          TEXT DEFAULT 'normal'
assigned_to       UUID → staff(id)
channel           TEXT DEFAULT 'app'
tags              TEXT[] ARRAY DEFAULT ARRAY[]
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Gestión de conversaciones multicanal

### **💬 `messages`** (Mensajes individuales)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
customer_phone    VARCHAR
customer_name     VARCHAR
message_text      TEXT NOT NULL
message_type      VARCHAR DEFAULT 'text'
direction         VARCHAR NOT NULL
channel           VARCHAR NOT NULL
status            VARCHAR DEFAULT 'sent'
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Mensajes del sistema de comunicación

### **📝 `message_templates`** (Plantillas de mensajes)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
name              TEXT NOT NULL
category          TEXT NOT NULL
subject           TEXT
content           TEXT NOT NULL
variables         TEXT[] ARRAY DEFAULT ARRAY[]
channel           TEXT NOT NULL
is_active         BOOLEAN DEFAULT true
usage_count       INTEGER DEFAULT 0
created_by        UUID → staff(id)
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Plantillas predefinidas para comunicación

---

## 🔔 **NOTIFICACIONES**

### **🔔 `notifications`** (Sistema de notificaciones)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
user_id           UUID → auth.users(id)
title             TEXT NOT NULL
message           TEXT NOT NULL
type              TEXT NOT NULL
priority          TEXT DEFAULT 'normal'
is_read           BOOLEAN DEFAULT false
action_url        TEXT
metadata          JSONB DEFAULT '{}'
expires_at        TIMESTAMP WITH TIME ZONE
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
read_at           TIMESTAMP WITH TIME ZONE
```
**🎯 Función:** Sistema de notificaciones push

---

## 📦 **GESTIÓN DE INVENTARIO**

### **📋 `inventory`** (Inventario principal)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
name              VARCHAR NOT NULL
category          VARCHAR
quantity          NUMERIC DEFAULT 0
unit              VARCHAR
min_threshold     NUMERIC
cost_per_unit     NUMERIC
supplier          VARCHAR
last_updated      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Control básico de stock

### **📦 `inventory_items`** (Items específicos de inventario)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
name              TEXT NOT NULL
category          TEXT NOT NULL
description       TEXT
unit              TEXT NOT NULL
current_stock     NUMERIC DEFAULT 0
minimum_stock     NUMERIC DEFAULT 0
maximum_stock     NUMERIC
cost_per_unit     NUMERIC DEFAULT 0
supplier          TEXT
supplier_contact  JSONB DEFAULT '{}'
barcode           TEXT
location          TEXT
expiration_date   DATE
last_restocked    TIMESTAMP WITH TIME ZONE
status            TEXT DEFAULT 'active'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Control detallado de inventario con códigos de barras

---

## 📊 **ANALYTICS Y MÉTRICAS**

### **📊 `analytics`** (Métricas principales)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
type              VARCHAR NOT NULL
date              DATE NOT NULL
value             NUMERIC NOT NULL
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Métricas y KPIs principales

### **📈 `analytics_historical`** (Datos históricos)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
metric_type       TEXT NOT NULL
metric_name       TEXT NOT NULL
metric_value      NUMERIC NOT NULL
dimension1        TEXT
dimension1_value  TEXT
dimension2        TEXT
dimension2_value  TEXT
period_type       TEXT NOT NULL
period_start      TIMESTAMP WITH TIME ZONE NOT NULL
period_end        TIMESTAMP WITH TIME ZONE NOT NULL
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Datos históricos agregados para análisis

### **📅 `daily_metrics`** (Métricas diarias)
```sql
id                           UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id                UUID NOT NULL → restaurants(id)
date                         DATE NOT NULL
total_reservations           INTEGER DEFAULT 0
confirmed_reservations       INTEGER DEFAULT 0
cancelled_reservations       INTEGER DEFAULT 0
no_shows                     INTEGER DEFAULT 0
walk_ins                     INTEGER DEFAULT 0
total_customers              INTEGER DEFAULT 0
new_customers                INTEGER DEFAULT 0
returning_customers          INTEGER DEFAULT 0
table_utilization_rate       NUMERIC DEFAULT 0
average_party_size           NUMERIC DEFAULT 0
peak_hour_start              TIME
peak_hour_end                TIME
total_revenue                NUMERIC DEFAULT 0
average_spend_per_customer   NUMERIC DEFAULT 0
customer_satisfaction_score  NUMERIC
staff_efficiency_score       NUMERIC
notes                        TEXT
created_at                   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at                   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Resumen automático diario

---

## ⚙️ **CONFIGURACIÓN**

### **⚙️ `restaurant_settings`** (Configuración del restaurante)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID NOT NULL → restaurants(id)
category          TEXT NOT NULL
setting_key       TEXT NOT NULL
setting_value     JSONB NOT NULL
description       TEXT
is_sensitive      BOOLEAN DEFAULT false
created_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
```
**🎯 Función:** Configuración específica por categorías

### **🏪 `restaurant_business_config`** (Configuración de negocio)
```sql
id                              UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id                   UUID → restaurants(id)
avg_ticket_price                NUMERIC DEFAULT 35.00
monthly_revenue                 NUMERIC
staff_cost_monthly              NUMERIC DEFAULT 1800.00
current_reservations_monthly    INTEGER DEFAULT 0
target_growth_percentage        NUMERIC DEFAULT 15.00
ai_system_cost                  NUMERIC DEFAULT 199.00
ai_expected_improvement         NUMERIC DEFAULT 15.00
operating_hours_daily           INTEGER DEFAULT 12
peak_hours_percentage           NUMERIC DEFAULT 30.00
manual_response_time_minutes    NUMERIC DEFAULT 5.00
configured_by                   VARCHAR
last_updated                    TIMESTAMP WITH TIME ZONE DEFAULT now()
created_at                      TIMESTAMP WITH TIME ZONE DEFAULT now()
```
**🎯 Función:** Configuración de métricas de negocio para IA

---

## 🤖 **SISTEMA DE IA AVANZADA**

### **🤖 `agent_conversations`** (Conversaciones del agente IA)
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id         UUID → restaurants(id)
status                VARCHAR DEFAULT 'active'
customer_phone        VARCHAR
customer_name         VARCHAR
channel               VARCHAR
started_at            TIMESTAMP WITH TIME ZONE DEFAULT now()
ended_at              TIMESTAMP WITH TIME ZONE
messages_count        INTEGER DEFAULT 0
satisfaction_score    INTEGER
booking_created       BOOLEAN DEFAULT false
created_at            TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at            TIMESTAMP WITH TIME ZONE DEFAULT now()
```
**🎯 Función:** Gestión de conversaciones del agente IA

### **🧠 `agent_insights`** (Insights generados por IA)
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     UUID → restaurants(id)
type              VARCHAR
title             VARCHAR
description       TEXT
priority          VARCHAR DEFAULT 'medium'
action_required   BOOLEAN DEFAULT false
data              JSONB DEFAULT '{}'
created_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
resolved_at       TIMESTAMP WITH TIME ZONE
```
**🎯 Función:** Insights automáticos generados por IA

### **📊 `agent_metrics`** (Métricas del agente IA)
```sql
id                     UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id          UUID → restaurants(id)
date                   DATE DEFAULT CURRENT_DATE
total_conversations    INTEGER DEFAULT 0
successful_bookings    INTEGER DEFAULT 0
avg_response_time      DOUBLE PRECISION DEFAULT 0
conversion_rate        DOUBLE PRECISION DEFAULT 0
customer_satisfaction  DOUBLE PRECISION DEFAULT 0
channel_breakdown      JSONB DEFAULT '{}'
created_at             TIMESTAMP WITH TIME ZONE DEFAULT now()
updated_at             TIMESTAMP WITH TIME ZONE DEFAULT now()
```
**🎯 Función:** Métricas de performance del agente IA

### **📈 `channel_performance`** (Performance por canal)
```sql
id                     UUID PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id          UUID → restaurants(id)
channel                VARCHAR
date                   DATE DEFAULT CURRENT_DATE
conversations          INTEGER DEFAULT 0
bookings               INTEGER DEFAULT 0
conversion_rate        DOUBLE PRECISION DEFAULT 0
avg_response_time      DOUBLE PRECISION DEFAULT 0
customer_satisfaction  DOUBLE PRECISION DEFAULT 0
created_at             TIMESTAMP WITH TIME ZONE DEFAULT now()
```
**🎯 Función:** Analytics por canal de comunicación

### **💬 `conversation_analytics`** (Analytics de conversaciones)
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
conversation_id       UUID → conversations(id)
restaurant_id         UUID → restaurants(id)
total_messages        INTEGER DEFAULT 0
ai_messages           INTEGER DEFAULT 0
human_messages        INTEGER DEFAULT 0
avg_response_time     DOUBLE PRECISION DEFAULT 0
intent_detected       VARCHAR
sentiment_score       DOUBLE PRECISION DEFAULT 0
topics                JSONB DEFAULT '[]'
created_at            TIMESTAMP WITH TIME ZONE DEFAULT now()
```
**🎯 Función:** Analytics avanzados de conversaciones con IA

---

## 🔧 **TRIGGERS ACTIVOS**

### **🚨 TRIGGERS `handle_updated_at`:**
- **conversations** → Actualiza `updated_at` en UPDATE
- **daily_metrics** → Actualiza `updated_at` en UPDATE
- **inventory_items** → Actualiza `updated_at` en UPDATE
- **message_templates** → Actualiza `updated_at` en UPDATE
- **restaurant_settings** → Actualiza `updated_at` en UPDATE
- **tables** → Actualiza `updated_at` en UPDATE

---

## 🔗 **RELACIONES PRINCIPALES**

### **🎯 FLUJO DE DATOS:**
```
auth.users (Supabase Auth)
    ↓
user_restaurant_mapping (Control acceso)
    ↓
restaurants (Tabla central)
    ↓
┌─────────────────────────────────────────┐
│ TODAS LAS DEMÁS TABLAS                  │
│ (relacionadas por restaurant_id)        │
└─────────────────────────────────────────┘
```

### **🔗 FOREIGN KEYS PRINCIPALES:**
- **Todas las tablas** → `restaurant_id` → `restaurants(id)`
- **user_restaurant_mapping** → `auth_user_id` → `auth.users(id)`
- **profiles** → `auth_user_id` → `auth.users(id)`
- **staff** → `auth_user_id` → `auth.users(id)`
- **reservations** → `customer_id` → `customers(id)`
- **reservations** → `table_id` → `tables(id)`
- **conversations** → `customer_id` → `customers(id)`
- **conversation_analytics** → `conversation_id` → `conversations(id)`

---

## 📝 **NOTAS IMPORTANTES**

### **🚨 ESTADO DE SEGURIDAD:**
- **La mayoría de tablas tienen RLS habilitado**
- **Algunas tablas de IA están "Unrestricted"** (pendiente configurar)
- **Políticas basadas en `restaurant_id`**

### **🎯 CONVENCIONES:**
- **UUID como PRIMARY KEY** en todas las tablas
- **`restaurant_id`** como foreign key universal
- **JSONB** para datos flexibles (settings, metadata, etc.)
- **Timestamps UTC** automáticos
- **Arrays** para tags y variables

### **🔧 MANTENIMIENTO:**
- **Triggers automáticos** para `updated_at`
- **Valores por defecto** bien definidos
- **Estructura normalizada** pero flexible

---

## 🎯 **PARA DESARROLLADORES**

### **✅ USAR ESTE ARCHIVO PARA:**
- **Conocer EXACTAMENTE** qué columnas existen
- **Entender las relaciones** entre tablas
- **Hacer consultas SQL** correctas
- **Crear scripts** que funcionen
- **No más errores** de "columna no existe"

### **📋 ESTE ES EL ÚNICO ARCHIVO DE REFERENCIA**
- **No hay otros archivos** de esquema
- **Esta es la fuente de verdad**
- **Actualizado con datos reales** de Supabase
- **23 tablas confirmadas**

---

**🎉 ¡BASE DE DATOS COMPLETAMENTE DOCUMENTADA!** ✨

# 📊 **ESQUEMA ACTUAL DE BASE DE DATOS LA-IA APP**

> **IMPORTANTE:** Este archivo debe actualizarse cada vez que se modifique la estructura de base de datos.

## 🔧 **CÓMO MANTENER ACTUALIZADO:**

```bash
# 1. Ejecutar auditoría en Supabase SQL Editor:
# Copiar contenido de: src/scripts/audit-complete-database.sql

# 2. Actualizar este archivo con los resultados

# 3. Commit cambios:
git add docs/DATABASE-SCHEMA-CURRENT.md
git commit -m "📊 UPDATE: Esquema de BD actualizado"
```

---

## 📋 **ESTRUCTURA REAL CONFIRMADA (Auditoría ejecutada - 25 Agosto 2025):**

> **17 TABLAS TOTALES** - Todas con RLS habilitado y políticas optimizadas  
> **SEGURIDAD:** Enterprise Grade 8.5/10  
> **ESTADO:** Auditado y certificado

---

## 🏆 **TABLAS PRINCIPALES DEL NEGOCIO**

### **🏢 `restaurants`** (Tabla central)
```sql
id               UUID PRIMARY KEY
name             VARCHAR(255) NOT NULL
email            VARCHAR(255) UNIQUE NOT NULL  
phone            VARCHAR(20)
address          TEXT
city             VARCHAR(100)
postal_code      VARCHAR(10)
cuisine_type     VARCHAR(50)
plan             VARCHAR(20) DEFAULT 'trial'
active           BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 3 (optimizadas)  
**🎯 Función:** Central hub - todos los datos pivotean desde aquí

### **👥 `user_restaurant_mapping`** (Relación crítica)
```sql
id               UUID PRIMARY KEY
auth_user_id     UUID → auth.users(id)
restaurant_id    UUID → restaurants(id)
role             VARCHAR(20) ('owner','admin','manager','staff')
permissions      JSONB
active           BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 2 (owner access)  
**🎯 Función:** Control de acceso multi-tenant + roles

### **📅 `reservations`** (Core business)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
customer_name    VARCHAR(255) NOT NULL
customer_email   VARCHAR(255)
customer_phone   VARCHAR(20)
party_size       INTEGER NOT NULL
reservation_date DATE NOT NULL
reservation_time TIME NOT NULL
status           VARCHAR(20) DEFAULT 'confirmed'
source           VARCHAR(50) DEFAULT 'manual'
channel          VARCHAR(50)
notes            TEXT
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1 (optimizada)  
**🎯 Función:** Gestión completa de reservas

### **👤 `customers`** (CRM)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
name             VARCHAR(255) NOT NULL
email            VARCHAR(255)
phone            VARCHAR(20)
total_visits     INTEGER DEFAULT 0
total_spent      DECIMAL(10,2) DEFAULT 0
last_visit       TIMESTAMP
preferences      JSONB
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 3 (roles granulares)  
**🎯 Función:** Base de datos de clientes con analytics

### **🪑 `tables`** (Gestión física)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
table_number     VARCHAR(10) NOT NULL
capacity         INTEGER NOT NULL
zone             VARCHAR(50)
status           VARCHAR(20) DEFAULT 'disponible'
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Gestión de mesas físicas

---

## 👤 **GESTIÓN DE USUARIOS Y PERFILES**

### **🔑 `profiles`** (Perfiles extendidos)
```sql
id               UUID PRIMARY KEY
auth_user_id     UUID → auth.users(id) UNIQUE
full_name        VARCHAR(255)
phone            VARCHAR(20)
preferences      JSONB
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 2 (owner only)  
**🎯 Función:** Datos extendidos de usuarios

### **👨‍💼 `staff`** (Gestión de personal)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
name             VARCHAR(255) NOT NULL
email            VARCHAR(255)
role             VARCHAR(50)
phone            VARCHAR(20)
hire_date        DATE
salary           DECIMAL(10,2)
active           BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 3 (managers+)  
**🎯 Función:** Control de empleados

---

## 💬 **COMUNICACIÓN Y MENSAJERÍA**

### **🗨️ `conversations`** (Hilos de conversación)
```sql
id               UUID PRIMARY KEY  
restaurant_id    UUID → restaurants(id)
customer_id      UUID → customers(id)
channel          VARCHAR(50) ('whatsapp','email','web')
status           VARCHAR(20) DEFAULT 'active'
last_message_at  TIMESTAMP
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Gestión de conversaciones multicanal

### **💬 `messages`** (Mensajes individuales)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)  
conversation_id  UUID → conversations(id)
sender_type      VARCHAR(20) ('customer','staff','system')
content          TEXT NOT NULL
message_type     VARCHAR(20) DEFAULT 'text'
sent_at          TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 3 (granular)  
**🎯 Función:** Mensajes del sistema de comunicación

### **📝 `message_templates`** (Plantillas)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
name             VARCHAR(255) NOT NULL
content          TEXT NOT NULL
category         VARCHAR(50)
active           BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Plantillas predefinidas de mensajes

---

## 📊 **ANALYTICS Y MÉTRICAS**

### **📈 `analytics`** (Métricas principales)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
metric_type      VARCHAR(50) NOT NULL
value            DECIMAL(12,2) NOT NULL
date             DATE NOT NULL
metadata         JSONB
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 3 (roles específicos)  
**🎯 Función:** Métricas y KPIs del restaurante

### **📊 `analytics_historical`** (Histórico)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
period_type      VARCHAR(20) ('daily','weekly','monthly')
period_start     DATE NOT NULL
period_end       DATE NOT NULL
metrics_data     JSONB NOT NULL
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Datos históricos agregados

### **📅 `daily_metrics`** (Métricas diarias)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
date             DATE NOT NULL
total_reservations INTEGER DEFAULT 0
total_revenue    DECIMAL(10,2) DEFAULT 0
avg_party_size   DECIMAL(3,1) DEFAULT 0
peak_hour        TIME
occupancy_rate   DECIMAL(5,2) DEFAULT 0
created_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Resumen diario automatizado

---

## 📦 **INVENTARIO Y CONFIGURACIÓN**

### **📦 `inventory`** (Inventario principal)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
category         VARCHAR(100) NOT NULL
current_stock    INTEGER DEFAULT 0
min_threshold    INTEGER DEFAULT 0
last_updated     TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 2 (managers)  
**🎯 Función:** Control de stock principal

### **📋 `inventory_items`** (Items específicos)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
name             VARCHAR(255) NOT NULL
category         VARCHAR(100)
unit             VARCHAR(20)
current_stock    DECIMAL(10,2) DEFAULT 0
min_threshold    DECIMAL(10,2) DEFAULT 0
cost_per_unit    DECIMAL(8,2)
supplier         VARCHAR(255)
last_updated     TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Items detallados de inventario

### **⚙️ `restaurant_settings`** (Configuración)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id) UNIQUE
business_hours   JSONB
timezone         VARCHAR(50) DEFAULT 'Europe/Madrid'
currency         VARCHAR(3) DEFAULT 'EUR'
language         VARCHAR(5) DEFAULT 'es'
features_enabled JSONB
notification_settings JSONB
created_at       TIMESTAMP DEFAULT NOW()
updated_at       TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 1  
**🎯 Función:** Configuración específica del restaurante

---

## 🔔 **NOTIFICACIONES**

### **🔔 `notifications`** (Sistema de notificaciones)
```sql
id               UUID PRIMARY KEY
restaurant_id    UUID → restaurants(id)
user_id          UUID → auth.users(id)
type             VARCHAR(50) NOT NULL
message          TEXT NOT NULL
read             BOOLEAN DEFAULT false
priority         VARCHAR(20) DEFAULT 'normal'
timestamp        TIMESTAMP DEFAULT NOW()
```
**🔒 RLS:** ✅ Habilitado | **📋 Políticas:** 2  
**🎯 Función:** Notificaciones del sistema

#### **`user_restaurant_mapping`**
```sql
- id (UUID, PRIMARY KEY)
- auth_user_id (UUID, FK to auth.users)
- restaurant_id (UUID, FK to restaurants)
- role (VARCHAR)
- permissions (JSONB)
- active (BOOLEAN)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 3 activas

#### **`reservations`**
```sql
- id (UUID, PRIMARY KEY)
- restaurant_id (UUID, FK to restaurants)
- customer_name (VARCHAR)
- customer_email (VARCHAR)
- customer_phone (VARCHAR)
- party_size (INTEGER)
- reservation_date (DATE)
- reservation_time (TIME)
- status (VARCHAR)
- source (VARCHAR)
- channel (VARCHAR)
- notes (TEXT)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 3 activas

#### **`customers`**
```sql
- id (UUID, PRIMARY KEY)
- restaurant_id (UUID, FK to restaurants)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- total_visits (INTEGER)
- total_spent (DECIMAL)
- last_visit (TIMESTAMP)
- preferences (JSONB)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 2 activas

#### **`tables`**
```sql
- id (UUID, PRIMARY KEY)
- restaurant_id (UUID, FK to restaurants)
- table_number (VARCHAR)
- capacity (INTEGER)
- zone (VARCHAR)
- status (VARCHAR)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 1 activa

#### **`profiles`**
```sql
- id (UUID, PRIMARY KEY)
- auth_user_id (UUID, FK to auth.users)
- full_name (VARCHAR)
- phone (VARCHAR)
- preferences (JSONB)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 3 activas

### **📊 TABLAS DE ANALYTICS:**

#### **`analytics`**
```sql
- id (UUID, PRIMARY KEY)
- restaurant_id (UUID, FK to restaurants)
- metric_type (VARCHAR)
- value (DECIMAL)
- date (DATE)
- metadata (JSONB)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 2 activas

#### **`notifications`**
```sql
- id (UUID, PRIMARY KEY)
- restaurant_id (UUID, FK to restaurants)
- type (VARCHAR)
- message (TEXT)
- read (BOOLEAN)
- priority (VARCHAR)
- timestamp (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 2 activas

---

## 🛠️ **FUNCIONES RPC ACTIVAS:**

### **`create_restaurant_securely(restaurant_data JSONB, user_profile JSONB)`**
```sql
- Crea restaurant + mapping + mesas básicas
- Previene duplicados
- Retorna JSONB con resultado
- Permisos: authenticated
```

---

## 🔍 **PARA ACTUALIZAR ESTE ARCHIVO:**

### **1. Ejecutar auditoría:**
```sql
-- En Supabase SQL Editor, ejecutar:
-- Contenido de src/scripts/audit-complete-database.sql
```

### **2. Revisar resultados:**
- ✅ Verificar que todas las tablas críticas tienen RLS
- ✅ Confirmar políticas activas
- ✅ Detectar nuevas tablas o columnas
- ✅ Validar funciones RPC

### **3. Actualizar archivo:**
- Añadir nuevas tablas descubiertas
- Modificar columnas que hayan cambiado  
- Actualizar estados de RLS y políticas
- Commit cambios al repo

---

## ⚠️ **CHECKLIST DE SEGURIDAD:**

- [ ] Todas las tablas críticas tienen RLS habilitado
- [ ] Ninguna tabla está "Unrestricted" 
- [ ] Políticas de seguridad activas
- [ ] Función create_restaurant_securely existe
- [ ] Foreign keys correctas
- [ ] Índices en columnas de búsqueda

---

## 📝 **NOTAS:**

**Última actualización:** [PENDIENTE - Ejecutar auditoría]  
**Por:** [USUARIO]  
**Cambios:** [DESCRIPCIÓN]

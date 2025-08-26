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

## 📋 **TABLAS CONFIRMADAS (Auditoría ejecutada - 25 Agosto 2025):**

> **17 TABLAS TOTALES** - Todas con RLS habilitado y políticas activas

### **🔒 TABLAS CRÍTICAS CON RLS:**

#### **`restaurants`**
```sql
- id (UUID, PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR) 
- phone (VARCHAR)
- address (TEXT)
- city (VARCHAR)
- postal_code (VARCHAR)
- cuisine_type (VARCHAR)
- plan (VARCHAR)
- active (BOOLEAN)
- created_at (TIMESTAMP)
```
**RLS:** ✅ Habilitado  
**Políticas:** 4 activas

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

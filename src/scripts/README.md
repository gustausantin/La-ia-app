# 📁 **SCRIPTS DE BASE DE DATOS - LA-IA APP**

> **Directorio organizado con scripts esenciales para gestión de base de datos**

## 🎯 **SCRIPTS ACTIVOS Y SU PROPÓSITO**

### **🔍 AUDITORÍA Y DIAGNÓSTICO:**

#### **`audit-complete-database.sql`**
- **Propósito:** Auditoría completa de estructura, seguridad y políticas
- **Cuándo usar:** Verificación periódica del estado de la BD
- **Output:** 8 reportes detallados (RLS, estructura, funciones, etc.)

```sql
-- Ejecutar en Supabase SQL Editor
-- Genera reporte completo del estado actual
```

### **🔒 SEGURIDAD Y RLS:**

#### **`enable-rls-security.sql`**
- **Propósito:** Habilitar RLS y crear políticas básicas de seguridad
- **Cuándo usar:** Setup inicial de seguridad o restauración
- **Resultado:** Todas las tablas críticas protegidas con RLS

#### **`fix-missing-policies.sql`** 
- **Propósito:** Crear políticas para tablas que no las tienen
- **Cuándo usar:** Cuando auditoría detecte tablas sin políticas
- **Resultado:** Zero tablas sin protección

#### **`cleanup-duplicate-policies.sql`**
- **Propósito:** Optimizar políticas eliminando duplicados
- **Cuándo usar:** Upgrade a enterprise grade (8.5/10)
- **Resultado:** Políticas optimizadas y granulares por roles

### **⚙️ FUNCIONES Y PROCEDIMIENTOS:**

#### **`create-restaurant-securely-function.sql`** 
- **Propósito:** Crear función RPC para migración automática de usuarios
- **Cuándo usar:** Setup inicial o si función no existe
- **Resultado:** Función `create_restaurant_securely()` disponible

## 🔄 **FLUJO DE SETUP COMPLETO (Nuevo Proyecto)**

### **1. SETUP INICIAL:**
```sql
-- Paso 1: Crear función de migración automática
-- Ejecutar: create-restaurant-securely-function.sql

-- Paso 2: Habilitar seguridad básica
-- Ejecutar: enable-rls-security.sql
```

### **2. VERIFICACIÓN:**
```sql
-- Paso 3: Auditar estado completo
-- Ejecutar: audit-complete-database.sql
```

### **3. OPTIMIZACIÓN (Si es necesario):**
```sql
-- Paso 4: Arreglar políticas faltantes (si las hay)
-- Ejecutar: fix-missing-policies.sql

-- Paso 5: Optimizar a enterprise grade
-- Ejecutar: cleanup-duplicate-policies.sql
```

## 🏆 **ESTADO ACTUAL (Agosto 2025)**

```bash
✅ RLS: Habilitado en 17 tablas
✅ POLÍTICAS: 27 políticas optimizadas  
✅ FUNCIONES: create_restaurant_securely activa
✅ SEGURIDAD: Enterprise Grade 8.5/10
✅ AUDITORÍA: Completada y documentada
```

## ⚠️ **IMPORTANTE - NO ELIMINAR:**

**Todos los scripts en este directorio están activos y son necesarios:**

- ✅ **audit-complete-database.sql** → Auditoría periódica
- ✅ **enable-rls-security.sql** → Setup seguridad inicial  
- ✅ **fix-missing-policies.sql** → Reparación políticas
- ✅ **cleanup-duplicate-policies.sql** → Optimización enterprise
- ✅ **create-restaurant-securely-function.sql** → Función crítica

## 📋 **MANTENIMIENTO PERIÓDICO**

### **MENSUAL:**
```sql
-- Ejecutar auditoría completa
-- src/scripts/audit-complete-database.sql
```

### **CUANDO AÑADIR NUEVAS TABLAS:**
```sql
-- 1. Crear tabla con RLS habilitado
-- 2. Ejecutar fix-missing-policies.sql
-- 3. Auditar con audit-complete-database.sql
```

### **SI HAY PROBLEMAS DE SEGURIDAD:**
```sql
-- 1. Auditoría: audit-complete-database.sql
-- 2. Fix: enable-rls-security.sql
-- 3. Optimización: cleanup-duplicate-policies.sql
-- 4. Verificación: audit-complete-database.sql
```

---

**Última actualización:** 25 Agosto 2025  
**Estado:** Todos los scripts validados y en uso  
**Nivel de seguridad:** Enterprise Grade 8.5/10

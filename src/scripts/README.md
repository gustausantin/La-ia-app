# 📁 **SCRIPTS DE BASE DE DATOS - LA-IA APP**

> **Directorio limpio con scripts esenciales para gestión de base de datos**

## 🎯 **SCRIPTS ACTIVOS Y SU PROPÓSITO**

### **📊 DATOS Y DEMO:**

#### **`create-perfect-demo-data.sql`**
- **Propósito:** Crear datos de demostración realistas para todas las tablas
- **Cuándo usar:** Setup inicial o reset de datos de prueba
- **Resultado:** Base de datos poblada con datos consistentes

#### **`create-real-noshow-data.sql`**
- **Propósito:** Crear datos específicos para el sistema de no-shows
- **Cuándo usar:** Testing del sistema de prevención de no-shows
- **Resultado:** Reservas con diferentes niveles de riesgo y acciones

#### **`create-conversations-demo-data.sql`**
- **Propósito:** Crear conversaciones y mensajes de ejemplo
- **Cuándo usar:** Testing del sistema de comunicaciones
- **Resultado:** Conversaciones realistas con diferentes estados

### **🔍 AUDITORÍA Y DIAGNÓSTICO:**

#### **`audit-complete-database.sql`**
- **Propósito:** Auditoría completa de estructura, seguridad y políticas
- **Cuándo usar:** Verificación periódica del estado de la BD
- **Output:** 8 reportes detallados (RLS, estructura, funciones, etc.)

#### **`verify-noshow-setup.sql`**
- **Propósito:** Verificar que el sistema de no-shows esté correctamente configurado
- **Cuándo usar:** Después de cambios en tablas relacionadas con no-shows
- **Resultado:** Confirmación de estructura y datos

### **🔧 CONFIGURACIÓN Y SETUP:**

#### **`create-analytics-tables.sql`**
- **Propósito:** Crear tablas para analytics y métricas avanzadas
- **Cuándo usar:** Setup inicial o añadir capacidades de analytics
- **Resultado:** Tablas optimizadas para reportes

#### **`create-crm-tables.sql`**
- **Propósito:** Crear tablas específicas del sistema CRM
- **Cuándo usar:** Setup inicial del CRM o migración
- **Resultado:** Sistema CRM completo con plantillas y configuración

#### **`create-restaurant-business-config.sql`**
- **Propósito:** Crear configuración de negocio por restaurante
- **Cuándo usar:** Setup inicial o configuración de ROI
- **Resultado:** Métricas de negocio configuradas

#### **`create-noshow-templates.sql`**
- **Propósito:** Crear plantillas específicas para prevención de no-shows
- **Cuándo usar:** Setup del sistema de no-shows
- **Resultado:** Plantillas listas para WhatsApp, email, etc.

### **🔒 SEGURIDAD Y RLS:**

#### **`enable-rls-security.sql`**
- **Propósito:** Habilitar RLS y crear políticas básicas de seguridad
- **Cuándo usar:** Setup inicial de seguridad o restauración
- **Resultado:** Todas las tablas críticas protegidas con RLS

#### **`enterprise-auth-trigger.sql`**
- **Propósito:** Crear trigger enterprise para autenticación automática
- **Cuándo usar:** Setup inicial o upgrade de seguridad
- **Resultado:** Usuarios automáticamente asignados a restaurantes

### **⚙️ FUNCIONES Y PROCEDIMIENTOS:**

#### **`create-restaurant-securely-function.sql`**
- **Propósito:** Crear función RPC para migración automática de usuarios
- **Cuándo usar:** Setup inicial o si función no existe
- **Resultado:** Función `create_restaurant_securely()` disponible

#### **`create-noshow-analytics-function.sql`**
- **Propósito:** Crear función para métricas avanzadas de no-shows
- **Cuándo usar:** Setup de analytics de no-shows
- **Resultado:** Función `get_restaurant_noshow_metrics()` disponible

#### **`fix-availability-generator.sql`**
- **Propósito:** Reparar/crear función generadora de disponibilidad
- **Cuándo usar:** Si el generador de disponibilidad falla
- **Resultado:** Función `generate_availability_slots()` funcional

#### **`noshow-metrics-queries.sql`**
- **Propósito:** Queries optimizadas para métricas de no-shows
- **Cuándo usar:** Análisis de rendimiento del sistema
- **Resultado:** Queries listas para dashboards

## 🔄 **FLUJO DE SETUP COMPLETO (Nuevo Proyecto)**

### **1. SETUP INICIAL:**
```sql
-- Paso 1: Crear función de migración automática
-- Ejecutar: create-restaurant-securely-function.sql

-- Paso 2: Habilitar seguridad básica
-- Ejecutar: enable-rls-security.sql

-- Paso 3: Setup CRM y analytics
-- Ejecutar: create-crm-tables.sql
-- Ejecutar: create-analytics-tables.sql
```

### **2. CONFIGURACIÓN DE FUNCIONALIDADES:**
```sql
-- Paso 4: Sistema de no-shows
-- Ejecutar: create-noshow-templates.sql
-- Ejecutar: create-noshow-analytics-function.sql

-- Paso 5: Configuración de negocio
-- Ejecutar: create-restaurant-business-config.sql

-- Paso 6: Generador de disponibilidad
-- Ejecutar: fix-availability-generator.sql
```

### **3. DATOS DE PRUEBA:**
```sql
-- Paso 7: Datos de demostración
-- Ejecutar: create-perfect-demo-data.sql
-- Ejecutar: create-real-noshow-data.sql
-- Ejecutar: create-conversations-demo-data.sql
```

### **4. VERIFICACIÓN:**
```sql
-- Paso 8: Auditar estado completo
-- Ejecutar: audit-complete-database.sql
-- Ejecutar: verify-noshow-setup.sql
```

## 🏆 **ESTADO ACTUAL (Septiembre 2025)**

```bash
✅ DOCUMENTACIÓN: Schema completo documentado (41 tablas)
✅ RLS: Habilitado en todas las tablas críticas
✅ FUNCIONES: Todas las RPC funcionando
✅ NO-SHOWS: Sistema completo implementado
✅ CRM: Templates y configuración lista
✅ DATOS: Demo data realista disponible
✅ SEGURIDAD: Enterprise Grade
```

## 📋 **MANTENIMIENTO PERIÓDICO**

### **MENSUAL:**
```sql
-- Ejecutar auditoría completa
-- src/scripts/audit-complete-database.sql
```

### **CUANDO AÑADIR NUEVAS TABLAS:**
```sql
-- 1. Crear tabla con RLS habilitado
-- 2. Ejecutar enable-rls-security.sql si necesario
-- 3. Auditar con audit-complete-database.sql
```

### **SI HAY PROBLEMAS DE NO-SHOWS:**
```sql
-- 1. Verificar: verify-noshow-setup.sql
-- 2. Fix: fix-availability-generator.sql
-- 3. Recrear plantillas: create-noshow-templates.sql
```

## 📊 **DOCUMENTACIÓN COMPLETA**

**Toda la estructura de la base de datos está documentada en:**
- `docs/DATABASE-SCHEMA-COMPLETO-2025.md` - **DOCUMENTACIÓN MAESTRA**

**Esta documentación incluye:**
- ✅ 41 tablas con todas sus columnas y tipos
- ✅ Todos los constraints CHECK con valores permitidos
- ✅ Todas las claves primarias y foráneas
- ✅ 50+ funciones RPC disponibles
- ✅ Columnas críticas identificadas

---

**Última actualización:** 20 Septiembre 2025  
**Estado:** Directorio limpio y optimizado  
**Scripts obsoletos:** Eliminados  
**Documentación:** Completa y actualizada
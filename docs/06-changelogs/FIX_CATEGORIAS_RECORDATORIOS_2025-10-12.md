# 🔧 FIX: Categorías de Recordatorios Separadas

**Fecha:** 12 de Octubre 2025  
**Tipo:** Corrección de estructura  
**Archivos Modificados:** 
- `supabase/migrations/20251012_005_fix_recordatorios_categories.sql`
- `src/pages/PlantillasCRM.jsx`

---

## 📋 PROBLEMA DETECTADO

**ANTES (❌ Incorrecto):**
```
Categoría "Recordatorios" (cajón desastre):
  ├── Confirmación 24h Antes
  ├── Recordatorio 24h antes  
  ├── Recordatorio 4h antes
  └── Recordatorio Urgente
```

**AHORA (✅ Correcto):**
```
Categoría "Confirmación 24h Antes":
  └── Confirmación 24h Antes (1 plantilla)

Categoría "Confirmación 4h Antes":
  └── Confirmación 4h Antes (1 plantilla)
```

---

## 🔧 CAMBIOS REALIZADOS

### 1️⃣ **Base de Datos**

**Cambio de categorías:**
- `'recordatorio'` → `'confirmacion_24h'` (para la plantilla de 24h)
- `'recordatorio'` → `'confirmacion_4h'` (para la plantilla de 4h)

**Renombrado:**
- "Recordatorio Urgente" → "Confirmación 4h Antes"

### 2️⃣ **Frontend (PlantillasCRM.jsx)**

**Nuevas categorías en `TEMPLATE_CATEGORIES`:**

```javascript
confirmacion_24h: {
    name: "Confirmación 24h Antes",
    description: "Confirmación de reserva 24 horas antes",
    icon: CheckCircle2
},
confirmacion_4h: {
    name: "Confirmación 4h Antes",
    description: "Recordatorio urgente 4 horas antes",
    icon: CheckCircle2
}
```

---

## 🚀 CÓMO APLICAR LA MIGRACIÓN

### **Paso 1: Ejecutar en Supabase SQL Editor**

```sql
-- Copiar y pegar TODO el contenido de:
supabase/migrations/20251012_005_fix_recordatorios_categories.sql
```

Esta migración:
1. ✅ Actualiza las plantillas existentes
2. ✅ Cambia las categorías
3. ✅ Renombra "Recordatorio Urgente" a "Confirmación 4h Antes"
4. ✅ Actualiza la función `create_default_templates_for_restaurant()`

### **Paso 2: Verificar en SQL Editor**

```sql
-- Ver las plantillas actualizadas
SELECT 
  name,
  category,
  channel,
  is_active
FROM message_templates
WHERE name IN ('Confirmación 24h Antes', 'Confirmación 4h Antes')
ORDER BY category;
```

**Resultado esperado:**
```
| name                    | category          | channel   | is_active |
|-------------------------|-------------------|-----------|-----------|
| Confirmación 24h Antes  | confirmacion_24h  | whatsapp  | true      |
| Confirmación 4h Antes   | confirmacion_4h   | whatsapp  | true      |
```

### **Paso 3: Refrescar el Frontend**

1. El frontend ya está actualizado (hot reload automático)
2. Ve a "Plantillas CRM" en tu app
3. Verás **2 categorías separadas**:
   - **"Confirmación 24h Antes"** con 1 plantilla
   - **"Confirmación 4h Antes"** con 1 plantilla

---

## ✅ BENEFICIOS

1. **Organización clara:** Cada recordatorio tiene su propia categoría
2. **No más "cajón desastre":** Sin mezclar plantillas de diferentes tipos
3. **Más escalable:** Fácil añadir variantes sin confusión
4. **UX mejorada:** El usuario ve claramente qué hace cada plantilla
5. **Constraint funciona:** Solo 1 activa por categoría (ya no por nombre genérico)

---

## 📊 ESTRUCTURA FINAL

```
📁 Bienvenida
  ├── Bienvenida Nuevo Cliente
  └── Email Bienvenida

📁 Confirmación 24h Antes
  └── Confirmación 24h Antes

📁 Confirmación 4h Antes
  └── Confirmación 4h Antes

📁 Cliente VIP
  └── Bienvenida Cliente VIP

📁 Alto Valor
  └── Reconocimiento Alto Valor

📁 Reactivación
  └── Reactivación Cliente Inactivo

📁 En Riesgo
  └── Recuperación Cliente en Riesgo

📁 No-Shows
  └── Seguimiento No-Show

📁 Grupos
  ├── Aprobación Grupo Grande
  └── Rechazo Grupo Grande
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Ejecutar la migración en Supabase
2. ✅ Verificar que las plantillas se ven correctamente en el frontend
3. ✅ Probar activación/desactivación con el nuevo modal de confirmación
4. 🔄 Actualizar N8n workflows si es necesario (verificar que sigan buscando "Confirmación 24h Antes" y "Confirmación 4h Antes")

---

## 🔍 NOTAS IMPORTANTES

- ⚠️ La migración es **idempotente** (se puede ejecutar múltiples veces sin problemas)
- ⚠️ Usa `ON CONFLICT ... DO NOTHING` para evitar duplicados
- ⚠️ La función `create_default_templates_for_restaurant()` se actualiza automáticamente
- ✅ Los workflows de N8n ya buscan por `name`, así que seguirán funcionando correctamente

---

**Autor:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** ✅ Listo para aplicar


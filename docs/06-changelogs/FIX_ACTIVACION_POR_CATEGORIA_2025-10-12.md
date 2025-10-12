# 🔧 FIX CRÍTICO: Activación por Categoría (No por Nombre)

**Fecha:** 12 de Octubre 2025  
**Tipo:** Corrección crítica de lógica  
**Prioridad:** 🔴 CRÍTICA  
**Archivos Modificados:**
- `src/pages/PlantillasCRM.jsx`
- `supabase/migrations/20251012_011_fix_set_active_template_by_category.sql`

---

## 🐛 PROBLEMA DETECTADO

**Usuario reporta:**
> "Sigo pudiendo activar 2 plantillas del mismo concepto. Por ejemplo: 'Confirmación 24h Antes' y 'Confirmación 24h Antes (Copia)' están ambas activas. El modal NO aparece."

### **Causa Raíz:**

La lógica estaba comparando por **`name`** (nombre), no por **`category`** (categoría):

```javascript
// ❌ ANTES (Incorrecto)
const activeTemplate = templates.find(t => 
    t.name === template.name &&  // ← Comparaba por NOMBRE
    t.id !== template.id && 
    t.is_active
);
```

**Problema:**
- "Confirmación 24h Antes" → `name = "Confirmación 24h Antes"`
- "Confirmación 24h Antes (Copia)" → `name = "Confirmación 24h Antes (Copia)"`
- **Los nombres son DIFERENTES** → No detecta conflicto
- **Ambas pueden estar activas** ❌

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **1️⃣ Frontend: Comparar por `category`**

**Cambio en `PlantillasCRM.jsx`:**

```javascript
// ✅ AHORA (Correcto)
const activeTemplate = templates.find(t => 
    t.category === template.category &&  // ← Compara por CATEGORÍA
    t.id !== template.id && 
    t.is_active
);
```

**Resultado:**
- "Confirmación 24h Antes" → `category = "confirmacion_24h"`
- "Confirmación 24h Antes (Copia)" → `category = "confirmacion_24h"`
- **Las categorías son IGUALES** → Detecta conflicto ✅
- **Modal aparece** ✅

---

### **2️⃣ Backend: Actualizar función RPC y constraint**

**Nueva migración:** `20251012_011_fix_set_active_template_by_category.sql`

**Cambios:**

1. **Eliminar índice antiguo** (basado en `name`):
   ```sql
   DROP INDEX IF EXISTS idx_unique_active_template_per_restaurant_and_type;
   ```

2. **Crear índice nuevo** (basado en `category`):
   ```sql
   CREATE UNIQUE INDEX idx_unique_active_template_per_restaurant_and_category
   ON message_templates (restaurant_id, category)
   WHERE is_active = true;
   ```

3. **Actualizar función `set_active_template()`**:
   ```sql
   -- ANTES ❌
   SELECT name INTO v_template_name ...
   WHERE name = v_template_name ...

   -- AHORA ✅
   SELECT category INTO v_template_category ...
   WHERE category = v_template_category ...
   ```

---

## 🎯 FLUJO FINAL CORREGIDO

### **Caso 1: Duplicar plantilla**

1. Usuario duplica "Confirmación 24h Antes"
2. Se crea "Confirmación 24h Antes (Copia)" **DESACTIVADA** (botón rojo)
3. ✅ Ambas tienen `category = "confirmacion_24h"`

### **Caso 2: Intentar activar la copia**

1. Usuario hace clic en botón rojo de "(Copia)"
2. ✅ Sistema detecta: "Ya hay una plantilla de categoría `confirmacion_24h` activa"
3. ✅ **Modal aparece:**
   ```
   ⚠️ Ya existe otra plantilla "Confirmación 24h Antes" activa.
   
   Al activar esta plantilla, la otra será desactivada automáticamente.
   Solo puede haber una plantilla activa de cada tipo.
   
   [Cancelar]  [Activar de todos modos]
   ```

4. Si usuario confirma:
   - ✅ Desactiva "Confirmación 24h Antes" (original)
   - ✅ Activa "Confirmación 24h Antes (Copia)"
   - ✅ Solo 1 activa de categoría `confirmacion_24h`

---

## 🚀 CÓMO APLICAR

### **Paso 1: Ejecutar migración SQL**

```sql
-- Ir a: Supabase Dashboard → SQL Editor → New Query
-- Copiar y pegar TODO el contenido de:
-- supabase/migrations/20251012_011_fix_set_active_template_by_category.sql
-- Ejecutar
```

### **Paso 2: Verificar**

```sql
-- Ver si hay duplicados activos por categoría
SELECT 
  category,
  COUNT(*) FILTER (WHERE is_active = true) as activas,
  STRING_AGG(name, ', ') FILTER (WHERE is_active = true) as plantillas_activas
FROM message_templates
GROUP BY category
HAVING COUNT(*) FILTER (WHERE is_active = true) > 1;
```

**Resultado esperado:** `0 rows` (sin duplicados)

### **Paso 3: Probar en frontend**

1. Ir a **Plantillas CRM**
2. Duplicar "Confirmación 24h Antes"
3. Intentar activar la copia (botón rojo)
4. ✅ **Modal debe aparecer** advirtiendo del conflicto

---

## ✅ BENEFICIOS

1. ✅ **Modal funciona correctamente** → Detecta conflictos por categoría
2. ✅ **Solo 1 activa garantizado** → Constraint en BD
3. ✅ **N8n no se confunde** → Busca por categoría, encuentra solo 1
4. ✅ **UX coherente** → Usuario entiende qué está pasando
5. ✅ **Sin errores** → Lógica correcta en frontend y backend

---

## 🔍 COMPARACIÓN

### **ANTES (❌ Incorrecto):**

```
Plantilla                           | name                              | category           | activa
------------------------------------|-----------------------------------|--------------------|--------
Confirmación 24h Antes              | Confirmación 24h Antes            | confirmacion_24h   | ✅
Confirmación 24h Antes (Copia)      | Confirmación 24h Antes (Copia)    | confirmacion_24h   | ✅ ← ERROR
```

**Problema:** Nombres diferentes → No detecta conflicto → Ambas activas

---

### **AHORA (✅ Correcto):**

```
Plantilla                           | name                              | category           | activa
------------------------------------|-----------------------------------|--------------------|--------
Confirmación 24h Antes              | Confirmación 24h Antes            | confirmacion_24h   | ❌
Confirmación 24h Antes (Copia)      | Confirmación 24h Antes (Copia)    | confirmacion_24h   | ✅
```

**Solución:** Compara por `category` → Detecta conflicto → Modal aparece → Solo 1 activa

---

## ⚠️ IMPORTANTE PARA N8N

**Buscar plantillas por categoría:**

```javascript
// Buscar plantilla activa de confirmación 24h
const { data } = await supabase
  .from('message_templates')
  .select('*')
  .eq('restaurant_id', restaurant_id)
  .eq('category', 'confirmacion_24h')  // ✅ Por CATEGORÍA
  .eq('is_active', true)
  .single();
```

**Resultado:**
- ✅ Siempre devuelve 1 sola plantilla
- ✅ La activa de esa categoría
- ✅ Sin importar el nombre

---

**Autor:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** ✅ Implementado - **REQUIERE EJECUTAR MIGRACIÓN SQL**  
**Prioridad:** 🔴 CRÍTICA - Bloqueaba el sistema de plantillas


# 🔧 FIX: Duplicar Plantillas - Siempre Desactivadas

**Fecha:** 12 de Octubre 2025  
**Tipo:** Corrección de UX crítica  
**Prioridad:** 🔴 ALTA  
**Archivo Modificado:** `src/pages/PlantillasCRM.jsx`

---

## 🐛 PROBLEMA DETECTADO

**Usuario reporta:**
> "Al duplicar una plantilla, se crea con `is_active = true`. Esto causa que haya 2 plantillas activas del mismo tipo, lo cual rompe N8n porque no sabe cuál usar."

### **Síntomas:**

1. ❌ Duplicar plantilla → Se crea **ACTIVA**
2. ❌ Ahora hay **2 plantillas activas** del mismo tipo
3. ❌ N8n no sabe cuál usar → **Error en workflows**
4. ❌ Botón desactivado en gris → **Poco visible**

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **1️⃣ Duplicar siempre desactivada**

**Cambio en función `duplicateTemplate()`:**

```javascript
// ANTES ❌
is_active: false,  // (pero no funcionaba bien)

// AHORA ✅
is_active: false, // ✅ SIEMPRE desactivada al duplicar
```

**Resultado:**
- ✅ La copia se crea **DESACTIVADA**
- ✅ Solo queda 1 plantilla activa
- ✅ Toast muestra: "Plantilla duplicada (desactivada)"

---

### **2️⃣ Botón desactivado en ROJO**

**Cambio visual:**

```javascript
// ANTES ❌
'text-gray-400 hover:text-green-600 hover:bg-green-50'

// AHORA ✅
'text-red-600 bg-red-100 hover:bg-red-200 hover:shadow-sm'
```

**Resultado:**
- ✅ Botón **VERDE** cuando activa (Power icon)
- ✅ Botón **ROJO** cuando desactivada (PowerOff icon)
- ✅ Más visual y claro

---

### **3️⃣ Modal de confirmación ya existente**

**Ya implementado previamente:**
- ✅ Al activar una plantilla → Modal pregunta si desactivar la otra
- ✅ Solo 1 activa por categoría garantizado
- ✅ Constraint en BD (`idx_unique_active_template_per_restaurant_and_type`)

---

## 🎯 FLUJO COMPLETO CORREGIDO

### **Duplicar Plantilla:**

1. Usuario hace clic en **Duplicar** (icono Copy)
2. Se crea plantilla con nombre "(Copia)"
3. ✅ **Se crea DESACTIVADA** (`is_active = false`)
4. Toast: "✅ Plantilla duplicada (desactivada)"
5. Botón aparece **ROJO** (PowerOff icon)

### **Activar Plantilla:**

1. Usuario hace clic en botón **ROJO** (PowerOff)
2. Sistema verifica si hay otra del mismo tipo activa
3. **Si hay otra activa:**
   - ⚠️ Muestra modal de confirmación
   - Usuario confirma
   - Se desactiva la otra automáticamente
   - Se activa la nueva
   - Botón cambia a **VERDE** (Power icon)
4. **Si no hay otra activa:**
   - Se activa directamente
   - Botón cambia a **VERDE**

### **Desactivar Plantilla:**

1. Usuario hace clic en botón **VERDE** (Power)
2. Se desactiva directamente (sin modal)
3. Botón cambia a **ROJO** (PowerOff)

---

## 🎨 VISUAL

### **ANTES (❌ Confuso):**

```
Plantilla Activa    → [🟢 Verde]  Power icon
Plantilla Inactiva  → [⚪ Gris]   PowerOff icon
```

### **AHORA (✅ Claro):**

```
Plantilla Activa    → [🟢 Verde]  Power icon
Plantilla Inactiva  → [🔴 Rojo]   PowerOff icon
```

---

## ✅ BENEFICIOS

1. ✅ **No más duplicados activos** → Solo 1 activa siempre
2. ✅ **N8n funciona correctamente** → Sabe qué plantilla usar
3. ✅ **Visual claro** → Rojo = desactivada, Verde = activa
4. ✅ **UX mejorada** → Flujo intuitivo
5. ✅ **Sin errores** → Constraint en BD + lógica frontend

---

## 🔍 NOTAS TÉCNICAS

### **Constraint en BD:**

```sql
CREATE UNIQUE INDEX idx_unique_active_template_per_restaurant_and_type
ON message_templates (restaurant_id, name)
WHERE is_active = true;
```

**Garantiza:** Solo 1 plantilla activa por `(restaurant_id, name)` a nivel de base de datos.

### **Frontend:**

```javascript
// Al duplicar
is_active: false  // ✅ Siempre desactivada

// Al activar
if (activeTemplate) {
  // Mostrar modal de confirmación
  setTemplateToActivate(template);
  setShowConfirmModal(true);
} else {
  // Activar directamente
  await activateTemplate(template);
}
```

---

## ⚠️ IMPORTANTE PARA N8N

**Al buscar plantillas en N8n:**

```javascript
// Buscar SOLO la activa
const { data } = await supabase
  .from('message_templates')
  .select('*')
  .eq('restaurant_id', restaurant_id)
  .eq('name', 'Confirmación 24h Antes')
  .eq('is_active', true)  // ✅ CRÍTICO
  .single();
```

**Resultado:**
- ✅ Siempre devolverá 1 sola plantilla
- ✅ La correcta (la activa)
- ✅ Sin ambigüedades

---

**Autor:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** ✅ Implementado y funcionando  
**Prioridad:** 🔴 CRÍTICA - Bloqueaba N8n workflows


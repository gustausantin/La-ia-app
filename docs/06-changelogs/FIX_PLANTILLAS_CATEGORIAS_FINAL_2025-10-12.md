# 🔧 FIX FINAL: Categorías de Plantillas CRM

**Fecha:** 12 de Octubre 2025  
**Tipo:** Corrección crítica de estructura  
**Prioridad:** 🔴 ALTA  
**Archivos Modificados:**
- `supabase/migrations/20251012_007_fix_categories_final.sql`
- `src/pages/PlantillasCRM.jsx`

---

## 🐛 PROBLEMAS DETECTADOS

### **1️⃣ ALTO VALOR - 2 Plantillas Activas**
❌ **Problema:** Había 2 plantillas de "Alto Valor" activas simultáneamente  
⚠️ **Impacto:** N8n no sabría cuál usar → Error en workflows  
✅ **Solución:** Desactivar todas excepto "Reconocimiento Alto Valor"

### **2️⃣ GRUPOS - Mezcladas en 1 Categoría**
❌ **Problema:** "Aprobación" y "Rechazo" estaban juntas en categoría "Grupos"  
⚠️ **Impacto:** N8n no puede distinguir cuál usar para aprobar vs. rechazar  
✅ **Solución:** Separar en 2 categorías independientes:
- `grupo_aprobacion` → "Aprobación Grupo Grande"
- `grupo_rechazo` → "Rechazo Grupo Grande"

### **3️⃣ RECORDATORIO - Categoría Obsoleta**
❌ **Problema:** Existía categoría "recordatorio" que ya no se usa  
⚠️ **Impacto:** Confusión con las nuevas `confirmacion_24h` y `confirmacion_4h`  
✅ **Solución:** ELIMINAR completamente la categoría "recordatorio"

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **SQL Migration:**
📄 `supabase/migrations/20251012_007_fix_categories_final.sql`

**Acciones:**

1. **Alto Valor:**
   ```sql
   -- Desactivar todas
   UPDATE message_templates SET is_active = false WHERE category = 'alto_valor';
   
   -- Activar solo la primera (por created_at)
   UPDATE ... SET is_active = true WHERE id IN (SELECT ... LIMIT 1);
   ```

2. **Grupos Aprobación:**
   ```sql
   UPDATE message_templates 
   SET category = 'grupo_aprobacion'
   WHERE name = 'Aprobación Grupo Grande';
   ```

3. **Grupos Rechazo:**
   ```sql
   UPDATE message_templates 
   SET category = 'grupo_rechazo'
   WHERE name = 'Rechazo Grupo Grande';
   ```

4. **Eliminar Recordatorio:**
   ```sql
   DELETE FROM message_templates WHERE category = 'recordatorio';
   ```

5. **Actualizar función `create_default_templates_for_restaurant()`**  
   → Ahora crea las plantillas con las categorías correctas

---

### **Frontend:**
📄 `src/pages/PlantillasCRM.jsx`

**Nuevas categorías:**
```javascript
grupo_aprobacion: {
    name: "Aprobación Grupo Grande",
    description: "Confirmación de reservas de grupos grandes",
    icon: CheckCircle2
},
grupo_rechazo: {
    name: "Rechazo Grupo Grande",
    description: "Rechazo de reservas de grupos grandes",
    icon: X
}
```

**Eliminadas:**
- ~~`grupo_grande`~~ (reemplazada por `grupo_aprobacion` y `grupo_rechazo`)
- ~~`recordatorio`~~ (reemplazada por `confirmacion_24h` y `confirmacion_4h`)

---

## 🚀 CÓMO APLICAR

### **Paso 1: Ejecutar migración SQL**

```sql
-- Ir a: Supabase Dashboard → SQL Editor → New Query
-- Copiar y pegar TODO el contenido de:
-- supabase/migrations/20251012_007_fix_categories_final.sql
-- Ejecutar
```

### **Paso 2: Verificar plantillas activas**

```sql
-- Ver cuántas activas hay por categoría
SELECT 
  category,
  COUNT(*) as total,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as activas
FROM message_templates
GROUP BY category
ORDER BY category;
```

**Resultado esperado:**
```
| category           | total | activas |
|--------------------|-------|---------|
| alto_valor         |   1   |    1    | ✅
| bienvenida         |   2   |    1    | ✅
| confirmacion_24h   |   1   |    1    | ✅
| confirmacion_4h    |   1   |    1    | ✅
| grupo_aprobacion   |   1   |    1    | ✅
| grupo_rechazo      |   1   |    1    | ✅
| noshow             |   1   |    1    | ✅
| reactivacion       |   1   |    1    | ✅
| recuperacion       |   1   |    1    | ✅
| vip_upgrade        |   1   |    1    | ✅
```

### **Paso 3: Ver plantillas activas**

```sql
SELECT 
  category,
  name,
  is_active
FROM message_templates
WHERE is_active = true
ORDER BY category;
```

### **Paso 4: Refrescar frontend**

1. Ir a **Plantillas CRM**
2. Hacer refresh (F5)
3. Verificar que:
   - ✅ "Alto Valor" tiene **1 sola plantilla activa**
   - ✅ "Aprobación Grupo Grande" es una **categoría separada**
   - ✅ "Rechazo Grupo Grande" es una **categoría separada**
   - ✅ NO existe categoría "Recordatorio"

---

## 📊 ESTRUCTURA FINAL

```
📁 Bienvenida
  ├── Bienvenida Nuevo Cliente (✅ activa)
  └── Email Bienvenida

📁 Confirmación 24h Antes
  └── Confirmación 24h Antes (✅ activa)

📁 Confirmación 4h Antes
  └── Confirmación 4h Antes (✅ activa)

📁 Cliente VIP
  └── Bienvenida Cliente VIP (✅ activa)

📁 Alto Valor
  └── Reconocimiento Alto Valor (✅ activa) ← SOLO 1

📁 Reactivación
  └── Reactivación Cliente Inactivo (✅ activa)

📁 En Riesgo
  └── Recuperación Cliente en Riesgo (✅ activa)

📁 No-Shows
  └── Seguimiento No-Show (✅ activa)

📁 Aprobación Grupo Grande ← SEPARADA
  └── Aprobación Grupo Grande (✅ activa)

📁 Rechazo Grupo Grande ← SEPARADA
  └── Rechazo Grupo Grande (✅ activa)
```

---

## ✅ BENEFICIOS

1. **N8n funcionará correctamente:** Cada workflow sabe exactamente qué plantilla usar
2. **Solo 1 activa por categoría:** No hay ambigüedad ni errores
3. **Categorías claras:** Aprobación y Rechazo separadas
4. **Sin obsoletas:** Categoría "recordatorio" eliminada
5. **Escalable:** Fácil añadir más plantillas sin confusión

---

## ⚠️ IMPORTANTE PARA N8N

### **Al crear workflows:**

**Para Aprobación de Grupos:**
```javascript
// Buscar en category = 'grupo_aprobacion'
// y name = 'Aprobación Grupo Grande'
```

**Para Rechazo de Grupos:**
```javascript
// Buscar en category = 'grupo_rechazo'
// y name = 'Rechazo Grupo Grande'
```

**Para Confirmaciones:**
```javascript
// 24h antes: category = 'confirmacion_24h'
// 4h antes: category = 'confirmacion_4h'
```

---

**Autor:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** ✅ Listo para aplicar  
**Prioridad:** 🔴 CRÍTICA - Bloquea workflows de N8n


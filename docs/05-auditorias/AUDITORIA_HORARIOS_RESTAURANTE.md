# 🕐 AUDITORÍA: HORARIOS DEL RESTAURANTE

> **Fecha:** 16 de Octubre 2025  
> **Problema detectado:** La tabla `restaurant_operating_hours` existe pero NO se utiliza  
> **Estado:** ⚠️ **INCONSISTENCIA DETECTADA**

---

## 🔍 HALLAZGOS

### 1️⃣ **DÓNDE SE GUARDAN LOS HORARIOS ACTUALMENTE**

**Ubicación:** `restaurants.settings.operating_hours` (JSONB)

**Estructura:**
```json
{
  "operating_hours": {
    "monday": { "open": "12:00", "close": "23:00", "closed": false },
    "tuesday": { "open": "12:00", "close": "23:00", "closed": false },
    "wednesday": { "open": "12:00", "close": "23:00", "closed": false },
    "thursday": { "open": "12:00", "close": "23:00", "closed": false },
    "friday": { "open": "12:00", "close": "24:00", "closed": false },
    "saturday": { "open": "12:00", "close": "24:00", "closed": false },
    "sunday": { "open": "12:00", "close": "23:00", "closed": true }
  }
}
```

**Archivo responsable del guardado:**
- `src/pages/Calendario.jsx` (líneas 959-969)

```javascript
const { error } = await supabase
    .from("restaurants")
    .update({
        settings: {
            ...currentSettings,
            operating_hours: operating_hours,  // ✅ AQUÍ SE GUARDA
            calendar_schedule: calendar_schedule
        },
        updated_at: new Date().toISOString()
    })
    .eq("id", restaurantId);
```

---

### 2️⃣ **DÓNDE SE UTILIZAN LOS HORARIOS**

**Archivos que CONSUMEN `restaurants.settings.operating_hours`:**

1. **`src/services/reservationValidationService.js`** (4 usos)
   - Línea 103: `const operatingHours = settings.operating_hours || {};`
   - Línea 183: `const operatingHours = settings.operating_hours || {};`
   - Línea 371: `const operatingHours = settings.operating_hours || {};`
   - Línea 889: `const operatingHours = settings.operating_hours || {};`

2. **`src/stores/reservationStore.js`** (línea 387)
   - `let operatingHours = restaurantData?.settings?.operating_hours;`

3. **`src/utils/occupancyCalculator.js`** (líneas 27 y 217)
   - `const operatingHours = restaurant?.settings?.operating_hours || {};`

4. **`src/components/AvailabilityManager.jsx`** (líneas 892-893)
   - `if (!settingsError && restaurantData?.settings?.operating_hours) {`

5. **`src/pages/Calendario.jsx`** (línea 222)
   - `let savedHours = restaurantData?.settings?.operating_hours || {};`

---

### 3️⃣ **TABLA `restaurant_operating_hours`**

**Estado:** ✅ Existe en BD pero ❌ **NO SE UTILIZA EN NINGÚN LUGAR**

**Esquema:**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | PK |
| `restaurant_id` | uuid | FK → restaurants |
| `day_of_week` | int | 0 = Domingo, 1 = Lunes, ... 6 = Sábado |
| `is_open` | boolean | true/false |
| `open_time` | time | Hora apertura |
| `close_time` | time | Hora cierre |
| `created_at` | timestamptz | Fecha creación |
| `updated_at` | timestamptz | Fecha actualización |

**Resultado de grep:**
```bash
grep "restaurant_operating_hours" src/**/*
# ❌ 0 resultados en código de aplicación
```

**Único uso:** Workflow N8N `3-super-agent-hibrido-FINAL-CORREGIDO.json`
- Nodo: `🏪 Obtener Horarios`
- **PROBLEMA:** Intenta leer de `restaurant_operating_hours` pero está VACÍA

---

## ⚠️ PROBLEMA ACTUAL

### **El Super Agent NO puede responder preguntas sobre horarios porque:**

1. **Consulta tabla vacía:** `restaurant_operating_hours` no tiene datos
2. **Los datos reales están en otro lugar:** `restaurants.settings.operating_hours`
3. **Resultado:** El nodo devuelve vacío y el agente no sabe los horarios

---

## ✅ SOLUCIONES PROPUESTAS

### **OPCIÓN 1: Sincronizar ambos lugares (RECOMENDADO)**

**Ventajas:**
- ✅ Tabla normalizada SQL (mejor para queries complejas)
- ✅ JSONB sigue funcionando (backwards compatibility)
- ✅ Super Agent funciona correctamente

**Implementación:**

1. **Modificar `src/pages/Calendario.jsx`:**

```javascript
// Después de guardar en restaurants.settings (línea 969)
// Guardar TAMBIÉN en restaurant_operating_hours

const dayMapping = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 0
};

// Primero, borrar registros existentes
await supabase
    .from('restaurant_operating_hours')
    .delete()
    .eq('restaurant_id', restaurantId);

// Insertar nuevos registros
const hoursToInsert = Object.entries(operating_hours).map(([day, hours]) => ({
    restaurant_id: restaurantId,
    day_of_week: dayMapping[day],
    is_open: !hours.closed,
    open_time: hours.open,
    close_time: hours.close
}));

await supabase
    .from('restaurant_operating_hours')
    .insert(hoursToInsert);
```

2. **El Super Agent sigue igual** (ya está bien configurado)

---

### **OPCIÓN 2: Cambiar Super Agent a leer JSONB**

**Ventajas:**
- ✅ Más simple (solo cambiar workflow)
- ✅ No duplicar datos

**Desventajas:**
- ❌ Tabla `restaurant_operating_hours` sigue inútil
- ❌ Menos normalizado

**Implementación:**

Modificar nodo `🏪 Obtener Horarios` en Super Agent:
- **Tabla:** `restaurants`
- **Resource:** `Get Many`
- **Filtros:** `id = restaurant_id`
- **Fields:** `settings`
- **Código posterior:** Extraer `settings.operating_hours`

---

## 📊 RECOMENDACIÓN FINAL

### ✅ **OPCIÓN 1: Sincronizar ambos lugares**

**Motivo:**
- Mantiene tabla SQL (mejor para análisis, reportes, joins)
- Backwards compatibility total (nada se rompe)
- Super Agent funciona inmediatamente
- Preparado para futuro (migración gradual a tabla SQL)

**Plan de migración gradual:**
1. **HOY:** Sincronizar Calendario.jsx → Guardar en ambos lugares
2. **Próximo sprint:** Migrar servicios de JSONB → Tabla SQL
3. **Futuro:** Eliminar JSONB cuando todo use tabla SQL

---

## 🚀 IMPLEMENTACIÓN INMEDIATA

¿Quieres que implemente la **OPCIÓN 1** ahora mismo?

**Archivos a modificar:**
- ✅ `src/pages/Calendario.jsx` (añadir sincronización)
- ✅ Verificar que Super Agent lea de tabla correctamente
- ✅ Testing: Guardar horarios → Verificar ambas ubicaciones



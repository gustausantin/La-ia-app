# 📊 AUDITORÍA COMPLETA: SISTEMA DE HORARIOS Y DISPONIBILIDADES

**Fecha:** 12 de Octubre 2025  
**Auditor:** AI Assistant  
**Alcance:** Sistema completo de gestión de horarios, disponibilidades y slots  
**Estado:** ✅ Análisis completado - Esperando instrucciones para cambios

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Actual](#arquitectura-actual)
3. [Flujo de Datos](#flujo-de-datos)
4. [Configuración de Horarios](#configuración-de-horarios)
5. [Generación de Slots](#generación-de-slots)
6. [Cálculos y Lógica](#cálculos-y-lógica)
7. [Frontend - Componentes](#frontend---componentes)
8. [Issues Detectados](#issues-detectados)
9. [Recomendaciones](#recomendaciones)

---

## 🎯 RESUMEN EJECUTIVO

### **Nomenclatura Corregida:**
- ✅ "Gestión de Disponibilidades" → **"Gestión de Horarios de Reserva"**
- ✅ "Disponibilidades Activas" → **"Días Disponibles"**

### **Sistema Actual:**

El sistema gestiona **3 capas** de configuración para determinar cuándo un restaurante puede recibir reservas:

1. **Política de Reservas** (`restaurant.settings.booking_settings`)
   - Duración de reserva (ej: 90 min)
   - Días de anticipación (ej: 30 días)
   - Tamaño mínimo/máximo de grupo

2. **Horarios de Operación** (`calendar_schedule` en `restaurant.settings`)
   - Horarios semanales por día (Lunes-Domingo)
   - Múltiples turnos por día (ej: Comida 13:00-16:00, Cena 20:00-23:00)

3. **Días Especiales** (`calendar_exceptions`)
   - Festivos, cierres, eventos especiales
   - Sobrescribe horarios normales

### **Flujo Simplificado:**

```
Usuario configura horarios
    ↓
Sistema genera "slots" (bloques de tiempo)
    ↓
Slots se guardan en `availability_slots`
    ↓
Frontend muestra estadísticas (días disponibles, total mesas, slots)
    ↓
Cliente hace reserva → Slot cambia de 'free' a 'reserved'
```

---

## 🏗️ ARQUITECTURA ACTUAL

### **Tablas Principales:**

#### 1. `restaurants` (settings JSONB)
```json
{
  "booking_settings": {
    "advance_booking_days": 30,
    "reservation_duration": 90,
    "min_booking_hours": 2,
    "max_party_size": 12
  },
  "calendar_schedule": [
    {
      "day_of_week": "monday",
      "is_open": true,
      "open_time": "18:00",
      "close_time": "22:00"
    }
  ]
}
```

#### 2. `availability_slots`
```sql
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    table_id UUID NOT NULL,
    status TEXT DEFAULT 'free', -- 'free', 'reserved', 'occupied'
    duration_minutes INT DEFAULT 90,
    UNIQUE(restaurant_id, table_id, slot_date, start_time)
);
```

#### 3. `tables`
```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    table_number TEXT,
    capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### 4. `calendar_exceptions`
```sql
CREATE TABLE calendar_exceptions (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    exception_date DATE NOT NULL,
    exception_type TEXT, -- 'closed', 'holiday', 'special_event'
    custom_hours JSONB
);
```

---

## 🔄 FLUJO DE DATOS

### **1. Usuario Configura Horarios:**

**Ubicación:** `src/pages/Reservas.jsx` → Tab "Horarios de Reserva"

**Componente:** `AvailabilityManager.jsx`

**Datos guardados en:**
- `restaurant.settings.calendar_schedule[]`
- `restaurant.settings.booking_settings{}`

### **2. Sistema Genera Slots:**

**Función SQL:** `generate_availability_slots_simple()`

**Ubicación:** `scripts/sql/generate_availability_slots.sql`

**Lógica:**
```sql
FOR cada día en el rango (hoy + 30 días)
  FOR cada mesa activa
    FOR cada turno del día
      FOR cada intervalo de tiempo (cada 90 min)
        INSERT INTO availability_slots (
          slot_date, start_time, end_time, table_id, status='free'
        )
```

**Ejemplo:**
- Restaurante abierto: **18:00 - 22:00** (4 horas)
- Duración reserva: **90 minutos**
- Intervalos: **18:00, 19:30, 21:00**
- Mesas: **6**
- **Slots generados por día:** 6 mesas × 3 intervalos = **18 slots**

### **3. Frontend Muestra Estadísticas:**

**Componente:** `AvailabilityManager.jsx` → Sección "Días Disponibles"

**Datos mostrados:**
- **Días Totales:** Cuenta días únicos en `availability_slots`
- **Días Libres:** Días con al menos 1 slot `status = 'free'`
- **Días Ocupados:** Días con 100% slots `reserved` u `occupied`
- **Reservas Activas:** Count de slots con `status != 'free'`
- **Mesas:** Count de `tables` donde `is_active = true`
- **Duración Reserva:** De `booking_settings.reservation_duration`
- **Fecha Hasta:** MAX(`slot_date`) de `availability_slots`

---

## ⚙️ CONFIGURACIÓN DE HORARIOS

### **Política de Reservas:**

**Ubicación:** Tab "Política de Reservas" en `Reservas.jsx`

| Campo | Valor Actual | Descripción |
|-------|--------------|-------------|
| `advance_booking_days` | 30 | Días de anticipación máxima |
| `reservation_duration` | 90 min | Duración estándar de reserva |
| `min_booking_hours` | 2 | Horas mínimas de anticipación |
| `max_party_size` | 12 | Tamaño máximo de grupo (sin aprobación) |

### **Horarios de Operación:**

**Ubicación:** Tab "Horarios de Reserva" → Sección "Política de Reservas Actual"

**Estructura:**
```javascript
calendar_schedule: [
  {
    day_of_week: "monday", // sunday, monday, ..., saturday
    day_name: "Lunes",
    is_open: true,
    open_time: "18:00",
    close_time: "22:00"
  }
]
```

**Tu configuración actual:**
- **Días abiertos:** Todos (Lunes-Domingo)
- **Horario:** **18:00 - 22:00** (4 horas)
- **No hay turnos múltiples** (solo 1 turno por día)

---

## 🔢 GENERACIÓN DE SLOTS

### **Función: `generate_availability_slots_simple()`**

**Parámetros:**
```sql
generate_availability_slots_simple(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
```

**Lógica Paso a Paso:**

1. **Leer configuración:**
   ```sql
   v_reservation_duration := settings->>'reservation_duration'
   v_slot_interval := settings->>'slot_interval' (default: 90)
   v_advance_booking_days := settings->>'advance_booking_days'
   ```

2. **Por cada día en el rango:**
   - Verificar si día está en `calendar_exceptions` como 'closed' → Skip
   - Obtener horarios del día desde `calendar_schedule`
   - Si `is_open = false` → Skip

3. **Por cada mesa activa:**
   ```sql
   SELECT id FROM tables 
   WHERE restaurant_id = p_restaurant_id 
   AND is_active = true
   ```

4. **Por cada intervalo de tiempo:**
   ```sql
   v_current_time := open_time
   WHILE v_current_time <= close_time LOOP
     INSERT INTO availability_slots (
       restaurant_id, slot_date, start_time, end_time, 
       table_id, status='free', duration_minutes
     )
     v_current_time := v_current_time + v_slot_interval
   END LOOP
   ```

5. **Protección de slots reservados:**
   ```sql
   ON CONFLICT (restaurant_id, table_id, slot_date, start_time) 
   DO NOTHING
   ```

---

## 📊 CÁLCULOS Y LÓGICA

### **1. Cálculo de Días Disponibles:**

**Frontend:** `AvailabilityManager.jsx` → `loadAvailabilityStats()`

```javascript
const { data: stats } = await supabase
  .from('availability_slots')
  .select('slot_date, status')
  .eq('restaurant_id', restaurantId)
  .order('slot_date');

const uniqueDays = [...new Set(stats.map(s => s.slot_date))];
const daysWithFreeSlots = uniqueDays.filter(day => 
  stats.some(s => s.slot_date === day && s.status === 'free')
);

setDayStats({
  diasTotales: uniqueDays.length,
  diasLibres: daysWithFreeSlots.length,
  diasOcupados: uniqueDays.length - daysWithFreeSlots.length
});
```

### **2. Cálculo de Ocupación (Dashboard):**

**Componente:** `src/pages/DashboardAgente.jsx`

**Antes (❌ Incorrecto):**
```javascript
occupancyPercent = (totalPeople / totalCapacity) × 100
// Ejemplo: (12 personas / 22 capacidad) = 55% ❌
```

**Ahora (✅ Correcto):**
```javascript
numTables = 6
turnosDisponibles = Math.floor((4h × 60) / 90min) = 2
slotsDisponibles = 6 mesas × 2 turnos = 12 slots
numReservasHoy = 3

occupancyPercent = (3 / 12) × 100 = 25% ✅
```

---

## 💻 FRONTEND - COMPONENTES

### **1. `AvailabilityManager.jsx`**

**Secciones principales:**

#### **A) Días Disponibles (Estadísticas):**
- **Días Totales:** Count de días únicos en `availability_slots`
- **Días Libres:** Días con al menos 1 slot libre
- **Días Ocupados:** Días sin slots libres
- **Reservas:** Count de slots `reserved`/`occupied`

#### **B) Política de Reservas Actual:**
- **Días de Antelación:** 30 días
- **Duración Reserva:** 90 min/reserva
- **Fecha Hasta:** Hasta 08/11/2025

#### **C) Acciones:**
- **🗑️ Borrar Disponibilidades:** Elimina slots LIBRES en el rango
- **🔄 Generar Horarios de Reserva:** Genera nuevos slots
- **👁️ Ver Disponibilidad por Día:** Consulta específica de un día

### **2. Tab "Horarios de Reserva" en `Reservas.jsx`:**

**Renderiza:** `<AvailabilityManager />`

---

## ⚠️ ISSUES DETECTADOS

### **1. ❌ Nomenclatura confusa (RESUELTO)**
- ✅ Cambiado "Gestión de Disponibilidades" → "Gestión de Horarios de Reserva"
- ✅ Cambiado "Disponibilidades Activas" → "Días Disponibles"

### **2. ⚠️ Cálculo de ocupación (RESUELTO)**
- ✅ Ahora calcula por slots en vez de por personas

### **3. ⚠️ Sin turnos múltiples**
- Actualmente solo se configura 1 horario por día (ej: 18:00-22:00)
- No hay opción para **Comida** (13:00-16:00) + **Cena** (20:00-23:00)

### **4. ⚠️ Intervalo de slots = Duración de reserva**
- `slot_interval` y `reservation_duration` son ambos 90 min
- Esto significa: Slot cada 90 min, reserva dura 90 min
- **Problema:** No hay solapamiento, dificulta optimizar ocupación

### **5. ⚠️ Días Ocupados vs. Días Libres**
- "Días Ocupados" se calcula como: `diasTotales - diasLibres`
- **Problema:** Un día con 1 reserva y 17 slots libres cuenta como "Libre"
- **Mejor:** Mostrar porcentaje de ocupación por día

---

## 💡 RECOMENDACIONES

### **1. Implementar Turnos Múltiples:**
Permitir configurar múltiples turnos por día:
```json
{
  "day_of_week": "monday",
  "shifts": [
    { "name": "Comida", "start": "13:00", "end": "16:00" },
    { "name": "Cena", "start": "20:00", "end": "23:00" }
  ]
}
```

### **2. Separar `slot_interval` de `reservation_duration`:**
- `slot_interval`: Cada cuánto se puede reservar (ej: 30 min)
- `reservation_duration`: Cuánto dura la reserva (ej: 90 min)

**Ejemplo:**
- Slots cada 30 min: 18:00, 18:30, 19:00, 19:30...
- Reserva dura 90 min: Bloquea 3 slots

### **3. Mejorar estadísticas de "Días Disponibles":**
```javascript
// Agregar:
- Porcentaje de ocupación promedio
- Días completamente libres
- Días parcialmente ocupados (con %)
- Días completamente ocupados
```

### **4. Visualización de calendario mensual:**
Agregar un calendario visual que muestre:
- 🟢 Días con > 70% disponibilidad
- 🟡 Días con 30-70% disponibilidad
- 🔴 Días con < 30% disponibilidad
- ⚫ Días cerrados

---

## 🎯 CONCLUSIÓN

El sistema actual es **funcional y robusto**, pero tiene margen de mejora en:

1. ✅ **Nomenclatura** (CORREGIDO)
2. ✅ **Cálculo de ocupación** (CORREGIDO)
3. ⚠️ **Turnos múltiples** (pendiente)
4. ⚠️ **Intervalo vs. Duración** (pendiente)
5. ⚠️ **Visualización mejorada** (pendiente)

---

## 📝 PRÓXIMOS PASOS

**Esperando instrucciones del usuario sobre:**

1. ¿Qué cambio específico necesitas hacer?
2. ¿Quieres implementar turnos múltiples?
3. ¿Necesitas separar `slot_interval` de `reservation_duration`?
4. ¿Hay algún problema específico con la generación de slots?
5. ¿Quieres mejorar la visualización de disponibilidades?

**Por favor, indícame qué cambio hay que hacer y procederé con la implementación.** 🚀

---

**Auditoría realizada:** 12/10/2025  
**Archivos analizados:** 15+ (SQL, JSX, servicios, documentación)  
**Estado:** ✅ Completo - Listo para cambios



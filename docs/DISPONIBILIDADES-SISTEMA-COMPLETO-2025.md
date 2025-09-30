# 📅 SISTEMA DE DISPONIBILIDADES - DOCUMENTACIÓN COMPLETA
**Fecha:** 30 Septiembre 2025  
**Versión:** 2.0 - Sistema Profesional Multi-Tenant

---

## 🎯 RESUMEN EJECUTIVO

Sistema completo de generación y gestión de disponibilidades para reservas de restaurantes, con lógica avanzada que respeta:
- ✅ Calendario especial (festivos, vacaciones)
- ✅ Horarios semanales configurables
- ✅ Política de reservas en tiempo real
- ✅ Multi-tenant con seguridad RLS
- ✅ Detección automática de cambios
- ✅ Protección de reservas existentes

---

## 📊 ARQUITECTURA DEL SISTEMA

### 1. TABLAS PRINCIPALES

#### `availability_slots`
Tabla que almacena todos los slots de disponibilidad.

```sql
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    table_id UUID NOT NULL REFERENCES tables(id),
    shift_name TEXT,
    status TEXT NOT NULL DEFAULT 'free', -- 'free', 'reserved', 'occupied'
    source TEXT DEFAULT 'system', -- 'system', 'manual'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_available BOOLEAN DEFAULT true,
    duration_minutes INTEGER DEFAULT 90
);
```

**Índices:**
```sql
CREATE INDEX idx_availability_slots_restaurant_date 
    ON availability_slots(restaurant_id, slot_date);
CREATE INDEX idx_availability_slots_status 
    ON availability_slots(status);
```

#### `special_events`
Tabla que almacena eventos especiales (festivos, vacaciones, horarios especiales).

```sql
CREATE TABLE special_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    event_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'cerrado', 'festivo', 'horario_especial'
    start_time TIME,
    end_time TIME,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `restaurants.settings` (JSONB)
Configuración del restaurante almacenada en formato JSONB:

```json
{
  "operating_hours": {
    "monday": { "open": "12:00", "close": "22:00", "closed": false },
    "tuesday": { "open": "12:00", "close": "22:00", "closed": false },
    ...
  },
  "calendar_schedule": [
    {
      "day_of_week": "monday",
      "day_name": "Lunes",
      "is_open": true,
      "open_time": "12:00",
      "close_time": "22:00"
    },
    ...
  ],
  "booking_settings": {
    "advance_booking_days": 30,
    "reservation_duration": 120,
    "min_party_size": 1,
    "max_party_size": 12,
    "min_booking_hours": 2
  }
}
```

---

## 🔧 FUNCIONES SQL PRINCIPALES

### 1. `generate_availability_slots_simple`
**Propósito:** Genera disponibilidades siguiendo la lógica completa de 5 pasos.

**Firma:**
```sql
generate_availability_slots_simple(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS JSONB
```

**Lógica implementada:**

#### PASO 1: Política de Reservas
Lee datos reales de `restaurants.settings`:
- `advance_booking_days`: Días máximos de antelación
- `reservation_duration`: Duración estándar de reserva (min)
- `min/max_party_size`: Límites de grupo
- `min_advance_hours`: Horas mínimas de antelación

#### PASO 2: Calendario del Restaurante
**PRIORIDAD 1:** Verifica `special_events` (festivos, vacaciones)
- Si encuentra evento con `is_closed=true` → NO genera slots
- Si encuentra evento con horarios especiales → Usa esos horarios

**PRIORIDAD 2:** Si no hay evento especial, usa `calendar_schedule`
- Busca el día de la semana en el array JSON
- Si `is_open=false` → NO genera slots
- Si `is_open=true` → Usa `open_time` y `close_time`

#### PASO 3: Horario General
- Todas las reservas dentro del horario de apertura
- **REGLA CLAVE:** Última reserva = hora de cierre
  - Ejemplo: Si cierra a las 22:00 → Última reserva a las 22:00
  - NO se resta la duración (el cliente puede reservar hasta el cierre)

#### PASO 4: Generación de Slots
- Crea slots en intervalos de `reservation_duration`
- Formato: HH:MM (sin segundos)
- Inserta con manejo de duplicados (`EXCEPTION WHEN unique_violation`)

#### PASO 5: Retorno
```json
{
  "success": true,
  "message": "Disponibilidades generadas para Casa Lolita",
  "slots_created": 154,
  "table_count": 2,
  "restaurant_id": "...",
  "restaurant_name": "Casa Lolita",
  "policy_applied": {
    "advance_booking_days": 30,
    "reservation_duration": 120,
    "min_party_size": 1,
    "max_party_size": 12,
    "min_advance_hours": 2
  }
}
```

**Archivo:** `generate_availability_slots.sql`

---

### 2. `cleanup_and_regenerate_availability`
**Propósito:** Regenera disponibilidades protegiendo reservas existentes.

**Firma:**
```sql
cleanup_and_regenerate_availability(
    p_restaurant_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS JSONB
```

**Lógica:**
1. Cuenta slots con reservas (`status IN ('reserved', 'occupied')`)
2. Borra SOLO slots libres (`status = 'free'`)
3. Llama a `generate_availability_slots_simple`
4. Retorna estadísticas de protección

**Retorno:**
```json
{
  "success": true,
  "slots_created": 100,
  "deleted_free_slots": 80,
  "protected_reservations": 20
}
```

---

### 3. `borrar_disponibilidades_simple`
**Propósito:** Borra todas las disponibilidades de un restaurante.

**Firma:**
```sql
borrar_disponibilidades_simple(
    p_restaurant_id UUID DEFAULT NULL
) RETURNS JSONB
```

**Lógica:**
- Auto-detecta `restaurant_id` si es NULL
- Borra TODOS los slots del restaurante
- Retorna conteo de slots eliminados

---

## 🔔 SISTEMA DE DETECCIÓN DE CAMBIOS

### Trigger: `handle_table_changes`
**Se dispara en:** `INSERT`, `UPDATE`, `DELETE` en tabla `tables`

**Lógica:**
```sql
-- Al ELIMINAR mesa → Regenera disponibilidades
IF TG_OP = 'DELETE' THEN
    PERFORM generate_availability_slots_simple(...);

-- Al ACTUALIZAR mesa (capacidad o estado) → Regenera
ELSIF TG_OP = 'UPDATE' AND (cambios importantes) THEN
    PERFORM generate_availability_slots_simple(...);

-- Al CREAR mesa activa → Regenera
ELSIF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    PERFORM generate_availability_slots_simple(...);
END IF;
```

**Archivo:** `FIX_TRIGGER_TABLES.sql`

### Hook Frontend: `useAvailabilityChangeDetection`
**Ubicación:** `src/hooks/useAvailabilityChangeDetection.js`

**Funciones:**
- `onTableChange(action, tableData)` - Detecta cambios en mesas
- `onScheduleChange(scheduleData)` - Detecta cambios en horarios
- `onPolicyChange(policyData)` - Detecta cambios en política
- `onSpecialEventChange(action, eventData)` - Detecta eventos especiales

**Estado persistente:** LocalStorage
- Solo muestra aviso si **ya existen slots generados**
- Limpia automáticamente si no hay slots

---

## 🎨 COMPONENTES FRONTEND

### `AvailabilityManager.jsx`
**Ubicación:** `src/components/AvailabilityManager.jsx`

**Funcionalidades:**
1. **Generar Disponibilidades** (Botón azul)
   - Genera desde cero
   - Carga política real antes de generar
   - Valida mesas activas

2. **Regenerar Disponibilidades** (Botón naranja)
   - Solo aparece si hay cambios detectados
   - Usa `cleanup_and_regenerate_availability`
   - Protege reservas existentes

3. **Borrar Disponibilidades**
   - Usa `borrar_disponibilidades_simple`
   - Confirma antes de borrar

4. **Consultar Día Específico**
   - Muestra slots de un día concreto
   - Agrupados por mesa y zona

**Correcciones aplicadas (30/09/2025):**
- ✅ Procesa correctamente la respuesta de `generate_availability_slots_simple`
- ✅ Lee `slots_created` directamente (no de `data.stats`)
- ✅ Lee `policy_applied` para mostrar configuración usada

---

## 🔐 SEGURIDAD Y RLS

### Políticas RLS en `availability_slots`

```sql
-- SELECT: Solo ve slots de SU restaurante
CREATE POLICY "Users see own restaurant slots" 
ON availability_slots FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_restaurant_mapping
        WHERE auth_user_id = auth.uid()
        AND restaurant_id = availability_slots.restaurant_id
    )
    OR
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE id = availability_slots.restaurant_id
        AND owner_id = auth.uid()
    )
);

-- INSERT: Solo puede insertar en SU restaurante
CREATE POLICY "Users insert own restaurant slots" 
ON availability_slots FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_restaurant_mapping
        WHERE auth_user_id = auth.uid()
        AND restaurant_id = availability_slots.restaurant_id
        AND role IN ('owner', 'admin', 'manager')
    )
    OR
    EXISTS (
        SELECT 1 FROM restaurants
        WHERE id = availability_slots.restaurant_id
        AND owner_id = auth.uid()
    )
);
```

---

## 📝 EJEMPLOS DE USO

### Desde la Aplicación Web
```javascript
// 1. Generar disponibilidades
const { data, error } = await supabase.rpc('generate_availability_slots_simple', {
    p_restaurant_id: restaurantId || null,
    p_start_date: '2025-10-01',
    p_end_date: '2025-10-31'
});

// 2. Regenerar (protegiendo reservas)
const { data, error } = await supabase.rpc('cleanup_and_regenerate_availability', {
    p_restaurant_id: restaurantId,
    p_start_date: '2025-10-01',
    p_end_date: '2025-10-31'
});

// 3. Borrar todas
const { data, error } = await supabase.rpc('borrar_disponibilidades_simple', {
    p_restaurant_id: restaurantId
});
```

### Desde Supabase SQL Editor
```sql
-- Generar para restaurante específico
SELECT generate_availability_slots_simple(
    '69726b25-d3e9-4b9c-bc05-610e70ed2c4f'::UUID,
    CURRENT_DATE::DATE,
    (CURRENT_DATE + 30)::DATE
) as resultado;

-- Auto-detección (sin restaurant_id)
SELECT generate_availability_slots_simple(
    NULL::UUID,
    CURRENT_DATE::DATE,
    (CURRENT_DATE + 30)::DATE
) as resultado;
```

---

## 🐛 DEBUGGING Y TROUBLESHOOTING

### Ver slots generados
```sql
SELECT 
    slot_date,
    start_time,
    end_time,
    status,
    t.name as table_name
FROM availability_slots a
JOIN tables t ON t.id = a.table_id
WHERE a.restaurant_id = 'TU_RESTAURANT_ID'
ORDER BY slot_date, start_time;
```

### Ver configuración del restaurante
```sql
SELECT 
    name,
    settings->'operating_hours' as operating_hours,
    settings->'calendar_schedule' as calendar_schedule,
    settings->'booking_settings' as booking_settings
FROM restaurants
WHERE id = 'TU_RESTAURANT_ID';
```

### Ver eventos especiales
```sql
SELECT *
FROM special_events
WHERE restaurant_id = 'TU_RESTAURANT_ID'
ORDER BY event_date;
```

### Ver triggers activos
```sql
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tables'
ORDER BY event_manipulation;
```

---

## 🔄 MIGRACIONES Y ACTUALIZACIONES

### Archivos SQL principales
1. **`generate_availability_slots.sql`** - Funciones principales de generación
2. **`FIX_TRIGGER_TABLES.sql`** - Trigger para detección automática

### Orden de ejecución
1. Ejecutar `generate_availability_slots.sql`
2. Ejecutar `FIX_TRIGGER_TABLES.sql`
3. Verificar triggers y funciones creadas

---

## ⚠️ REGLAS DE ORO

1. **NUNCA inventar datos** - Todo viene de BD real
2. **Proteger reservas** - Usar `cleanup_and_regenerate_availability`
3. **Prioridad calendario** - `special_events` > `calendar_schedule` > `operating_hours`
4. **Última reserva = hora cierre** - No restar duración
5. **Multi-tenant siempre** - RLS en todas las operaciones

---

## 📞 CONTACTO Y SOPORTE

Para dudas o cambios en el sistema de disponibilidades:
- Revisar esta documentación primero
- Verificar logs de Supabase
- Consultar `generate_availability_slots.sql` para lógica SQL
- Revisar `AvailabilityManager.jsx` para lógica frontend

---

**Última actualización:** 30 Septiembre 2025  
**Responsable:** Sistema de Documentación Automática  
**Versión:** 2.0 - Sistema Profesional Multi-Tenant

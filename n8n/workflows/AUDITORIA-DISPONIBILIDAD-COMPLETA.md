# 🔍 AUDITORÍA COMPLETA - SISTEMA DE CONSULTA DE DISPONIBILIDADES PARA AGENTE IA

**Fecha:** 15 de Octubre 2025  
**Estado:** 📋 ANÁLISIS PREVIO - NO CODIFICAR  
**Objetivo:** Crear TOOL-7 para consultar disponibilidades desde WhatsApp/VAPI

---

## 📊 RESUMEN EJECUTIVO

### ✅ LO QUE TENEMOS (ACTUAL)

#### 1. **TABLA PRINCIPAL: `availability_slots`**
- ✅ **Existe y funciona perfectamente**
- ✅ **4,550+ slots** generados para 90 días
- ✅ **Multi-tenant** con RLS habilitado
- ✅ **Estados:** `free`, `reserved`, `blocked`
- ✅ **Mantenimiento automático diario** (pg_cron a las 4 AM)

**Estructura:**
```sql
availability_slots
├── id (UUID)
├── restaurant_id (UUID) ← FILTRO OBLIGATORIO
├── slot_date (DATE) ← Fecha del slot
├── start_time (TIME) ← Hora inicio
├── end_time (TIME) ← Hora fin
├── table_id (UUID) ← FK a tables
├── shift_name (TEXT) ← "Comida", "Cena", etc.
├── status (TEXT) ← 'free', 'reserved', 'blocked'
├── duration_minutes (INT) ← Duración (default: 90)
├── metadata (JSONB)
└── created_at, updated_at
```

**Índices:**
```sql
idx_availability_slots_restaurant_date (restaurant_id, slot_date)
idx_availability_slots_status (status)
idx_availability_slots_table (table_id)
```

#### 2. **TABLAS DE SOPORTE**

**`tables`** - Mesas del restaurante
```sql
tables
├── id (UUID)
├── restaurant_id (UUID)
├── table_number (TEXT)
├── capacity (INT) ← Capacidad personas
├── zone (VARCHAR) ← 'terraza', 'interior', etc.
├── is_active (BOOLEAN)
└── location (TEXT)
```

**`restaurant_operating_hours`** - Horarios semanales
```sql
restaurant_operating_hours
├── restaurant_id (UUID)
├── day_of_week (INT) ← 0=domingo, 6=sábado
├── is_closed (BOOLEAN)
└── shifts (JSONB) ← Array de turnos
```

**`special_events`** - Días especiales (festivos, cierres)
```sql
special_events
├── restaurant_id (UUID)
├── event_date (DATE)
├── is_closed (BOOLEAN)
├── event_type (TEXT) ← 'holiday', 'closure', etc.
└── description (TEXT)
```

#### 3. **SERVICIOS EXISTENTES**

**`AvailabilityService.js`** (Frontend)
- ✅ `checkAvailability()` - Verifica disponibilidad para fecha/hora
- ✅ `getAvailabilitySlots()` - Obtiene slots de un día
- ✅ `getAvailableTimeSlots()` - Horarios agrupados por turno
- ✅ `validateBookingTime()` - Valida restricciones

**`ConflictDetectionService.js`**
- ✅ `validateReservationAvailability()` - Valida conflictos

**`ReservationValidationService.js`**
- ✅ `getAvailableTables()` - Mesas disponibles sin depender de slots

#### 4. **FUNCIONES SQL (RPC)**

**Verificadas en código:**
- ✅ `check_availability(p_restaurant_id, p_date, p_time, p_party_size, p_duration_minutes)`
- ✅ `generate_availability_slots_simple(p_restaurant_id, p_start_date, p_end_date)`
- ✅ `get_unique_slot_dates(p_restaurant_id, p_from_date)`

---

## 🎯 LO QUE NECESITAMOS CREAR

### **TOOL-7: Consultar Disponibilidad**

#### **Entrada (desde Agente IA):**
```json
{
  "reserva_fecha": "2025-10-16",
  "reserva_hora": "20:00",
  "reserva_invitados": 4,
  "reserva_ubicacion": "terraza" // OPCIONAL
}
```

#### **Proceso:**
1. ✅ **Slot Exacto Disponible** → Respuesta afirmativa
2. ❌ **Slot Exacto Ocupado** → Buscar alternativas del mismo día
3. ❌ **Sin alternativas** → Sugerir otro día

#### **Salida:**
```json
{
  "disponible": true/false,
  "mensaje": "Hay disponibilidad para...",
  "alternativas": ["20:30", "21:00", "21:30"], // Si aplica
  "sugerencia": "otro_dia" // Si no hay nada
}
```

---

## 🔍 ANÁLISIS DE DATOS REALES

### **¿QUÉ DATOS NECESITAMOS?**

#### 1. **FILTROS OBLIGATORIOS**
- ✅ `restaurant_id` (UUID) ← Del contexto del agente
- ✅ `reserva_fecha` (DATE) ← Del mensaje del cliente
- ✅ `reserva_hora` (TIME) ← Del mensaje del cliente
- ✅ `reserva_invitados` (INT) ← Del mensaje del cliente

#### 2. **FILTROS OPCIONALES**
- 🔶 `reserva_ubicacion` (TEXT) ← "terraza", "interior", etc.
  - **SI SE PROPORCIONA:** Filtrar por `tables.zone`
  - **SI NO:** Buscar en todas las zonas

#### 3. **CAMPOS A CONSULTAR**
```sql
SELECT 
  a.id,
  a.slot_date,
  a.start_time,
  a.end_time,
  a.status,
  a.shift_name,
  t.id as table_id,
  t.table_number,
  t.capacity,
  t.zone,
  t.location
FROM availability_slots a
INNER JOIN tables t ON a.table_id = t.id
WHERE 
  a.restaurant_id = :restaurant_id
  AND a.slot_date = :fecha
  AND a.start_time = :hora
  AND a.status = 'free'
  AND t.is_active = true
  AND t.capacity >= :party_size
  AND (:zona IS NULL OR t.zone ILIKE :zona)
ORDER BY a.start_time ASC
```

---

## 🧩 LÓGICA DEL WORKFLOW

### **PASO 1: Validar Input**
```javascript
// Verificar campos requeridos
const required = ['reserva_fecha', 'reserva_hora', 'reserva_invitados'];
const missing = required.filter(f => !input[f]);
if (missing.length > 0) {
  throw new Error(`Campos faltantes: ${missing.join(', ')}`);
}

// Normalizar fecha (YYYY-MM-DD)
const fecha = normalizeDate(input.reserva_fecha);

// Normalizar hora (HH:MM)
const hora = normalizeTime(input.reserva_hora);

// Parsear invitados
const invitados = parseInt(input.reserva_invitados, 10);
```

### **PASO 2: Buscar Slot Exacto**
```javascript
// Query a Supabase
const { data: slotsExactos, error } = await $supabase
  .from('availability_slots')
  .select(`
    id,
    slot_date,
    start_time,
    end_time,
    status,
    shift_name,
    tables!inner (
      id,
      table_number,
      capacity,
      zone,
      location,
      is_active
    )
  `)
  .eq('restaurant_id', restaurant_id)
  .eq('slot_date', fecha)
  .eq('start_time', hora)
  .eq('status', 'free')
  .eq('tables.is_active', true)
  .gte('tables.capacity', invitados);

// Si hay zona específica, filtrar
if (input.reserva_ubicacion) {
  query = query.ilike('tables.zone', `%${input.reserva_ubicacion}%`);
}

if (error) throw error;
```

### **PASO 3: Evaluar Resultado**

#### **CASO A: Slot Exacto Disponible**
```javascript
if (slotsExactos && slotsExactos.length > 0) {
  return {
    disponible: true,
    mensaje: `Perfecto! Tenemos disponibilidad para ${invitados} personas el ${fecha} a las ${hora}.`,
    detalles: {
      fecha: fecha,
      hora: hora,
      personas: invitados,
      mesas_disponibles: slotsExactos.length,
      zona: slotsExactos[0].tables.zone
    }
  };
}
```

#### **CASO B: Slot Ocupado → Buscar Alternativas**
```javascript
// Buscar otros horarios del mismo día
const { data: alternativas, error: altError } = await $supabase
  .from('availability_slots')
  .select(`
    start_time,
    tables!inner (capacity, zone, is_active)
  `)
  .eq('restaurant_id', restaurant_id)
  .eq('slot_date', fecha)
  .eq('status', 'free')
  .eq('tables.is_active', true)
  .gte('tables.capacity', invitados);

if (input.reserva_ubicacion) {
  query = query.ilike('tables.zone', `%${input.reserva_ubicacion}%`);
}

if (error) throw error;

// Agrupar por hora y devolver horarios únicos
const horasDisponibles = [...new Set(alternativas.map(a => a.start_time))].sort();

if (horasDisponibles.length > 0) {
  return {
    disponible: false,
    mensaje: `Lo siento, no hay disponibilidad a las ${hora}. Te ofrezco estas alternativas para el ${fecha}:`,
    alternativas: horasDisponibles.slice(0, 5), // Máximo 5 opciones
    detalles: {
      fecha: fecha,
      hora_solicitada: hora,
      personas: invitados
    }
  };
}
```

#### **CASO C: Sin Disponibilidad en el Día**
```javascript
return {
  disponible: false,
  mensaje: `Lo siento, no tenemos disponibilidad para ${invitados} personas el ${fecha}. ¿Te gustaría que busque para otro día?`,
  sugerencia: 'otro_dia',
  detalles: {
    fecha_solicitada: fecha,
    personas: invitados
  }
};
```

---

## 🛡️ VALIDACIONES Y MANEJO DE ERRORES

### **1. Validación de Fecha**
```javascript
// ✅ Verificar formato
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
  throw new Error('Formato de fecha inválido. Usar YYYY-MM-DD');
}

// ✅ Verificar que no sea pasado
const hoy = new Date().toISOString().split('T')[0];
if (fecha < hoy) {
  throw new Error('No se puede reservar en fechas pasadas');
}

// ✅ Verificar antelación máxima (90 días)
const maxDate = new Date();
maxDate.setDate(maxDate.getDate() + 90);
const maxDateStr = maxDate.toISOString().split('T')[0];
if (fecha > maxDateStr) {
  throw new Error('No se puede reservar con más de 90 días de antelación');
}
```

### **2. Validación de Hora**
```javascript
// ✅ Verificar formato HH:MM
if (!/^\d{2}:\d{2}$/.test(hora)) {
  throw new Error('Formato de hora inválido. Usar HH:MM');
}

// ✅ Verificar rango válido
const [hh, mm] = hora.split(':').map(Number);
if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
  throw new Error('Hora fuera de rango válido');
}
```

### **3. Validación de Party Size**
```javascript
// ✅ Verificar rango
if (invitados < 1 || invitados > 12) {
  throw new Error('Número de invitados debe estar entre 1 y 12');
}
```

### **4. Manejo de Errores de Supabase**
```javascript
try {
  const { data, error } = await $supabase...;
  
  if (error) {
    console.error('❌ Error Supabase:', error);
    throw new Error(`Error consultando disponibilidad: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️ Sin resultados para:', { restaurant_id, fecha, hora });
  }
  
} catch (err) {
  console.error('❌ Excepción:', err);
  return {
    disponible: false,
    error: true,
    mensaje: 'Error al consultar disponibilidad. Por favor intenta de nuevo.',
    detalles: {
      error_message: err.message
    }
  };
}
```

---

## 🔗 INTEGRACIÓN CON SUPER AGENT

### **Llamada desde Workflow 3:**
```javascript
// En el nodo de herramientas, cuando GPT-4o llama a "consultar_disponibilidad"
const toolResult = await $execution.executeWorkflow('TOOL-7-consultar-disponibilidad', {
  restaurant_id: $json.restaurant_id,
  reserva_fecha: toolCall.arguments.fecha,
  reserva_hora: toolCall.arguments.hora,
  reserva_invitados: toolCall.arguments.invitados,
  reserva_ubicacion: toolCall.arguments.ubicacion || null
});
```

### **Respuesta al Agente:**
```json
{
  "toolCallId": "call_abc123",
  "result": {
    "disponible": true,
    "mensaje": "Perfecto! Tenemos disponibilidad...",
    "alternativas": [...],
    "detalles": {...}
  }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **ANTES DE CREAR EL WORKFLOW:**
- [x] ✅ Verificar estructura de `availability_slots` en Supabase
- [x] ✅ Verificar estructura de `tables` en Supabase
- [x] ✅ Confirmar que existen datos reales (4,550+ slots)
- [x] ✅ Revisar `AvailabilityService.js` para entender lógica frontend
- [x] ✅ Revisar funciones SQL existentes
- [x] ✅ Confirmar multi-tenant (filtro por `restaurant_id`)

### **AL CREAR EL WORKFLOW:**
- [ ] 🔶 **NODO 1:** Webhook/Trigger para recibir input
- [ ] 🔶 **NODO 2:** Validar y normalizar input
- [ ] 🔶 **NODO 3:** Buscar slot exacto (Supabase Node)
- [ ] 🔶 **NODO 4:** IF - ¿Slot disponible?
  - [ ] → **TRUE:** Formatear respuesta positiva
  - [ ] → **FALSE:** Buscar alternativas
- [ ] 🔶 **NODO 5:** Buscar alternativas del mismo día
- [ ] 🔶 **NODO 6:** IF - ¿Hay alternativas?
  - [ ] → **TRUE:** Formatear respuesta con alternativas
  - [ ] → **FALSE:** Respuesta "sin disponibilidad"
- [ ] 🔶 **NODO 7:** Respond to Workflow (return result)

### **AL PROBAR:**
- [ ] ⚠️ Probar con slot exacto disponible
- [ ] ⚠️ Probar con slot ocupado → alternativas
- [ ] ⚠️ Probar sin disponibilidad en el día
- [ ] ⚠️ Probar con zona específica (terraza/interior)
- [ ] ⚠️ Probar con fecha pasada (debe fallar)
- [ ] ⚠️ Probar con fecha futura > 90 días (debe fallar)
- [ ] ⚠️ Probar con party_size > capacidad máxima mesa

---

## 🚨 REGLAS DE ORO APLICADAS

### **NORMA 1: Ajustes Quirúrgicos**
✅ **NO** vamos a modificar la estructura existente  
✅ **NO** vamos a simplificar el sistema de disponibilidades  
✅ **SÍ** vamos a crear una herramienta que USE el sistema existente

### **NORMA 2: Datos Reales**
✅ **TODOS** los datos vienen de `availability_slots`  
✅ **CERO** hardcoding de valores  
✅ **CERO** datos ficticios o moqueados

### **NORMA 3: Multi-Tenant**
✅ **SIEMPRE** filtrar por `restaurant_id`  
✅ **NUNCA** hardcodear restaurant_id  
✅ Funciona para **TODOS** los restaurantes

### **NORMA 4: Revisar Supabase Antes**
✅ **CONFIRMADO:** `availability_slots` existe  
✅ **CONFIRMADO:** `tables` existe  
✅ **CONFIRMADO:** Índices correctos  
✅ **CONFIRMADO:** Datos reales (4,550+ slots)

---

## 💡 RECOMENDACIONES

### **1. Usar Supabase Node vs. Code Node**
- ✅ **Preferir Supabase Node** para queries simples (mejor performance, más legible)
- ⚠️ **Code Node solo** si necesitas lógica compleja de transformación

### **2. Estructura del Workflow**
```
[Webhook] 
  → [Validar Input]
  → [Buscar Slot Exacto (Supabase)]
  → [IF: ¿Disponible?]
      ├─ TRUE → [Respuesta Positiva]
      └─ FALSE → [Buscar Alternativas (Supabase)]
          → [IF: ¿Hay Alternativas?]
              ├─ TRUE → [Respuesta con Alternativas]
              └─ FALSE → [Respuesta "Otro Día"]
```

### **3. Optimizaciones**
- ✅ Usar `LIMIT 1` cuando solo necesites saber si existe disponibilidad
- ✅ Usar `SELECT DISTINCT start_time` para alternativas (evita duplicados)
- ✅ Ordenar por `start_time ASC` (horarios cronológicos)
- ✅ Limitar alternativas a 5 máximo (no abrumar al cliente)

### **4. Mensajes al Cliente**
```javascript
// ✅ BIEN: Claro y accionable
"Perfecto! Tenemos disponibilidad para 4 personas el viernes 16 a las 20:00."

// ✅ BIEN: Alternativas claras
"Lo siento, no hay mesa a las 20:00. Te ofrezco estas opciones para el mismo día: 20:30, 21:00, 21:30."

// ✅ BIEN: Sin disponibilidad
"Lo siento, no tenemos disponibilidad para 4 personas el viernes 16. ¿Te gustaría que busque para otro día?"

// ❌ MAL: Vago
"No disponible"

// ❌ MAL: Técnico
"Error: No se encontraron slots libres en availability_slots"
```

---

## 📊 DATOS DE EJEMPLO (PRODUCCIÓN ACTUAL)

### **Caso 1: Slot Exacto Disponible**
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "reserva_fecha": "2025-10-18",
  "reserva_hora": "20:00",
  "reserva_invitados": 4
}
```
**Resultado esperado:** ✅ Disponibilidad confirmada

### **Caso 2: Slot Ocupado → Alternativas**
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "reserva_fecha": "2025-10-18",
  "reserva_hora": "20:00",
  "reserva_invitados": 4
}
```
**Resultado esperado:** ⚠️ Alternativas (20:30, 21:00, 21:30)

### **Caso 3: Sin Disponibilidad**
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "reserva_fecha": "2025-12-31",
  "reserva_hora": "21:00",
  "reserva_invitados": 10
}
```
**Resultado esperado:** ❌ Sugerir otro día

---

## ✅ CONCLUSIÓN

### **RESUMEN:**
1. ✅ **Sistema de disponibilidades completo** ya existe
2. ✅ **Datos reales** (4,550+ slots) en producción
3. ✅ **Tablas correctas** (`availability_slots`, `tables`)
4. ✅ **Multi-tenant** con RLS habilitado
5. ✅ **Servicios frontend** para referencia

### **PRÓXIMO PASO:**
🚀 **CREAR WORKFLOW TOOL-7** siguiendo esta documentación

### **TIEMPO ESTIMADO:**
⏱️ **2-3 horas** para implementación completa y testing

---

**Última actualización:** 15 de Octubre 2025  
**Estado:** ✅ AUDITORÍA COMPLETA  
**Listo para:** 🚀 IMPLEMENTACIÓN



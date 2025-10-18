# 📋 ANÁLISIS: TOOL CREATE RESERVATION

**Fecha:** 17 Octubre 2025  
**Estado:** 📖 ANÁLISIS PREVIO (NO CODIFICADO AÚN)

---

## 🎯 OBJETIVO

Crear una N8N tool para que el Super Agent pueda crear reservas directamente en la base de datos después de:
1. ✅ Verificar disponibilidad con `check_availability`
2. ✅ Informar al cliente sobre disponibilidad
3. ✅ Preguntar por notas especiales
4. ✅ **Confirmar con el cliente: "¿Confirmo la reserva entonces?"**
5. ✅ **SOLO SI el cliente confirma → Llamar a `create_reservation`**

---

## 📚 LECTURA DE DOCUMENTACIÓN

### ✅ **1. CHECKLIST_OBLIGATORIO.md**
- [ ] ¿Todos los datos vienen de BD? → **SÍ** (del prompt + check_availability)
- [ ] ¿He consultado las tablas reales? → **SÍ** (reservations, customers, availability_slots, tables)
- [ ] ¿Existe la función/RPC que voy a usar? → **NO EXISTE** (hay que crear INSERT directo)
- [ ] ¿Hay manejo de errores? → **Pendiente de implementar**
- [ ] ¿Funciona multi-tenant? → **SÍ** (restaurant_id obligatorio)

### ✅ **2. REGLA_SAGRADA_RESERVAS.md**
- ✅ **Protección absoluta:** NUNCA eliminar reservas automáticamente
- ✅ **Única eliminación autorizada:** Desde `Reservas.jsx` con confirmación
- ✅ **Esta tool solo CREA, no elimina**

### ✅ **3. DATABASE-SCHEMA-SUPABASE-COMPLETO.md**

#### **Tabla: `reservations` (líneas 869-903)**

| Columna | Tipo | NULL | Default | Obligatorio | Descripción |
|---------|------|------|---------|-------------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | AUTO | PK |
| `restaurant_id` | uuid | NO | - | **✅ SÍ** | FK → restaurants |
| `customer_id` | uuid | YES | - | ⚠️ NO | FK → customers (nullable) |
| `customer_name` | varchar | NO | - | **✅ SÍ** | Nombre cliente |
| `customer_email` | varchar | YES | - | ⚠️ NO | Email cliente |
| `customer_phone` | varchar | YES | - | ⚠️ NO | Teléfono cliente |
| `reservation_date` | date | NO | - | **✅ SÍ** | Fecha reserva |
| `reservation_time` | time | NO | - | **✅ SÍ** | Hora reserva |
| `party_size` | int | NO | - | **✅ SÍ** | Número personas |
| `status` | varchar | YES | `'confirmed'` | ⚠️ NO | confirmed, cancelled, completed, no_show |
| `table_id` | uuid | YES | - | ⚠️ NO | FK → tables |
| `special_requests` | text | YES | - | ⚠️ NO | Solicitudes especiales |
| `reservation_channel` | varchar | YES | `'web'` | ⚠️ NO | Canal reserva |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | AUTO | Fecha creación |
| `updated_at` | timestamptz | NO | `timezone('utc', now())` | AUTO | Fecha actualización |

#### **Tabla: `customers` (líneas 582-639)**

| Columna | Tipo | NULL | Default | Obligatorio | Descripción |
|---------|------|------|---------|-------------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | AUTO | PK |
| `restaurant_id` | uuid | NO | - | **✅ SÍ** | FK → restaurants |
| `name` | varchar | NO | - | **✅ SÍ** | Nombre completo |
| `email` | varchar | YES | - | ⚠️ NO | Email |
| `phone` | varchar | YES | - | **✅ SÍ** | Teléfono |
| `created_at` | timestamptz | NO | `timezone('utc', now())` | AUTO | Fecha creación |

#### **Tabla: `availability_slots` (líneas 280-305)**

| Columna | Tipo | NULL | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK → restaurants |
| `slot_date` | date | NO | - | Fecha del slot |
| `start_time` | time | NO | - | Hora inicio |
| `table_id` | uuid | NO | - | FK → tables |
| `status` | text | NO | `'free'` | **free, reserved, blocked** |
| `zone` | varchar | YES | - | **Zona (interior, terraza, etc.)** |

#### **Tabla: `tables` (líneas 1097-1118)**

| Columna | Tipo | NULL | Default | Descripción |
|---------|------|------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `restaurant_id` | uuid | NO | - | FK → restaurants |
| `table_number` | text | NO | - | Número mesa |
| `name` | varchar | YES | - | Nombre mesa |
| `capacity` | int | NO | - | Capacidad personas |
| `zone` | varchar | YES | `'main'` | Zona |

---

## 🔍 ANÁLISIS DE DATOS NECESARIOS

### **DATOS QUE VIENEN DEL PROMPT DEL SUPER AGENT:**

```javascript
{
  "customer_name": "{{ $json.customer_name }}", // Ya disponible
  "customer_phone": "{{ $json.customer_phone }}", // Ya disponible
  "restaurant_id": "{{ $json.restaurant_id }}", // Ya disponible
}
```

### **DATOS QUE PROPORCIONA EL AGENTE EN LA TOOL CALL:**

```json
{
  "reservation_date": "2025-10-22",  // YYYY-MM-DD
  "reservation_time": "21:30",       // HH:MM
  "party_size": 4,                    // Integer
  "preferred_zone": "interior",       // string (opcional)
  "special_requests": "Es un cumpleaños" // string (opcional)
}
```

### **DATOS QUE DEBEMOS OBTENER DE LA BD:**

1. ✅ **`customer_id`** → Buscar en `customers` por `phone` + `restaurant_id`
   - Si NO existe → Crear cliente
   - Si existe → Usar su `id`

2. ✅ **`table_id`** → Obtener de `check_availability`
   - La tool `check_availability` ya devuelve mesas disponibles
   - Usar la "mejor_opcion" (menor capacidad que cumpla requisitos)

3. ✅ **`zone`** → De la `table_id` seleccionada

---

## 🛠️ FLUJO LÓGICO DE LA TOOL

### **PASO 1: VALIDAR INPUT**

```javascript
const input = $input.first().json;

// Validaciones obligatorias
if (!input.reservation_date || !input.reservation_time || !input.party_size || !input.restaurant_id) {
  throw new Error('Faltan parámetros obligatorios');
}

// Validar formatos
if (!/^\d{4}-\d{2}-\d{2}$/.test(input.reservation_date)) {
  throw new Error('Formato de fecha inválido (se requiere YYYY-MM-DD)');
}

if (!/^\d{2}:\d{2}$/.test(input.reservation_time)) {
  throw new Error('Formato de hora inválido (se requiere HH:MM)');
}
```

### **PASO 2: BUSCAR O CREAR CLIENTE**

**Consulta Supabase:**
```sql
SELECT id, name, phone
FROM customers
WHERE restaurant_id = 'xxx'
  AND phone = '+34612345678'
LIMIT 1;
```

**Si NO existe:**
```sql
INSERT INTO customers (restaurant_id, name, phone, created_at, updated_at)
VALUES ('xxx', 'Gustau', '+34612345678', NOW(), NOW())
RETURNING id;
```

### **PASO 3: BUSCAR MESA DISPONIBLE**

**Opción A: Si el agente ya llamó a `check_availability`**
- Usar la `mejor_opcion.table_id` que devolvió `check_availability`

**Opción B: Si necesitamos buscar de nuevo (por seguridad)**
```sql
SELECT id, table_name, capacity, zone
FROM availability_slots
WHERE restaurant_id = 'xxx'
  AND slot_date = '2025-10-22'
  AND start_time = '21:30'
  AND status = 'free'
  AND capacity >= 4
  AND (zone = 'interior' OR zone IS NULL)
ORDER BY capacity ASC
LIMIT 1;
```

### **PASO 4: CREAR RESERVA**

```sql
INSERT INTO reservations (
  restaurant_id,
  customer_id,
  customer_name,
  customer_phone,
  reservation_date,
  reservation_time,
  party_size,
  table_id,
  status,
  special_requests,
  reservation_channel,
  created_at,
  updated_at
) VALUES (
  'restaurant_id',
  'customer_id',
  'Gustau',
  '+34612345678',
  '2025-10-22',
  '21:30',
  4,
  'table_id',
  'confirmed',
  'Es un cumpleaños',
  'whatsapp',
  NOW(),
  NOW()
)
RETURNING id, reservation_date, reservation_time, customer_name, table_id;
```

### **PASO 5: ACTUALIZAR AVAILABILITY_SLOT**

```sql
UPDATE availability_slots
SET 
  status = 'reserved',
  is_available = false,
  updated_at = NOW()
WHERE restaurant_id = 'xxx'
  AND slot_date = '2025-10-22'
  AND start_time = '21:30'
  AND table_id = 'table_id';
```

---

## ⚠️ CASOS EDGE Y MANEJO DE ERRORES

### **1. Cliente ya existe**
✅ **Solución:** Usar `ON CONFLICT DO NOTHING` o buscar primero

### **2. No hay mesa disponible**
❌ **Error:** "No hay mesas disponibles para esa fecha/hora"
✅ **Solución:** El agente ya llamó a `check_availability` ANTES, esto no debería pasar

### **3. Slot ya reservado (race condition)**
❌ **Error:** "El slot ya fue reservado por otro cliente"
✅ **Solución:** Transacción atómica + manejo de error graceful

### **4. Zona solicitada no disponible**
✅ **Solución:** Ya se manejó en `check_availability`

### **5. Datos del cliente incompletos**
⚠️ **Teléfono:** Obligatorio
⚠️ **Nombre:** Obligatorio
⚠️ **Email:** Opcional

---

## 📋 CHECKLIST FINAL ANTES DE CODIFICAR

### **DATOS REALES (NORMA 2)**
- [x] `restaurant_id` → Viene del prompt
- [x] `customer_name` → Viene del prompt
- [x] `customer_phone` → Viene del prompt
- [x] `reservation_date` → Viene del agente (validado)
- [x] `reservation_time` → Viene del agente (validado)
- [x] `party_size` → Viene del agente
- [x] `customer_id` → Buscar en `customers` o crear
- [x] `table_id` → Buscar en `availability_slots`

### **VERIFICACIÓN DE ESQUEMA (NORMA 4)**
- [x] Tabla `reservations` existe → **SÍ** (línea 869)
- [x] Tabla `customers` existe → **SÍ** (línea 582)
- [x] Tabla `availability_slots` existe → **SÍ** (línea 280)
- [x] Columnas verificadas → **SÍ** (todas documentadas)

### **MULTI-TENANT (NORMA 3)**
- [x] Filtrar SIEMPRE por `restaurant_id` → **SÍ**
- [x] NO hardcodear `restaurant_id` → **SÍ**

### **PROTECCIÓN DE RESERVAS**
- [x] SOLO crear, NO eliminar → **SÍ**
- [x] Actualizar slot a `reserved` → **SÍ**

---

## 🎯 DECISIONES ARQUITECTÓNICAS

### **1. ¿Crear cliente automáticamente?**
✅ **SÍ** - Si no existe, crearlo con los datos disponibles (name, phone)

### **2. ¿Validar disponibilidad de nuevo?**
✅ **SÍ** - Por seguridad, verificar que el slot sigue `free` antes de reservar

### **3. ¿Qué `status` inicial?**
✅ **`confirmed`** - Por defecto (el agente ya confirmó con el cliente)

### **4. ¿Qué `reservation_channel`?**
✅ **`whatsapp`** - Viene del contexto del agente

### **5. ¿Transacción atómica?**
✅ **SÍ** - Usar transacción para: crear cliente + crear reserva + actualizar slot

---

## 📝 SIGUIENTE PASO

**CREAR EL WORKFLOW N8N:**
1. Nodo "Validate Input"
2. Nodo "Get or Create Customer" (Supabase)
3. Nodo "Find Available Table" (Supabase)
4. Nodo "Create Reservation" (Supabase)
5. Nodo "Update Availability Slot" (Supabase)
6. Nodo "Format Response"
7. Manejo de errores en cada paso

---

**Estado:** ✅ Análisis completo  
**Listo para:** Codificación del workflow  
**Fecha:** 17 Octubre 2025



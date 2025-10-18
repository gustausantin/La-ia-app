# 📝 TOOL: Create Reservation

**Archivo:** `TOOL-create-reservation-COMPLETO.json`  
**Fecha:** 17 Octubre 2025  
**Estado:** ✅ Listo para importar

---

## 🎯 PROPÓSITO

Tool para que el **Super Agent** pueda crear reservas en la base de datos después de:
1. ✅ Verificar disponibilidad
2. ✅ Informar al cliente
3. ✅ Preguntar por notas especiales
4. ✅ **Obtener confirmación explícita del cliente**

---

## 📊 DIAGRAMA DE FLUJO

```
Start
  ↓
🔍 Validar Input (formatos, campos obligatorios)
  ↓
🔎 Buscar Cliente (por phone + restaurant_id)
  ↓
❓ ¿Cliente Existe?
  ├─ SÍ → 📦 Preparar Datos
  └─ NO → ➕ Crear Cliente → 📦 Preparar Datos
           ↓
    🔍 Buscar Mesa Disponible (slot libre + capacity)
           ↓
    ❓ ¿Mesa Disponible?
      ├─ SÍ → ✅ Crear Reserva → 🔒 Actualizar Slot → 🎉 Éxito
      └─ NO → ❌ Error: No Disponible
```

---

## 📥 INPUT ESPERADO

```json
{
  "reservation_date": "2025-10-22",
  "reservation_time": "21:30",
  "party_size": 4,
  "preferred_zone": "interior",
  "special_requests": "Es un cumpleaños",
  "customer_name": "Gustau",
  "customer_phone": "+34612345678",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```

### **Campos Obligatorios:**
- ✅ `reservation_date` (YYYY-MM-DD)
- ✅ `reservation_time` (HH:MM)
- ✅ `party_size` (1-20)
- ✅ `customer_name`
- ✅ `customer_phone`
- ✅ `restaurant_id`

### **Campos Opcionales:**
- ⚠️ `preferred_zone` (interior, terraza, barra, privado)
- ⚠️ `special_requests`

---

## 📤 OUTPUT

### **Éxito:**
```json
{
  "success": true,
  "message": "Reserva creada exitosamente",
  "reservation": {
    "id": "uuid-de-reserva",
    "customer_name": "Gustau",
    "reservation_date": "2025-10-22",
    "reservation_time": "21:30",
    "party_size": 4,
    "table_name": "Interior 1",
    "table_capacity": 4,
    "zone": "interior",
    "special_requests": "Es un cumpleaños",
    "status": "confirmed"
  },
  "formatted_message": "Reserva confirmada para Gustau el miércoles, 22 de octubre a las 21:30 para 4 personas."
}
```

### **Error: No Disponible:**
```json
{
  "success": false,
  "error": "no_availability",
  "message": "No hay mesas disponibles para 4 personas el 2025-10-22 a las 21:30",
  "details": {
    "reservation_date": "2025-10-22",
    "reservation_time": "21:30",
    "party_size": 4,
    "preferred_zone": "interior"
  }
}
```

---

## 🔧 NODOS EXPLICADOS

### **1. 🔍 Validar Input**
**Tipo:** Code  
**Función:**
- Verificar campos obligatorios
- Validar formato fecha (YYYY-MM-DD)
- Validar formato hora (HH:MM)
- Validar party_size (1-20)
- Normalizar zona

### **2. 🔎 Buscar Cliente**
**Tipo:** Supabase (getAll)  
**Query:**
```sql
SELECT * FROM customers
WHERE restaurant_id = 'xxx'
  AND phone = '+34612345678'
LIMIT 1;
```

### **3. ❓ ¿Cliente Existe?**
**Tipo:** IF  
**Condición:** `$input.all().length > 0`

### **4. ➕ Crear Cliente**
**Tipo:** Supabase (insert)  
**Si:** Cliente NO existe  
**Inserta:**
```json
{
  "restaurant_id": "xxx",
  "name": "Gustau",
  "phone": "+34612345678",
  "segment_auto": "nuevo",
  "segment_auto_v2": "nuevo"
}
```

### **5. 📦 Preparar Datos**
**Tipo:** Code  
**Función:**
- Unificar datos de validación
- Agregar `customer_id` (del nodo anterior)

### **6. 🔍 Buscar Mesa Disponible**
**Tipo:** Supabase (getAll)  
**Query:**
```sql
SELECT * FROM availability_slots
WHERE restaurant_id = 'xxx'
  AND slot_date = '2025-10-22'
  AND start_time = '21:30'
  AND status = 'free'
  AND is_available = true
  AND capacity >= 4
ORDER BY capacity ASC
LIMIT 1;
```

**Lógica:**
- ✅ Busca slot libre
- ✅ Con capacidad suficiente
- ✅ Ordena por capacidad (menor primero)
- ✅ Toma el primero (mejor fit)

### **7. ❓ ¿Mesa Disponible?**
**Tipo:** IF  
**Condición:** `$input.all().length > 0`

### **8. ✅ Crear Reserva**
**Tipo:** Supabase (insert)  
**Si:** Mesa disponible  
**Inserta en `reservations`:**
```json
{
  "restaurant_id": "xxx",
  "customer_id": "xxx",
  "customer_name": "Gustau",
  "customer_phone": "+34612345678",
  "reservation_date": "2025-10-22",
  "reservation_time": "21:30",
  "party_size": 4,
  "table_id": "xxx",
  "status": "confirmed",
  "special_requests": "Es un cumpleaños",
  "reservation_channel": "whatsapp"
}
```

### **9. 🔒 Actualizar Slot**
**Tipo:** Supabase (update)  
**Actualiza `availability_slots`:**
```json
{
  "status": "reserved",
  "is_available": false
}
```

### **10. 🎉 Respuesta Exitosa**
**Tipo:** Code  
**Función:**
- Formatear respuesta final
- Incluir todos los detalles de la reserva
- Mensaje human-readable

### **11. ❌ Error: No Disponible**
**Tipo:** Code  
**Si:** No hay mesa disponible  
**Función:**
- Devolver error estructurado
- Incluir detalles de la búsqueda

---

## 🛡️ PROTECCIONES IMPLEMENTADAS

### **1. Validación Robusta**
✅ Formatos de fecha/hora  
✅ Rangos numéricos (party_size)  
✅ Campos obligatorios  
✅ Normalización de zona

### **2. Race Conditions**
✅ Buscar mesa disponible JUSTO antes de reservar  
✅ Si alguien reservó entre tanto → Error "no_availability"

### **3. Multi-Tenant**
✅ Filtrar SIEMPRE por `restaurant_id`  
✅ Cliente y reserva vinculados al restaurante correcto

### **4. Integridad de Datos**
✅ Crear cliente si no existe  
✅ Actualizar slot a `reserved` automáticamente  
✅ Canal = `whatsapp` por defecto

---

## 🧪 TESTING

### **Test 1: Cliente Nuevo + Reserva Exitosa**

**Input:**
```json
{
  "reservation_date": "2025-10-22",
  "reservation_time": "21:30",
  "party_size": 4,
  "preferred_zone": "interior",
  "special_requests": "Es un cumpleaños",
  "customer_name": "Juan Pérez",
  "customer_phone": "+34600111222",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```

**Resultado esperado:**
- ✅ Cliente creado
- ✅ Mesa encontrada
- ✅ Reserva creada
- ✅ Slot actualizado a `reserved`

### **Test 2: Cliente Existente + Reserva Exitosa**

**Input:**
```json
{
  "reservation_date": "2025-10-23",
  "reservation_time": "20:00",
  "party_size": 2,
  "customer_name": "Gustau",
  "customer_phone": "+34612345678",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```

**Resultado esperado:**
- ✅ Cliente encontrado (no se crea)
- ✅ Mesa encontrada
- ✅ Reserva creada
- ✅ Slot actualizado

### **Test 3: Sin Disponibilidad**

**Input:**
```json
{
  "reservation_date": "2025-12-31",
  "reservation_time": "23:00",
  "party_size": 20,
  "customer_name": "Test",
  "customer_phone": "+34600000000",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```

**Resultado esperado:**
- ✅ Error: `no_availability`
- ✅ Mensaje claro al agente

---

## 🔗 INTEGRACIÓN CON SUPER AGENT

### **En el prompt v5:**

```
**2. create_reservation** — Crea la reserva
**Uso:** ⚠️ SOLO después de que el cliente CONFIRME EXPLÍCITAMENTE
**Parámetros obligatorios:**
```json
{
  "reservation_date": "2025-10-19",
  "reservation_time": "20:00",
  "party_size": 4,
  "preferred_zone": "terraza",
  "special_requests": "",
  "restaurant_id": "{{ $json.restaurant_id }}"
}
```

**Nota:** 
- `customer_name` y `customer_phone` se toman del contexto
- `preferred_zone` es opcional
```

---

## ⚠️ CONSIDERACIONES

### **1. NO usar si no hay confirmación del cliente**
❌ **MAL:**
```
Agente: "Sí tenemos disponibilidad"
Agente: → Llama create_reservation ❌
```

✅ **BIEN:**
```
Agente: "Sí tenemos disponibilidad. ¿Alguna petición especial?"
Cliente: "Sí, es un cumpleaños"
Agente: "Perfecto. ¿Confirmo la reserva entonces?"
Cliente: "Sí, por favor"
Agente: → Llama create_reservation ✅
```

### **2. Siempre verificar disponibilidad primero**
✅ Flujo correcto:
1. `check_availability` (verificar)
2. Informar al cliente
3. Preguntar notas
4. Confirmar
5. `create_reservation` (crear)

### **3. Zona opcional**
- Si el cliente NO especificó zona → `preferred_zone: null`
- La tool buscará en cualquier zona

---

## 📋 CHECKLIST DE IMPORTACIÓN

- [ ] Importar `TOOL-create-reservation-COMPLETO.json` en N8N
- [ ] Verificar credenciales Supabase
- [ ] Probar con datos de test
- [ ] Verificar que crea cliente
- [ ] Verificar que actualiza slot
- [ ] Verificar error cuando no hay disponibilidad
- [ ] Actualizar prompt del Super Agent

---

## 🎉 RESULTADO FINAL

✅ **Tool robusta** que crea reservas de forma segura  
✅ **Multi-tenant** respetado  
✅ **Manejo de errores** completo  
✅ **Cliente auto-creado** si no existe  
✅ **Slot actualizado** automáticamente  
✅ **Respuestas claras** para el agente  

---

**Creado por:** La-IA App Team  
**Fecha:** 17 Octubre 2025  
**Estado:** ✅ Listo para producción



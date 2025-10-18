# 🔧 TOOL: modify_reservation — Documentación Completa

## 📋 DESCRIPCIÓN

Workflow N8N que modifica una reserva existente. Puede cambiar fecha, hora, número de personas o peticiones especiales. Gestiona automáticamente la liberación del slot antiguo y la reserva del nuevo slot.

---

## 🎯 CASOS DE USO

1. **Cambio de fecha/hora:** Cliente quiere mover su reserva a otro día u hora
2. **Cambio de personas:** Cliente aumenta o reduce el número de comensales
3. **Actualizar peticiones especiales:** Añadir o modificar notas (cumpleaños, alergias, etc.)
4. **Combinación:** Cambiar múltiples parámetros a la vez

---

## 📥 PARÁMETROS DE ENTRADA

### Obligatorios:
```json
{
  "reservation_id": "uuid",        // ID de la reserva a modificar
  "restaurant_id": "uuid"          // ID del restaurante
}
```

### Opcionales (al menos UNO requerido):
```json
{
  "new_date": "YYYY-MM-DD",        // Nueva fecha
  "new_time": "HH:MM",             // Nueva hora
  "new_party_size": 4,             // Nuevo número de personas
  "preferred_zone": "interior",    // Zona preferida (si cambia fecha/hora)
  "special_requests": "texto"      // Nuevas peticiones especiales
}
```

---

## 📤 RESPUESTA

### Éxito (con cambio de slot):
```json
{
  "success": true,
  "reservation_id": "uuid",
  "message": "¡Listo, Gustau! Tu reserva ha sido modificada. Nueva fecha: 2025-10-25 a las 21:00 para 6 personas. Mesa: Terraza 1 (Terraza).",
  "details": {
    "reservation_id": "uuid",
    "changes": "fecha: 2025-10-22 → 2025-10-25, hora: 20:00 → 21:00, personas: 4 → 6",
    "new_date": "2025-10-25",
    "new_time": "21:00",
    "new_party_size": 6,
    "new_table": "Terraza 1",
    "new_zone": "Terraza",
    "customer_name": "Gustau"
  }
}
```

### Éxito (sin cambio de slot):
```json
{
  "success": true,
  "reservation_id": "uuid",
  "message": "¡Listo, Gustau! Tu reserva ha sido actualizada. Cambios: personas: 4 → 5. Fecha: 2025-10-22 a las 20:00.",
  "details": {
    "reservation_id": "uuid",
    "changes": "personas: 4 → 5",
    "date": "2025-10-22",
    "time": "20:00",
    "party_size": 5,
    "customer_name": "Gustau"
  }
}
```

### Error (sin disponibilidad):
```json
{
  "success": false,
  "message": "No hay mesas disponibles para 8 personas el 2025-10-25 a las 21:00.",
  "details": {
    "requested_date": "2025-10-25",
    "requested_time": "21:00",
    "requested_party_size": 8
  }
}
```

---

## 🔄 FLUJO DEL WORKFLOW

### Caso 1: Cambio de Fecha/Hora (Requiere Nuevo Slot)

```
1. ▶️ Start
   ↓
2. 🔍 Validar Input
   → Verifica que existan reservation_id + restaurant_id
   → Al menos uno de: new_date, new_time, new_party_size
   ↓
3. 📋 Buscar Reserva Existente
   → SELECT * FROM reservations WHERE id=... AND restaurant_id=...
   → Valida que existe y tiene status válido (pending/confirmed/pending_approval)
   ↓
4. 🔄 Preparar Modificación
   → Compara valores antiguos vs nuevos
   → Detecta si necesita cambiar slot (fecha/hora diferentes)
   → Prepara datos finales
   ↓
5. ❓ ¿Cambia Fecha/Hora? → SÍ
   ↓
6. 🔍 Buscar Nuevo Slot
   → SELECT * FROM availability_slots
   → WHERE slot_date = new_date
   → AND start_time = new_time
   → AND status = 'free'
   → AND is_available = true
   ↓
7. 🎯 Seleccionar Mejor Mesa
   → Filtra slots con capacidad suficiente
   → Ordena por capacidad ASC (más pequeña que cumpla)
   → Selecciona la mejor opción
   ↓
8. ❓ ¿Disponible? → SÍ
   ↓
9. 🔓 Liberar Slot Antiguo
   → UPDATE availability_slots
   → SET status='free', is_available=true
   → WHERE old_date + old_time + old_table_id
   ↓
10. 💾 Actualizar Reserva
    → UPDATE reservations
    → SET reservation_date=..., reservation_time=..., party_size=..., table_id=...
    ↓
11. 🔒 Marcar Nuevo Slot Reservado
    → UPDATE availability_slots
    → SET status='reserved', is_available=false
    → WHERE new_slot_id
    ↓
12. ✅ Respuesta: Éxito (Slot Cambiado)
```

### Caso 2: Solo Cambio de Personas (Sin Cambiar Slot)

```
1-5. (Igual que Caso 1)
   ↓
5. ❓ ¿Cambia Fecha/Hora? → NO
   ↓
6. 💾 Actualizar Reserva (sin cambio de slot)
   → UPDATE reservations
   → SET party_size=..., special_requests=...
   → (NO cambia table_id, NO libera slot)
   ↓
7. ✅ Respuesta: Éxito (sin cambio de slot)
```

---

## 🛡️ VALIDACIONES Y PROTECCIONES

### 1. Validación de Input
- ✅ `reservation_id` y `restaurant_id` obligatorios
- ✅ Al menos uno de: `new_date`, `new_time`, `new_party_size`

### 2. Validación de Reserva
- ✅ Reserva existe en BD
- ✅ Pertenece al `restaurant_id` correcto
- ✅ Tiene estado válido: `pending`, `confirmed` o `pending_approval`
- ❌ No se puede modificar si está: `completed`, `cancelled`, `no_show`, `deleted`

### 3. Validación de Disponibilidad
- ✅ Si cambia fecha/hora → busca nuevo slot disponible
- ✅ Valida capacidad de mesa para `final_party_size`
- ✅ Respeta zona preferida si se especifica

### 4. Integridad de Datos
- ✅ Libera slot antiguo ANTES de actualizar reserva
- ✅ Actualiza reserva ANTES de bloquear nuevo slot
- ✅ Orden correcto: liberar → actualizar → bloquear

---

## 📊 EJEMPLOS DE USO

### Ejemplo 1: Cambiar fecha y hora
```json
{
  "reservation_id": "7a52b0db-615f-4878-a56e-9e046d0e4f16",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "new_date": "2025-10-25",
  "new_time": "21:00"
}
```

### Ejemplo 2: Cambiar número de personas
```json
{
  "reservation_id": "7a52b0db-615f-4878-a56e-9e046d0e4f16",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "new_party_size": 6
}
```

### Ejemplo 3: Cambiar todo
```json
{
  "reservation_id": "7a52b0db-615f-4878-a56e-9e046d0e4f16",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "new_date": "2025-10-25",
  "new_time": "21:00",
  "new_party_size": 6,
  "preferred_zone": "terraza",
  "special_requests": "Cumpleaños, pastel incluido"
}
```

---

## 🔗 INTEGRACIÓN CON SUPER AGENT

El Super Agent debe llamar a este tool cuando detecte intent de modificación:

```javascript
// En el nodo "🔧 Tool: Modificar Reserva" del Super Agent
{
  "name": "modify_reservation",
  "description": "Modifica una reserva existente. Usa esta herramienta cuando el cliente quiera cambiar fecha, hora o número de personas de su reserva.",
  "parameters": {
    "reservation_id": "{{ $json.reservation_id }}",      // Del contexto
    "restaurant_id": "{{ $json.restaurant_id }}",        // Del contexto
    "new_date": "{{ $fromAI('new_date') }}",             // Extraído por IA
    "new_time": "{{ $fromAI('new_time') }}",             // Extraído por IA
    "new_party_size": "{{ $fromAI('new_party_size') }}"  // Extraído por IA
  }
}
```

**⚠️ IMPORTANTE:** El Super Agent debe:
1. Preguntar al cliente **QUÉ quiere cambiar** (fecha, hora, personas)
2. **Confirmar los nuevos valores** antes de llamar al tool
3. Pasar `reservation_id` desde el contexto (no pedirlo al cliente)

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error 1: "Reserva no encontrada"
**Causa:** `reservation_id` incorrecto o no pertenece al `restaurant_id`  
**Solución:** Verificar que el `reservation_id` es correcto

### Error 2: "No se puede modificar una reserva con estado: completed"
**Causa:** Intentando modificar una reserva ya completada/cancelada  
**Solución:** Solo se pueden modificar reservas en estado `pending`, `confirmed` o `pending_approval`

### Error 3: "No hay mesas disponibles..."
**Causa:** No existe disponibilidad para la nueva fecha/hora/personas  
**Solución:** Ofrecer alternativas al cliente (otras horas, otros días)

### Error 4: "Debes proporcionar al menos un campo a modificar"
**Causa:** No se pasó ningún campo nuevo  
**Solución:** Pasar al menos uno de: `new_date`, `new_time`, `new_party_size`

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Importar `TOOL-modify-reservation-COMPLETO.json` en N8N
- [ ] Verificar credenciales de Supabase configuradas
- [ ] Copiar el **Workflow ID** generado
- [ ] Actualizar Super Agent con el Workflow ID en el nodo "🔧 Tool: Modificar Reserva"
- [ ] Probar modificación de fecha/hora
- [ ] Probar modificación de personas
- [ ] Probar error de disponibilidad
- [ ] Verificar que los slots se liberan/bloquean correctamente

---

## 📝 NOTAS TÉCNICAS

1. **Optimización:** Si solo cambian `party_size` o `special_requests`, NO busca nuevo slot (ahorra queries)
2. **Atomicidad:** El orden de operaciones garantiza integridad:
   - Primero libera slot antiguo
   - Luego actualiza reserva
   - Finalmente bloquea nuevo slot
3. **Rollback manual:** Si falla, los slots quedan consistentes (el antiguo se liberó, el nuevo no se bloqueó)
4. **Búsqueda de mesa:** Usa el mismo algoritmo que `create_reservation` (capacidad mínima que cumpla)

---

**Fecha de creación:** 18 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ PRODUCTION READY



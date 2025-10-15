# 🔧 TOOL: `check_availability` - Consultar Disponibilidad

## 📋 RESUMEN EJECUTIVO

Workflow que verifica disponibilidad de mesas en tiempo real consultando `availability_slots` + `tables` en Supabase.

**Estado:** ✅ LISTO PARA IMPORTAR  
**Creado:** 15 Octubre 2025  
**Versión:** 1.0  

---

## 🎯 ¿QUÉ HACE?

1. **Recibe parámetros** del Super Agent (GPT-4o):
   - `date`: Fecha de la reserva (YYYY-MM-DD)
   - `time`: Hora de la reserva (HH:MM)
   - `party_size`: Número de personas
   - `reservation_location` (opcional): Zona preferida

2. **Consulta Supabase** para buscar:
   - Slots exactos disponibles (`status='free'`, `is_available=true`)
   - Mesas con capacidad suficiente (`capacity >= party_size`)
   - Alternativas si el horario exacto no está disponible

3. **Devuelve respuesta natural** al agente:
   - ✅ "Sí tenemos disponibilidad para X personas..."
   - ⚠️ "No hay disponibilidad a esa hora, pero sí a las..."
   - ❌ "No tenemos disponibilidad ese día..."

---

## 🗂️ ESTRUCTURA DEL WORKFLOW

### **Nodos:**

1. **▶️ Start** - Trigger desde Workflow 3 (Super Agent)
2. **🔍 Validar y Normalizar Input** - Validaciones de fecha/hora/personas
3. **🎯 Buscar Slot Exacto** - Query SQL para slot exacto
4. **If ❓ ¿Hay Disponibilidad?** - Evalúa si hay slots
5. **✅ Respuesta: Disponible** - Mensaje de éxito
6. **🔎 Buscar Alternativas Mismo Día** - Query SQL para otros horarios
7. **If ❓ ¿Hay Alternativas?** - Evalúa si hay alternativas
8. **⚠️ Respuesta: No Disponible (con alternativas)** - Ofrece otros horarios
9. **❌ Respuesta: Sin Disponibilidad** - Sin opciones ese día

---

## 📊 TABLA: `availability_slots`

### **Estructura:**
```sql
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  table_id UUID NOT NULL REFERENCES tables(id),
  status TEXT NOT NULL DEFAULT 'free', -- 'free', 'reserved', 'blocked'
  is_available BOOLEAN DEFAULT true,
  shift_name TEXT,
  duration_minutes INTEGER DEFAULT 90,
  source TEXT DEFAULT 'system',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (restaurant_id, slot_date, start_time, table_id)
);
```

### **Índices:**
```sql
CREATE INDEX idx_availability_slots_unique 
ON availability_slots (restaurant_id, slot_date, start_time, table_id);

CREATE INDEX idx_availability_slots_query 
ON availability_slots (restaurant_id, slot_date, status, is_available);
```

---

## 🔍 QUERIES SQL UTILIZADAS

### **Query 1: Buscar Slot Exacto**
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
  t.location,
  t.is_active
FROM availability_slots a
INNER JOIN tables t ON a.table_id = t.id
WHERE a.restaurant_id = '{{ restaurant_id }}'
  AND a.slot_date = '{{ fecha }}'
  AND a.start_time = '{{ hora }}'
  AND a.status = 'free'
  AND a.is_available = true
  AND t.is_active = true
  AND t.capacity >= {{ personas }}
  -- Si hay zona específica:
  AND t.zone ILIKE '%{{ ubicacion }}%'
ORDER BY t.capacity ASC, t.table_number ASC
LIMIT 10;
```

### **Query 2: Buscar Alternativas Mismo Día**
```sql
SELECT DISTINCT
  a.start_time,
  COUNT(DISTINCT a.id) as slots_disponibles
FROM availability_slots a
INNER JOIN tables t ON a.table_id = t.id
WHERE a.restaurant_id = '{{ restaurant_id }}'
  AND a.slot_date = '{{ fecha }}'
  AND a.status = 'free'
  AND a.is_available = true
  AND t.is_active = true
  AND t.capacity >= {{ personas }}
GROUP BY a.start_time
HAVING COUNT(DISTINCT a.id) > 0
ORDER BY a.start_time ASC
LIMIT 10;
```

---

## 🛡️ VALIDACIONES

### **1. Fecha**
- ✅ Formato: `YYYY-MM-DD`
- ✅ No puede ser pasado (< hoy)
- ✅ Máximo 90 días de antelación

### **2. Hora**
- ✅ Formato: `HH:MM`
- ✅ Rango válido: `00:00` - `23:59`

### **3. Personas**
- ✅ Rango: `1` - `20`

### **4. Restaurant ID**
- ✅ Obligatorio (UUID válido)

---

## 📤 FORMATO DE RESPUESTA

### **Caso A: ✅ Disponible**
```json
{
  "disponible": true,
  "mensaje": "¡Perfecto! Sí tenemos disponibilidad para 4 personas el sábado 19 de octubre de 2025 a las 20:00. Tenemos 3 mesas disponibles.",
  "detalles": {
    "fecha": "2025-10-19",
    "hora": "20:00",
    "personas": 4,
    "mesas_disponibles": 3,
    "mejor_opcion": {
      "mesa": 5,
      "capacidad": 4,
      "zona": "Terraza",
      "ubicacion": "Exterior"
    },
    "todas_las_mesas": [...]
  },
  "accion_sugerida": "proceder_con_reserva"
}
```

### **Caso B: ⚠️ No Disponible (con alternativas)**
```json
{
  "disponible": false,
  "mensaje": "Lo siento, no tenemos disponibilidad a las 20:00 para 4 personas. Sin embargo, sí tenemos disponibilidad en estos otros horarios el sábado 19 de octubre de 2025: 18:00, 18:30, 21:00, 21:30. ¿Alguno de estos horarios te vendría bien?",
  "alternativas": ["18:00", "18:30", "21:00", "21:30"],
  "detalles": {
    "fecha": "2025-10-19",
    "hora_solicitada": "20:00",
    "personas": 4,
    "total_alternativas": 4
  },
  "accion_sugerida": "elegir_alternativa"
}
```

### **Caso C: ❌ Sin Disponibilidad**
```json
{
  "disponible": false,
  "mensaje": "Lo siento, no tenemos disponibilidad para 4 personas el sábado 19 de octubre de 2025. ¿Te gustaría que busque en otra fecha?",
  "alternativas": [],
  "detalles": {
    "fecha_solicitada": "2025-10-19",
    "hora_solicitada": "20:00",
    "personas": 4
  },
  "accion_sugerida": "sugerir_otra_fecha"
}
```

---

## 🔗 INTEGRACIÓN CON WORKFLOW 3 (SUPER AGENT)

### **Paso 1: Importar el Workflow**
1. Ir a N8N → Workflows
2. Click "Import from File"
3. Seleccionar `check-availability.json`
4. Guardar y activar

### **Paso 2: Obtener el Workflow ID**
- Una vez importado, copiar el ID del workflow (aparece en la URL)
- Ejemplo: `https://n8n.la-ia.app/workflow/ABC123XYZ`
- ID = `ABC123XYZ`

### **Paso 3: Actualizar Workflow 3**
Abrir `3-super-agent-hibrido-FINAL-CORREGIDO.json` y:

1. **Buscar el nodo:** `🔧 Tool: Consultar Disponibilidad`
2. **Actualizar el `workflowId`:**
   ```json
   "workflowId": {
     "__rl": true,
     "value": "ABC123XYZ",  // ← CAMBIAR AQUÍ
     "mode": "id"
   }
   ```

### **Paso 4: Verificar Credenciales**
- Nodo `🎯 Buscar Slot Exacto` → Credential: `Supabase La-IA`
- Nodo `🔎 Buscar Alternativas Mismo Día` → Credential: `Supabase La-IA`

---

## 🧪 PRUEBAS

### **Test 1: Disponibilidad Exacta**
```json
{
  "date": "2025-10-20",
  "time": "20:00",
  "party_size": 4,
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```
**Esperado:** Mensaje de disponibilidad con mesas

---

### **Test 2: Sin Disponibilidad (con alternativas)**
```json
{
  "date": "2025-10-20",
  "time": "14:00",
  "party_size": 8,
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```
**Esperado:** Mensaje con horarios alternativos

---

### **Test 3: Fecha Inválida**
```json
{
  "date": "2025-13-32",
  "time": "20:00",
  "party_size": 4,
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```
**Esperado:** Error de validación

---

### **Test 4: Con Zona Preferida**
```json
{
  "date": "2025-10-20",
  "time": "20:00",
  "party_size": 2,
  "reservation_location": "terraza",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```
**Esperado:** Solo mesas de terraza

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] 1. Importar `check-availability.json` en N8N
- [ ] 2. Verificar credenciales de Supabase
- [ ] 3. Obtener Workflow ID
- [ ] 4. Actualizar `workflowId` en Workflow 3
- [ ] 5. Activar el workflow
- [ ] 6. Probar Test 1 (disponibilidad exacta)
- [ ] 7. Probar Test 2 (con alternativas)
- [ ] 8. Probar Test 3 (validación de errores)
- [ ] 9. Probar Test 4 (con zona preferida)
- [ ] 10. Verificar integración con Super Agent (GPT-4o)

---

## 🐛 TROUBLESHOOTING

### **Problema:** "No se encuentra la tabla availability_slots"
**Solución:** Verificar que las migraciones de Supabase estén aplicadas:
```sql
SELECT COUNT(*) FROM availability_slots;
```

---

### **Problema:** "No hay slots disponibles" (pero sí debería haber)
**Solución:** Verificar que el sistema de generación de slots esté activo:
```sql
SELECT COUNT(*) 
FROM availability_slots 
WHERE restaurant_id = 'TU_RESTAURANT_ID'
  AND slot_date >= CURRENT_DATE
  AND status = 'free';
```

---

### **Problema:** "Error de permisos en Supabase"
**Solución:** Verificar que la credencial `Supabase La-IA` tenga permisos:
- ✅ `SELECT` en `availability_slots`
- ✅ `SELECT` en `tables`

---

## 📚 DOCUMENTACIÓN RELACIONADA

- **Auditoría completa:** `n8n/workflows/AUDITORIA-DISPONIBILIDAD-COMPLETA.md`
- **Propuesta de implementación:** `n8n/workflows/PROPUESTA-check_availability.md`
- **Schema de base de datos:** `docs/01-arquitectura/DATABASE-SCHEMA-SUPABASE-COMPLETO.md`
- **Frontend (AvailabilityService):** `src/services/AvailabilityService.js`

---

## 📝 NOTAS IMPORTANTES

1. **Multi-tenant:** El workflow SIEMPRE filtra por `restaurant_id`
2. **Performance:** Las queries usan índices optimizados
3. **Seguridad:** Solo consulta datos, NUNCA modifica `availability_slots`
4. **Escalabilidad:** Preparado para múltiples restaurantes simultáneos

---

**Autor:** AI Assistant  
**Fecha:** 15 Octubre 2025  
**Versión:** 1.0  


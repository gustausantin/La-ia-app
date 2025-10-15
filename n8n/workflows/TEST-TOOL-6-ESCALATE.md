# 🧪 TEST COMPLETO - TOOL 6: Escalate to Human

## 📋 OBJETIVO DEL TEST

Verificar que el workflow de escalado funciona correctamente:
1. ✅ Recibe los parámetros correctamente
2. ✅ Prepara los datos del escalado
3. ✅ Obtiene info del restaurante
4. ✅ Construye el mensaje de alerta
5. ✅ Envía WhatsApp al encargado
6. ✅ Registra el escalado en la BD
7. ✅ Devuelve respuesta al agente

---

## 🔧 PASO 1: VERIFICAR TABLA `escalations` EN SUPABASE

### SQL para verificar que la tabla existe:

```sql
-- 1. Verificar que la tabla existe
SELECT 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'escalations';

-- 2. Ver estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'escalations'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'escalations';
```

**Resultado esperado:**
- Tabla `escalations` existe ✅
- Columnas: `id`, `restaurant_id`, `customer_phone`, `customer_name`, `reason`, `urgency`, `customer_message`, `status`, `escalated_at`, `created_at`, `updated_at`

---

## 🧪 PASO 2: DATOS DE PRUEBA

### Input de prueba para el workflow:

```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "customer_phone": "+34671126148",
  "customer_name": "Gustau",
  "customer_message": "Necesito hablar con el encargado, tengo un problema urgente con mi reserva",
  "reason": "cliente_solicita",
  "urgency": "high",
  "conversation_id": "test-conv-001"
}
```

### Variantes de razones a probar:

**Test 1: Cliente solicita hablar**
```json
{
  "reason": "cliente_solicita",
  "urgency": "medium",
  "customer_message": "Hola, quisiera hablar con una persona por favor"
}
```

**Test 2: Queja grave**
```json
{
  "reason": "queja_grave",
  "urgency": "high",
  "customer_message": "Estoy muy molesto, la reserva se perdió y nadie me ayuda"
}
```

**Test 3: Situación compleja**
```json
{
  "reason": "situacion_compleja",
  "urgency": "high",
  "customer_message": "Necesitamos reservar para 15 personas con menú especial"
}
```

**Test 4: Información no disponible**
```json
{
  "reason": "informacion_no_disponible",
  "urgency": "medium",
  "customer_message": "¿Tenéis menú para celíacos con certificación?"
}
```

**Test 5: Error del sistema**
```json
{
  "reason": "error_sistema",
  "urgency": "high",
  "customer_message": "El sistema no me deja hacer la reserva"
}
```

---

## 📊 PASO 3: VERIFICAR NODO POR NODO

### ✅ Nodo 1: "📋 Preparar Escalado"

**Input esperado:**
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "customer_phone": "+34671126148",
  "customer_name": "Gustau",
  "customer_message": "Necesito hablar con el encargado",
  "reason": "cliente_solicita",
  "urgency": "high"
}
```

**Output esperado:**
```json
{
  "reason": "cliente_solicita",
  "reasonText": "🙋 El cliente solicita hablar con una persona",
  "customerPhone": "+34671126148",
  "customerName": "Gustau",
  "customerMessage": "Necesito hablar con el encargado",
  "urgency": "high",
  "urgencyEmoji": "🚨🚨🚨",
  "timestamp": "2025-10-14T..."
}
```

**Verificaciones:**
- ✅ `reasonText` mapeado correctamente
- ✅ `urgencyEmoji` según nivel (🚨🚨🚨 para high, ⚠️ para medium/low)
- ✅ `timestamp` generado

---

### ✅ Nodo 2: "🏪 Get Restaurant"

**Query esperado:**
```sql
SELECT * FROM restaurants WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
```

**Output esperado:**
```json
{
  "id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "name": "La Terraza de Guillermo",
  "phone": "+34999999999",
  "channels": {
    "whatsapp": {
      "phone_number": "+34671126148",
      "emergency_phone": "+34671126148"
    }
  }
}
```

**Verificaciones:**
- ✅ Restaurante existe
- ✅ Tiene número de emergencia configurado
- ✅ Channels > whatsapp > emergency_phone presente

---

### ✅ Nodo 3: "🚨 Construir Alerta"

**Input esperado:**
- Datos de "📋 Preparar Escalado"
- Datos de "🏪 Get Restaurant"

**Output esperado:**
```json
{
  "reason": "cliente_solicita",
  "reasonText": "🙋 El cliente solicita hablar con una persona",
  "customerPhone": "+34671126148",
  "customerName": "Gustau",
  "customerMessage": "Necesito hablar con el encargado",
  "urgency": "high",
  "urgencyEmoji": "🚨🚨🚨",
  "timestamp": "2025-10-14T...",
  "restaurant_name": "La Terraza de Guillermo",
  "emergency_phone": "+34671126148",
  "alert_message": "🚨🚨🚨 ALERTA - CLIENTE NECESITA ATENCIÓN\n\n🙋 El cliente solicita hablar con una persona\n\n👤 Cliente: Gustau\n📞 Teléfono: +34671126148\n⏰ Hora: 14/10/2025, 12:30:00\n\n💬 Mensaje del cliente:\n\"Necesito hablar con el encargado\"\n\n⚡ Acción requerida: Contactar al cliente URGENTEMENTE\n\n---\nRestaurante: La Terraza de Guillermo"
}
```

**Verificaciones:**
- ✅ `emergency_phone` extraído correctamente
- ✅ `alert_message` formateado correctamente
- ✅ Mensaje contiene todos los datos necesarios

---

### ✅ Nodo 4: "📱 Enviar WhatsApp Urgente"

**Configuración:**
- **From:** `{{ $json.customerPhone }}` → `+34671126148`
- **To:** `{{ $json.emergency_phone }}` → `+34671126148`
- **Message:** `{{ $json.alert_message }}`

**Verificaciones:**
- ✅ WhatsApp enviado correctamente
- ✅ Mensaje recibido por el encargado
- ✅ Sin errores de Twilio

---

### ✅ Nodo 5: "💾 Registrar Escalado"

**Insert esperado en `escalations`:**
```sql
INSERT INTO escalations (
  restaurant_id,
  customer_phone,
  customer_name,
  reason,
  urgency,
  customer_message,
  status,
  escalated_at
) VALUES (
  'd6b63130-1ebf-4284-98fc-a3b31a85d9d1',
  '+34671126148',
  'Gustau',
  'cliente_solicita',
  'high',
  'Necesito hablar con el encargado',
  'pending',
  '2025-10-14T...'
)
```

**Verificación en Supabase:**
```sql
SELECT 
  id,
  restaurant_id,
  customer_name,
  customer_phone,
  reason,
  urgency,
  status,
  escalated_at,
  created_at
FROM escalations
ORDER BY created_at DESC
LIMIT 5;
```

**Output esperado:**
- ✅ Registro creado en la tabla
- ✅ `status = 'pending'`
- ✅ `escalated_at` con timestamp correcto

---

### ✅ Nodo 6: "✅ Devolver Resultado"

**Output final esperado:**
```json
{
  "success": true,
  "message": "El encargado ha sido notificado y te contactará en breve.",
  "escalated": true,
  "escalation_id": "uuid-del-registro-creado"
}
```

**Verificaciones:**
- ✅ `success = true`
- ✅ `escalated = true`
- ✅ `escalation_id` presente

---

## 🎯 PASO 4: CHECKLIST DE VALIDACIÓN

### Pre-requisitos:
- [ ] Tabla `escalations` existe en Supabase
- [ ] Credenciales de Supabase configuradas
- [ ] Credenciales de Twilio configuradas
- [ ] Restaurante tiene `channels.whatsapp.emergency_phone` configurado

### Flujo completo:
- [ ] Input recibido correctamente
- [ ] Datos normalizados en "Preparar Escalado"
- [ ] Restaurante encontrado en BD
- [ ] Mensaje de alerta construido
- [ ] WhatsApp enviado correctamente
- [ ] Escalado registrado en BD
- [ ] Respuesta devuelta al agente

### Validación en BD:
- [ ] Registro existe en `escalations`
- [ ] Todos los campos correctos
- [ ] `status = 'pending'`
- [ ] Timestamps correctos

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error 1: Tabla `escalations` no existe
**Solución:**
```sql
-- Ejecutar migración
-- supabase/migrations/20251014_007_create_escalations_table.sql
```

### Error 2: No se encuentra `emergency_phone`
**Solución:**
```sql
-- Actualizar restaurante
UPDATE restaurants
SET channels = jsonb_set(
  COALESCE(channels, '{}'::jsonb),
  '{whatsapp,emergency_phone}',
  '"<NUMERO_EMERGENCIA>"'::jsonb
)
WHERE id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';
```

### Error 3: Twilio falla al enviar WhatsApp
**Solución:**
- Verificar que el número de emergencia esté en formato E.164: `+34XXXXXXXXX`
- Verificar que el número esté registrado en Twilio Sandbox (si es prueba)

### Error 4: Campo `escalated_at` no existe
**Solución:**
```sql
-- Añadir columna si falta
ALTER TABLE escalations
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
```

---

## ✅ RESULTADO ESPERADO FINAL

Si todo funciona correctamente:

1. ✅ **Workflow ejecuta sin errores**
2. ✅ **WhatsApp recibido por el encargado**
3. ✅ **Registro en BD creado**
4. ✅ **Respuesta devuelta al Super Agent**

**Logs esperados:**
```
🆘 ESCALADO A HUMANO: { customer_name: 'Gustau', reason: 'cliente_solicita' }
📨 Enviando alerta a: +34671126148
✅ Escalado completado: Gustau
```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DEL TEST

Si el test es exitoso:
1. Integrar TOOL-6 en el Super Agent como herramienta
2. Probar escalado desde conversación real
3. Verificar que el sistema híbrido llama correctamente al tool
4. Monitorear tabla `escalations` en producción

**Estado:** ⏳ Listo para testing



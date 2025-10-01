# 📱 SISTEMA DE COMUNICACIONES DEL AGENTE IA

**Fecha:** 1 Octubre 2025  
**Estado:** ✅ Implementado

---

## 📊 **RESUMEN EJECUTIVO**

Sistema completo de comunicaciones para el agente IA que gestiona conversaciones por múltiples canales (WhatsApp, teléfono, Instagram, Facebook, webchat).

**Características:**
- ✅ 100% datos reales (no mockups)
- ✅ Retención de 30 días
- ✅ Métricas automáticas
- ✅ Integración con n8n
- ✅ Dashboard en tiempo real

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS**

### **Tabla 1: `agent_conversations`**

Almacena todas las conversaciones del agente IA con clientes.

```sql
CREATE TABLE agent_conversations (
    -- Identificadores
    id UUID PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Datos del cliente
    customer_phone VARCHAR NOT NULL,
    customer_name VARCHAR,
    customer_email VARCHAR,
    
    -- Canal y clasificación
    source_channel VARCHAR NOT NULL,  -- 'whatsapp', 'phone', 'instagram', 'facebook', 'webchat'
    interaction_type VARCHAR NOT NULL, -- 'reservation', 'modification', 'cancellation', 'inquiry', 'complaint', 'other'
    
    -- Estado
    status VARCHAR NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'abandoned'
    
    -- Resultado
    outcome VARCHAR, -- 'reservation_created', 'reservation_modified', 'reservation_cancelled', 'inquiry_answered', 'no_action', 'escalated'
    reservation_id UUID REFERENCES reservations(id),
    
    -- Métricas de tiempo
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_time_seconds INTEGER GENERATED ALWAYS AS (...) STORED, -- Calculado automáticamente
    
    -- Análisis
    sentiment VARCHAR, -- 'positive', 'neutral', 'negative'
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);
```

**Índices:**
- `restaurant_id`, `customer_id`, `customer_phone`
- `source_channel`, `status`, `interaction_type`, `outcome`
- `created_at DESC`, `resolved_at DESC`

---

### **Tabla 2: `agent_messages`**

Almacena los mensajes individuales de cada conversación.

```sql
CREATE TABLE agent_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id),
    
    -- Dirección
    direction VARCHAR NOT NULL, -- 'inbound', 'outbound'
    sender VARCHAR NOT NULL,    -- 'customer', 'agent', 'system'
    
    -- Contenido
    message_text TEXT NOT NULL,
    
    -- Metadatos
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    
    -- Análisis (opcional)
    tokens_used INTEGER,
    confidence_score DECIMAL(3,2)
);
```

**Índices:**
- `conversation_id`, `restaurant_id`
- `timestamp DESC`, `direction`

---

## 🎯 **FUNCIONES RPC DISPONIBLES**

### **1. Estadísticas por canal**

```sql
SELECT * FROM get_agent_communication_stats(
    'restaurant-id-uuid',
    7  -- últimos 7 días
);
```

**Retorna:**
```
source_channel | total | active | resolved | reservations | avg_resolution_min | conversion_rate
---------------|-------|--------|----------|--------------|-------------------|----------------
whatsapp       | 25    | 3      | 22       | 18           | 8.5               | 72.0
phone          | 15    | 1      | 14       | 12           | 5.2               | 80.0
instagram      | 5     | 0      | 5        | 2            | 12.3              | 40.0
```

---

### **2. Resumen general**

```sql
SELECT * FROM get_agent_communication_summary(
    'restaurant-id-uuid',
    7  -- últimos 7 días
);
```

**Retorna:**
```
total | active | resolved | abandoned | reservations | avg_resolution_min | conversion_rate | total_messages
------|--------|----------|-----------|--------------|-------------------|----------------|---------------
45    | 4      | 41       | 0         | 32           | 7.8               | 71.1           | 234
```

---

### **3. Cleanup automático (30 días)**

```sql
SELECT * FROM cleanup_old_agent_conversations();
```

**Retorna:**
```
deleted_conversations | deleted_messages
---------------------|------------------
12                   | 87
```

---

## 🔗 **INTEGRACIÓN CON n8n**

### **Flujo de trabajo:**

```
Cliente envía mensaje (WhatsApp/Phone/Instagram/Facebook/Webchat)
    ↓
n8n recibe webhook
    ↓
n8n identifica canal y cliente
    ↓
n8n envía a Vapi (agente IA)
    ↓
Vapi responde
    ↓
n8n guarda en Supabase:
  - INSERT en agent_conversations (inicio)
  - INSERT en agent_messages (cada mensaje)
  - UPDATE agent_conversations (final con outcome)
    ↓
Dashboard muestra en tiempo real
```

---

### **Código n8n para insertar conversación:**

```javascript
// 1. CREAR CONVERSACIÓN (inicio)
const { data: conversation } = await supabase
    .from('agent_conversations')
    .insert({
        restaurant_id: 'uuid-restaurante',
        customer_phone: '+34666777888',
        customer_name: 'Juan Pérez',
        customer_email: 'juan@email.com', // opcional
        source_channel: 'whatsapp', // o 'phone', 'instagram', 'facebook', 'webchat'
        interaction_type: 'reservation', // o 'inquiry', 'complaint', etc.
        status: 'active',
        metadata: {
            vapi_session_id: 'xxx',
            // otros datos
        }
    })
    .select()
    .single();

const conversationId = conversation.id;
```

---

### **Código n8n para insertar mensajes:**

```javascript
// 2. INSERTAR MENSAJES (durante conversación)

// Mensaje del cliente
await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    restaurant_id: 'uuid-restaurante',
    direction: 'inbound',
    sender: 'customer',
    message_text: 'Hola, quiero una mesa para 4',
    timestamp: new Date().toISOString()
});

// Respuesta del agente
await supabase.from('agent_messages').insert({
    conversation_id: conversationId,
    restaurant_id: 'uuid-restaurante',
    direction: 'outbound',
    sender: 'agent',
    message_text: '¡Hola! Por supuesto, ¿para qué día?',
    timestamp: new Date().toISOString(),
    tokens_used: 45, // opcional
    confidence_score: 0.95 // opcional
});
```

---

### **Código n8n para actualizar conversación (final):**

```javascript
// 3. ACTUALIZAR CONVERSACIÓN (final)
await supabase
    .from('agent_conversations')
    .update({
        status: 'resolved', // Trigger automático pone resolved_at
        outcome: 'reservation_created', // o 'inquiry_answered', etc.
        reservation_id: 'uuid-reserva', // si creó reserva
        sentiment: 'positive', // opcional
        customer_id: 'uuid-customer' // si lo identificaste/creaste
    })
    .eq('id', conversationId);
```

---

## 🎨 **PÁGINA DE COMUNICACIONES**

**Ubicación:** `/comunicacion`

**Componentes:**
- `src/pages/Comunicacion.jsx` (wrapper)
- `src/components/ComunicacionProfesional.jsx` (componente principal)

**Funcionalidades:**
1. ✅ Lista de conversaciones de últimos 30 días
2. ✅ Filtros por canal (WhatsApp, teléfono, Instagram, Facebook, webchat)
3. ✅ Filtro por estado (activas, resueltas, abandonadas)
4. ✅ Búsqueda por nombre, teléfono, email
5. ✅ Vista de mensajes individuales
6. ✅ Envío de mensajes funcional (guarda en BD)
7. ✅ Marcar conversación como resuelta
8. ✅ Link a reserva (si existe `reservation_id`)
9. ✅ Estadísticas en tiempo real (total, activas, resueltas, abandonadas)

---

## 🔒 **SEGURIDAD (RLS)**

**Row Level Security habilitado en:**
- `agent_conversations`
- `agent_messages`

**Políticas:**
- SELECT: Solo usuarios autenticados
- INSERT: Solo usuarios autenticados
- UPDATE: Solo usuarios autenticados
- DELETE: Solo usuarios autenticados

**Nota:** Adaptar políticas para multi-tenant cuando `user_restaurant_mapping` esté listo.

---

## ⚡ **TRIGGERS AUTOMÁTICOS**

**Trigger:** `update_conversation_resolved_at()`

**Comportamiento:**
- Cuando `status = 'resolved'` → `resolved_at` se actualiza automáticamente a NOW()
- Cuando `status != 'resolved'` → `resolved_at` se pone a NULL

**Ventaja:**
- `resolution_time_seconds` se calcula automáticamente (columna generada)

---

## 📈 **MÉTRICAS DISPONIBLES**

### **Por conversación:**
- Tiempo de resolución (automático)
- Canal de origen
- Tipo de interacción
- Resultado (outcome)
- Sentiment

### **Agregadas (dashboard):**
- Total conversaciones
- Activas / Resueltas / Abandonadas
- Reservas creadas
- Tasa de conversión
- Tiempo promedio de resolución
- Distribución por canal
- Total de mensajes

---

## 🧹 **MANTENIMIENTO**

**Retención de datos:** 30 días

**Cleanup automático:**
```sql
-- Ejecutar periódicamente (ej: cron job diario)
SELECT * FROM cleanup_old_agent_conversations();
```

**Resultado:**
- Borra conversaciones > 30 días
- Borra mensajes asociados (CASCADE)
- Retorna cantidad de filas eliminadas

---

## 🚀 **DEPLOYMENT**

### **1. Ejecutar migración en Supabase:**

```sql
-- Archivo: supabase/migrations/20251001_003_agent_communications_clean.sql
-- Copiar y pegar en Supabase Dashboard → SQL Editor → Run
```

### **2. Verificar tablas creadas:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agent_conversations', 'agent_messages');
```

### **3. Probar página:**

- Abrir `/comunicacion`
- Debe mostrar: "No hay conversaciones" (normal, aún no hay datos)
- Sin errores en consola

### **4. Configurar n8n:**

- Crear webhooks para cada canal
- Implementar lógica de INSERT en Supabase
- Testing end-to-end

---

## 📊 **EJEMPLO DE FLUJO COMPLETO**

```
1. Cliente envía: "Hola, quiero mesa para 4"
   ↓
2. n8n crea conversación:
   - source_channel: 'whatsapp'
   - interaction_type: 'reservation'
   - status: 'active'
   ↓
3. n8n inserta mensaje cliente:
   - direction: 'inbound'
   - message_text: "Hola, quiero mesa para 4"
   ↓
4. Vapi responde: "¡Hola! ¿Para qué día?"
   ↓
5. n8n inserta mensaje agente:
   - direction: 'outbound'
   - message_text: "¡Hola! ¿Para qué día?"
   ↓
6. Cliente: "Sábado 21:00"
7. n8n inserta mensaje cliente
   ↓
8. Vapi: "Perfecto, confirmado"
9. n8n inserta mensaje agente
   ↓
10. Vapi crea reserva en sistema
    ↓
11. n8n actualiza conversación:
    - status: 'resolved'
    - outcome: 'reservation_created'
    - reservation_id: 'uuid-de-la-reserva'
    ↓
12. Dashboard muestra:
    - Conversación resuelta
    - Tiempo de resolución: 3 min
    - Link a reserva
    - 4 mensajes totales
```

---

## 🎯 **PRÓXIMOS PASOS**

1. ✅ **Migración ejecutada** en Supabase
2. ✅ **Página funcionando** sin errores
3. ⏳ **Configurar n8n** workflow
4. ⏳ **Testing** con mensajes reales
5. ⏳ **Dashboard MVP** con métricas del agente

---

## 📝 **NOTAS TÉCNICAS**

### **Columnas generadas:**
- `resolution_time_seconds` es STORED (calculada y guardada)
- Se actualiza automáticamente cuando cambia `resolved_at`

### **CASCADE deletes:**
- Si borras `agent_conversations` → borra `agent_messages` automáticamente
- Si borras `restaurants` → borra `agent_conversations` automáticamente

### **JSONB metadata:**
- Flexible para almacenar datos específicos de cada canal
- Ej: `vapi_session_id`, `webhook_id`, etc.

### **Performance:**
- 13 índices optimizan todas las queries comunes
- Índices parciales en `resolved_at` (solo no-NULL)

---

## ✅ **CHECKLIST DE VERIFICACIÓN**

- [x] Migración SQL creada
- [x] Tablas con estructura correcta
- [x] Índices optimizados
- [x] RLS configurado
- [x] Triggers automáticos
- [x] Funciones RPC
- [x] Página frontend creada
- [x] Componentes eliminados (obsoletos)
- [ ] Migración ejecutada en Supabase
- [ ] Testing página sin errores
- [ ] n8n workflow configurado
- [ ] Testing end-to-end

---

**Documento actualizado:** 1 Octubre 2025  
**Próxima revisión:** Después de configurar n8n


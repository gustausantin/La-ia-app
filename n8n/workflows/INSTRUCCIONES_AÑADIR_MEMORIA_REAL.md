# 🧠 INSTRUCCIONES: AÑADIR MEMORIA REAL AL SUPER AGENT

**Fecha:** 16 de octubre de 2025  
**Workflow:** 3️⃣ Super Agent Híbrido  
**Problema:** El agente olvida mensajes previos de la misma conversación  
**Solución:** Cargar historial de `agent_messages` desde Supabase e inyectarlo en el prompt

---

## 🎯 **OBJETIVO:**

Hacer que el Super Agent reciba **TODO el historial de la conversación** (últimos 10 mensajes) cada vez que procesa un mensaje, para que no olvide lo que el cliente dijo anteriormente.

---

## ⚙️ **ESPECIFICACIONES:**

- **Límite de mensajes:** Últimos **10 mensajes** de la conversación
- **Cierre automático:** Si el último mensaje fue hace **> 15 minutos**, se considera nueva conversación
- **Formato:** Historial formateado como texto legible (Cliente: ... / Agente: ...)

---

## 📝 **PASOS PARA IMPLEMENTAR:**

### **PASO 1: Añadir nodo para cargar historial**

**Ubicación:** Después del nodo `🔗 Fusionar Contexto Enriquecido`, ANTES del nodo `🤖 Super Agent (GPT-4o)`

**Nodo:** Supabase  
**Nombre:** `📜 Cargar Historial Conversación`  
**Operación:** `Get All`  
**Tabla:** `agent_messages`

**Filtros:**
```json
{
  "conditions": [
    {
      "keyName": "conversation_id",
      "condition": "eq",
      "keyValue": "={{ $('🔗 Fusionar Contexto Enriquecido').item.json.conversation_id }}"
    }
  ]
}
```

**Opciones:**
- ✅ `Sort`: `timestamp` (ASC)
- ✅ `Limit`: `10`
- ✅ `Always Output Data`: Activado

---

### **PASO 2: Añadir nodo para formatear historial**

**Ubicación:** Después de `📜 Cargar Historial Conversación`

**Nodo:** Code  
**Nombre:** `📝 Formatear Historial`

**Código:**
```javascript
const historyMessages = $input.all();
const contextData = $('🔗 Fusionar Contexto Enriquecido').item.json;

console.log('📜 Mensajes encontrados:', historyMessages.length);

// Si no hay historial, devolver contexto sin historial
if (historyMessages.length === 0) {
  console.log('ℹ️ No hay historial previo (nueva conversación)');
  return {
    ...contextData,
    conversation_history: ''
  };
}

// Verificar si la conversación está activa (último mensaje < 15 minutos)
const now = Date.now();
const CONVERSATION_TIMEOUT = 15 * 60 * 1000; // 15 minutos

const lastMessage = historyMessages[historyMessages.length - 1].json;
const lastMessageTime = new Date(lastMessage.timestamp).getTime();
const timeSinceLastMessage = now - lastMessageTime;

if (timeSinceLastMessage > CONVERSATION_TIMEOUT) {
  console.log('⏰ Conversación cerrada (>15 min). Iniciando nueva conversación.');
  return {
    ...contextData,
    conversation_history: ''
  };
}

// Formatear historial para el prompt
const formattedHistory = historyMessages
  .map(msg => {
    const data = msg.json;
    const sender = data.sender === 'customer' ? 'Cliente' : 'Agente';
    return `${sender}: ${data.message_text}`;
  })
  .join('\n');

console.log('✅ Historial formateado:', formattedHistory.substring(0, 200) + '...');

return {
  ...contextData,
  conversation_history: formattedHistory
};
```

---

### **PASO 3: Modificar el nodo Super Agent**

**Nodo:** `🤖 Super Agent (GPT-4o)`

**Cambio en `text` (User Message):**

**ANTES:**
```
={{ $json.user_message }}
```

**DESPUÉS:**
```
={{ $json.conversation_history ? '═══════════════════════════════════════════════════════════════════\n📜 HISTORIAL DE ESTA CONVERSACIÓN:\n═══════════════════════════════════════════════════════════════════\n\n' + $json.conversation_history + '\n\n═══════════════════════════════════════════════════════════════════\n💬 MENSAJE ACTUAL DEL CLIENTE:\n═══════════════════════════════════════════════════════════════════\n\n' + $json.user_message : $json.user_message }}
```

**Explicación:** 
- Si hay historial, lo muestra primero
- Luego muestra el mensaje actual
- Si no hay historial (nueva conversación), solo muestra el mensaje actual

---

### **PASO 4: Actualizar conexiones**

**Flujo nuevo:**

```
🔗 Fusionar Contexto Enriquecido
  ↓
📜 Cargar Historial Conversación (nuevo)
  ↓
📝 Formatear Historial (nuevo)
  ↓
🤖 Super Agent (GPT-4o) (modificado)
  ↓
(resto del workflow sin cambios)
```

**En N8N:**
1. Desconecta `🔗 Fusionar Contexto Enriquecido` de `🤖 Super Agent`
2. Conecta `🔗 Fusionar Contexto Enriquecido` → `📜 Cargar Historial Conversación`
3. Conecta `📜 Cargar Historial Conversación` → `📝 Formatear Historial`
4. Conecta `📝 Formatear Historial` → `🤖 Super Agent`

---

### **PASO 5: Eliminar el nodo de memoria (opcional)**

**Nodo a eliminar:** `💭 Memory (por conversación)`

**Razón:** Ya no es necesario porque cargamos el historial manualmente desde Supabase.

**IMPORTANTE:** Asegúrate de que el nodo `🤖 Super Agent` ya no esté conectado a `💭 Memory`.

---

## 🧪 **PRUEBA:**

Envía esta secuencia por WhatsApp:

```
1. "hola"
2. (Espera respuesta)
3. "quiero reservar para mañana"
4. (Espera respuesta)
5. "seremos 4"
6. (Espera respuesta)
7. "a las 21:00"
8. (Espera respuesta)
```

**Resultado esperado:**
- El agente NO pregunta dos veces el día, hora o personas
- El agente mantiene el contexto de todos los mensajes anteriores
- En los logs de N8N, ves el historial formateado en `📝 Formatear Historial`

---

## 📊 **EJEMPLO DE SALIDA DEL HISTORIAL:**

```
Cliente: hola
Agente: ¡Hola Gustau! ¿En qué puedo ayudarte?
Cliente: quiero reservar para mañana
Agente: Perfecto, ¿para cuántas personas?
Cliente: seremos 4
Agente: Genial, ¿a qué hora prefieres?
```

Esto es lo que el Super Agent verá en cada mensaje nuevo, junto con el mensaje actual.

---

## ✅ **RESULTADO FINAL:**

- ✅ El agente recuerda TODO lo que se dijo en la conversación
- ✅ No repite preguntas
- ✅ Conversaciones automáticamente se cierran después de 15 minutos de inactividad
- ✅ Solo carga los últimos 10 mensajes (optimización de tokens)
- ✅ Funciona con cualquier número de mensajes (hasta 10)

---

**FIN DE INSTRUCCIONES** ✅



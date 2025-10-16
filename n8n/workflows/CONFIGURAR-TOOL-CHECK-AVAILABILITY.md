# 🔧 CONFIGURAR TOOL: check_availability

## ❌ PROBLEMA ACTUAL

**Error:** "No parameters are set up to be filled by AI"

**Causa:** 
1. El `workflowId` es un placeholder ("TOOL_CHECK_AVAILABILITY_ID")
2. Falta el campo `restaurant_id` en los parámetros

---

## ✅ SOLUCIÓN

### **PASO 1: Importar el workflow check-availability**

1. Abrir N8N
2. Ir a Workflows → Import
3. Seleccionar: `n8n/workflows/Tool - check-availability.json`
4. Importar
5. **Copiar el Workflow ID** de la URL
   - Ejemplo: `https://n8n.la-ia.app/workflow/ABC123XYZ`
   - ID = `ABC123XYZ`

---

### **PASO 2: Actualizar Workflow 3 (Super Agent)**

1. Abrir Workflow 3: "Super Agent Híbrido"
2. Buscar nodo: **"🔧 Tool: Consultar Disponibilidad"**
3. Click en el nodo → Settings
4. En **"Workflow"** cambiar:

```
FROM:
  workflowId: "TOOL_CHECK_AVAILABILITY_ID"

TO:
  workflowId: "ABC123XYZ"  (el ID copiado en Paso 1)
```

---

### **PASO 3: Añadir restaurant_id a los parámetros**

En el mismo nodo, en **"Fields"**:

**Configuración actual (INCORRECTA):**
```json
{
  "values": [
    { "name": "date" },
    { "name": "time" },
    { "name": "party_size" }
  ]
}
```

**Configuración correcta:**
```json
{
  "values": [
    { "name": "date" },
    { "name": "time" },
    { "name": "party_size" },
    { "name": "restaurant_id" }
  ]
}
```

**CÓMO AÑADIRLO EN N8N:**
1. En el nodo "🔧 Tool: Consultar Disponibilidad"
2. Ir a sección **"Fields"**
3. Click en **"+ Add Field"**
4. Name: `restaurant_id`
5. Guardar

---

### **PASO 4: Actualizar el PROMPT del agente**

El prompt ya está actualizado en: `PROMPT-SUPER-AGENT-CON-FECHA.txt`

**Verificar que incluya:**
```
**→ USA LA HERRAMIENTA "check_availability"**

Parámetros que debes pasar:
- date: en formato YYYY-MM-DD (ej: "2025-10-19")
- time: en formato HH:MM (ej: "20:00")
- party_size: número entero (ej: 4)
- restaurant_id: {{ $json.restaurant_id }}
```

---

## 🧪 PRUEBA

**Enviar WhatsApp:**
```
Hola! para hacer una reserva para mañana?
seriamos 4
para los 21:00
hay sitio?
```

**Esperado:**
1. El agente detecta: fecha (mañana), hora (21:00), personas (4)
2. Llama a `check_availability` con:
   - date: "2025-10-16"
   - time: "21:00"
   - party_size: 4
   - restaurant_id: "d6b63130-..."
3. Recibe respuesta de disponibilidad
4. Responde al cliente

---

## 🐛 TROUBLESHOOTING

### Error: "Formato de fecha inválido"

**Causa:** El LLM está pasando "mañana" en lugar de "2025-10-16"

**Solución:** El prompt debe ser MÁS CLARO:

Añadir al prompt (ya está en PROMPT-SUPER-AGENT-CON-FECHA.txt):

```
IMPORTANTE: Cuando uses check_availability:
- date: SIEMPRE en formato YYYY-MM-DD (2025-10-16, NO "mañana")
- time: SIEMPRE en formato HH:MM (21:00, NO "9 de la noche")
- party_size: SIEMPRE número entero (4, NO "cuatro")
- restaurant_id: Usa {{ $json.restaurant_id }}
```

---

### Error: "No parameters are set up"

**Verificar:**
1. ¿El workflow check-availability está importado?
2. ¿El workflowId está actualizado con el ID real?
3. ¿Los 4 campos están en Fields? (date, time, party_size, restaurant_id)

---

## ✅ CHECKLIST COMPLETO

- [ ] 1. Importar `Tool - check-availability.json` en N8N
- [ ] 2. Copiar Workflow ID
- [ ] 3. Abrir Workflow 3 (Super Agent)
- [ ] 4. Nodo "🔧 Tool: Consultar Disponibilidad" → cambiar workflowId
- [ ] 5. Añadir campo `restaurant_id` en Fields
- [ ] 6. Actualizar prompt del agente (nodo "🤖 Super Agent (GPT-4o)")
- [ ] 7. Pegar contenido de `PROMPT-SUPER-AGENT-CON-FECHA.txt`
- [ ] 8. Guardar Workflow 3
- [ ] 9. Activar ambos workflows
- [ ] 10. Probar con WhatsApp

---

**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 10 minutos  




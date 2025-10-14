# 📋 Workflows Principales de La-IA App

Este documento describe los 7 workflows principales de la aplicación, todos completamente funcionales y listos para producción.

---

## 🔥 WORKFLOWS CORE (4 workflows)

### 1A - WhatsApp Buffer - ACUMULADOR
**Archivo:** `1A-whatsapp-buffer-ACUMULADOR-FINAL.json`  
**Tipo:** Webhook (activo)  
**Función:** Recibe mensajes de WhatsApp vía webhook de Twilio, los acumula en un buffer utilizando UPSERT atómico y responde inmediatamente con "OK".

**Características:**
- ✅ UPSERT atómico en `whatsapp_message_buffer`
- ✅ `buffer_key` = `customer_phone` (todos los mensajes del mismo usuario van al mismo buffer)
- ✅ Resetea timer con cada mensaje nuevo
- ✅ Respuesta inmediata sin bloqueos

---

### 1B - WhatsApp Buffer - PROCESADOR (CRON)
**Archivo:** `1B-whatsapp-buffer-PROCESADOR-FINAL.json`  
**Tipo:** CRON (cada 7 segundos)  
**Función:** Procesa buffers inactivos por más de 15 segundos, los elimina y envía al Gateway.

**Características:**
- ✅ CRON cada 7 segundos
- ✅ Filtra buffers inactivos (>15s)
- ✅ **Orden profesional:** Preparar → Eliminar → Gateway
- ✅ Previene loops infinitos

---

### 2 - Gateway Unificado (FINAL)
**Archivo:** `2-gateway-unificado-FINAL.json`  
**Tipo:** Execute Workflow Trigger  
**Función:** Punto de entrada unificado. Gestiona clientes, crea conversaciones y delega al Super Agent.

**Características:**
- ✅ Normaliza input desde cualquier canal
- ✅ Busca o crea cliente en BD
- ✅ Crea conversación en `agent_conversations`
- ✅ Guarda mensaje entrante en `agent_messages`
- ✅ Delega al Super Agent Híbrido

---

### 3 - Super Agent Híbrido (FINAL)
**Archivo:** `3-super-agent-hibrido-FINAL.json`  
**Tipo:** Execute Workflow Trigger  
**Función:** Agente de IA que gestiona reservas, consultas y conversaciones con clientes.

**Características:**
- ✅ Clasificador LLM (GPT-4o-mini) para detectar intención
- ✅ Super Agent LLM (GPT-4o) con memoria conversacional
- ✅ 5 herramientas integradas:
  - Consultar disponibilidad
  - Crear reserva
  - Modificar reserva
  - Cancelar reserva
  - Info del restaurante
- ✅ Contexto optimizado (~400 tokens vs 2500)
- ✅ Respuesta vía WhatsApp (Twilio)
- ✅ Actualiza `agent_conversations` con metadata estructurada

---

## 🔔 WORKFLOWS DE RECORDATORIOS (3 workflows)

### 02 - Recordatorio 24h antes
**Archivo:** `02-recordatorio-24h-SIMPLE-FINAL.json`  
**Tipo:** CRON  
**Función:** Envía recordatorio por WhatsApp 24 horas antes de la reserva.

---

### 03 - Recordatorio 4h antes
**Archivo:** `03-recordatorio-4h-antes-FINAL.json`  
**Tipo:** CRON  
**Función:** Envía recordatorio por WhatsApp 4 horas antes de la reserva.

---

### 05 - Auto-liberación 2h antes
**Archivo:** `05-auto-liberacion-2h-antes-FINAL.json`  
**Tipo:** CRON  
**Función:** Cancela automáticamente reservas `pending_approval` que no fueron confirmadas 2h antes.

---

## 📊 ESTADO ACTUAL

| Workflow | Estado | Activo |
|----------|--------|--------|
| 1A - Buffer Acumulador | ✅ Funcional | ✅ Sí |
| 1B - Buffer Procesador | ✅ Funcional | ⚠️ Configurar |
| 2 - Gateway Unificado | ✅ Funcional | ⚠️ Trigger |
| 3 - Super Agent Híbrido | ✅ Funcional | ⚠️ Trigger |
| 02 - Recordatorio 24h | ✅ Funcional | ⚠️ Configurar |
| 03 - Recordatorio 4h | ✅ Funcional | ⚠️ Configurar |
| 05 - Auto-liberación 2h | ✅ Funcional | ⚠️ Configurar |

---

## 🚀 PASOS PARA ACTIVAR EN PRODUCCIÓN

### 1. Workflow 1A (Ya activo)
- ✅ Ya está activo y funcionando
- ✅ Webhook URL configurada en Twilio

### 2. Workflow 1B (CRON)
1. Importar en N8N
2. Activar CRON (cada 7 segundos)
3. Verificar logs en ejecuciones

### 3. Workflow 2 (Gateway)
- ✅ Ya está listo (se ejecuta desde 1B)

### 4. Workflow 3 (Super Agent)
1. Importar en N8N
2. Configurar IDs de las Tools (5 workflows separados):
   - `TOOL_CHECK_AVAILABILITY_ID`
   - `TOOL_CREATE_RESERVATION_ID`
   - `TOOL_MODIFY_RESERVATION_ID`
   - `TOOL_CANCEL_RESERVATION_ID`
   - `TOOL_GET_INFO_ID`

### 5. Workflows de recordatorios
1. Configurar CRON según necesidad
2. Activar uno por uno
3. Verificar envíos en Twilio

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `IMPLEMENTACION-FINAL-BUFFER-SYSTEM.md` → Arquitectura del sistema de buffer
- `README-BUFFER-SPLIT.md` → Por qué se dividió en 1A y 1B
- `SOLUCION-FINAL-BUFFER-DELETE.md` → Cómo se resolvió el problema de eliminación
- `AUDITORIA_ALMACENAMIENTO_COMPLETA.md` → Análisis de almacenamiento en Supabase
- `AUDITORIA_HERRAMIENTAS_Y_FUNCIONES.md` → Detalle de las 5 tools del Super Agent

---

**✅ TODOS LOS WORKFLOWS ESTÁN LISTOS Y PROBADOS.**

**🎯 PRÓXIMO PASO:** Activar workflows 1B, 02, 03 y 05 en N8N Cloud.


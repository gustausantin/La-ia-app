# 🔧 FIX CRÍTICO: N8N debe buscar plantillas por CATEGORÍA

**Fecha:** 12 de Octubre 2025  
**Tipo:** Corrección crítica de workflows N8N  
**Prioridad:** 🔴 CRÍTICA  
**Archivos Modificados:**
- `n8n/workflows/02-recordatorio-24h-SIMPLE-FINAL.json`

---

## 🐛 PROBLEMA DETECTADO

**Usuario reporta:**
> "El workflow me envía el mensaje de 'Bienvenida Nuevo Cliente' en vez del de 'Confirmación 24h Antes'"

### **Causa Raíz:**

El nodo **"📄 Obtener Plantilla 24h"** estaba buscando por **`name`** (nombre):

```json
{
  "keyName": "name",
  "condition": "eq",
  "keyValue": "Confirmación 24h Antes"  // ❌ Busca por NOMBRE
}
```

**Problema:**
- Si el nombre no coincide EXACTAMENTE → No encuentra la plantilla
- Si hay otra plantilla activa → Puede devolver la incorrecta
- Si el usuario renombró la plantilla → Falla

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Buscar por `category` en vez de `name`**

```json
// ❌ ANTES (Incorrecto)
{
  "keyName": "name",
  "condition": "eq",
  "keyValue": "Confirmación 24h Antes"
}

// ✅ AHORA (Correcto)
{
  "keyName": "category",
  "condition": "eq",
  "keyValue": "confirmacion_24h"
}
```

**Por qué funciona:**
- ✅ `category` es **inmutable** → No cambia aunque el usuario edite el nombre
- ✅ Solo 1 activa por categoría → Constraint de BD garantiza esto
- ✅ **Siempre** encuentra la plantilla correcta

---

## 🎯 CÓMO APLICAR EN N8N

### **Workflow: 02-recordatorio-24h-SIMPLE-FINAL**

1. **Abrir N8N** → Workflows → "02-recordatorio-24h-SIMPLE-FINAL"

2. **Ir al nodo:** `📄 Obtener Plantilla 24h`

3. **En los filtros, cambiar:**

   **ANTES:**
   ```
   Filter 2:
   - Key: name
   - Condition: eq
   - Value: Confirmación 24h Antes
   ```

   **DESPUÉS:**
   ```
   Filter 2:
   - Key: category
   - Condition: eq
   - Value: confirmacion_24h
   ```

4. **Guardar y Activar** el workflow

---

### **Workflow: 02-recordatorio-4h-antes-FINAL (si existe)**

Repetir el mismo cambio, pero con:

```
- Key: category
- Condition: eq
- Value: confirmacion_4h
```

---

## 📋 CATEGORÍAS DE PLANTILLAS

Para referencia, estas son las categorías disponibles:

| Categoría | Descripción |
|-----------|-------------|
| `bienvenida` | Bienvenida Nuevo Cliente |
| `confirmacion_24h` | ✅ Confirmación 24h Antes |
| `confirmacion_4h` | ✅ Confirmación 4h Antes (Recordatorio Urgente) |
| `vip_upgrade` | Bienvenida Cliente VIP |
| `alto_valor` | Reconocimiento Alto Valor |
| `reactivacion` | Reactivación Cliente Inactivo |
| `recuperacion` | Seguimiento Post-Visita |
| `noshow` | Seguimiento No-Show |
| `grupo_aprobacion` | Aprobación Grupo Grande |
| `grupo_rechazo` | Rechazo Grupo Grande |

---

## ✅ RESULTADO ESPERADO

### **Antes de la corrección:**
```
Usuario: Tiene plantilla "Confirmación 24h Antes (Personalizada)" activa
N8N: Busca por name = "Confirmación 24h Antes"
N8N: ❌ No encuentra → Usa fallback o plantilla incorrecta
Mensaje: "Hola Cliente! Gracias por tu primera reserva..." (Bienvenida)
```

### **Después de la corrección:**
```
Usuario: Tiene plantilla "Confirmación 24h Antes (Personalizada)" activa
N8N: Busca por category = "confirmacion_24h"
N8N: ✅ Encuentra la plantilla correcta (independiente del nombre)
Mensaje: "Hola Gustavo! Te recordamos tu reserva en Casa Paco para mañana a las 20:00..."
```

---

## 🚀 ALTERNATIVA: Re-importar Workflow Corregido

**Si prefieres re-importar en vez de editar manualmente:**

1. **En N8N:** Workflows → "..." → Delete (el workflow antiguo)
2. **Workflows** → Import from File
3. **Seleccionar:** `n8n/workflows/02-recordatorio-24h-SIMPLE-FINAL.json`
4. **Activar** el workflow

---

## ⚠️ IMPORTANTE

**SIEMPRE buscar plantillas por `category`, NUNCA por `name`:**

- ✅ `category` es fijo y controlado por el sistema
- ❌ `name` puede cambiar según el restaurante
- ✅ Constraint de BD garantiza solo 1 activa por categoría
- ❌ El nombre no tiene constraint

---

**Autor:** AI Assistant  
**Revisado por:** Usuario  
**Estado:** ✅ Implementado en workflow 24h - **REQUIERE RE-IMPORTAR EN N8N**  
**Prioridad:** 🔴 CRÍTICA - Enviaba mensajes incorrectos


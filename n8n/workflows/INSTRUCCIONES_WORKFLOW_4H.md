# 📋 INSTRUCCIONES: Workflow Recordatorio 4h Antes

**Archivo:** `03-recordatorio-4h-antes-FINAL.json`  
**Fecha:** 12 de Octubre 2025

---

## 🎯 OBJETIVO:

Enviar recordatorios automáticos por WhatsApp a clientes que tienen reservas **en 4 horas**, usando plantillas personalizadas desde Supabase.

---

## 📝 CAMBIOS RESPECTO AL WORKFLOW 24H:

### 1️⃣ **Cron Schedule** (Nodo 1)
```javascript
// ❌ 24h: Cron Diario 10:00 AM
"expression": "0 10 * * *"

// ✅ 4h: Cron Cada 2 Horas
"expression": "0 */2 * * *"
```
**Razón:** Se ejecuta cada 2 horas para capturar reservas en ventana de 4h.

---

### 2️⃣ **Filtro de Reservas** (Nodo 3)
```javascript
// ❌ 24h: Filtrar reservas para MAÑANA
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];
return data.reservation_date === tomorrowStr;

// ✅ 4h: Filtrar reservas para HOY entre 4-4.5h
const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
const hoursUntil = (reservationDateTime - now) / (1000 * 60 * 60);
return data.reservation_date === todayStr && hoursUntil >= 4 && hoursUntil <= 4.5;
```
**Razón:** Ventana de 30 min para evitar múltiples envíos.

---

### 3️⃣ **Plantilla Supabase** (Nodo 7)
```javascript
// ❌ 24h:
{
  "keyName": "category",
  "keyValue": "confirmacion_24h"
}

// ✅ 4h:
{
  "keyName": "category",
  "keyValue": "confirmacion_4h"
}
```
**Razón:** Usa la plantilla "Confirmación 4h Antes" activa del restaurante.

---

### 4️⃣ **Mensaje Fallback** (Nodo 8)
```javascript
// ❌ 24h:
template = `Hola {{customer_name}}! Te recordamos tu reserva en {{restaurant_name}} para mañana...`;

// ✅ 4h:
template = `🚨 RECORDATORIO URGENTE 🚨\n\nHola {{customer_name}}!\n\nTu reserva en {{restaurant_name}} es en 4 HORAS...`;
```
**Razón:** Mensaje más urgente para recordatorio de 4h.

---

### 5️⃣ **Registro en DB** (Nodo 10)
```javascript
// ❌ 24h:
"message_type": "Confirmación 24h antes"

// ✅ 4h:
"message_type": "Confirmación 4h antes"
```
**Razón:** Identificar tipo de recordatorio en `customer_confirmations`.

---

## 🚀 CÓMO IMPORTAR:

### **PASO 1: Importar Workflow**
1. Abrir N8N: `http://localhost:5678`
2. Click en **"Add workflow"** (+ arriba derecha)
3. Click en el menú `⋮` → **"Import from File"**
4. Seleccionar: `n8n/workflows/03-recordatorio-4h-antes-FINAL.json`

---

### **PASO 2: Verificar Credenciales**
Asegurarse de que estos nodos tienen las credenciales correctas:

1. **📊 Obtener TODAS las Reservas** → `Supabase La-IA`
2. **📍 Obtener Config Restaurante** → `Supabase La-IA`
3. **📄 Obtener Plantilla 4h** → `Supabase La-IA`
4. **📱 Twilio: Enviar WhatsApp** → `Twilio account`
5. **💾 Registrar Confirmación** → `Supabase La-IA`

---

### **PASO 3: Activar Workflow**
1. Click en el **toggle** arriba a la derecha para activar
2. El cron se ejecutará automáticamente **cada 2 horas**

---

## ✅ VERIFICACIÓN:

### **Comprobar que existe la plantilla:**
```sql
SELECT id, name, category, is_active, preview
FROM message_templates
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND category = 'confirmacion_4h'
  AND is_active = true;
```

**Debe devolver:**
```
name: "Recordatorio Urgente"
category: "confirmacion_4h"
is_active: true
```

---

### **Probar con ejecución manual:**
1. En N8N, abrir el workflow
2. Click en **"Execute Workflow"**
3. Verificar output de cada nodo
4. Si hay reservas en 4h → Debe enviar WhatsApp

---

## 📊 LÓGICA DE FILTRADO:

**Ejemplo:**
- **Hora actual:** 14:00
- **Reserva A:** 18:00 (4h) → ✅ ENVIAR
- **Reserva B:** 18:15 (4.25h) → ✅ ENVIAR
- **Reserva C:** 18:30 (4.5h) → ✅ ENVIAR
- **Reserva D:** 19:00 (5h) → ❌ NO (fuera de ventana)
- **Reserva E:** 17:30 (3.5h) → ❌ NO (muy pronto)

**Ventana:** Entre 4h y 4.5h → 30 minutos

---

## 🔧 CONFIGURACIÓN CRON:

```
0 */2 * * *
│ │  │ │ │
│ │  │ │ └── Día de la semana (any)
│ │  │ └──── Mes (any)
│ │  └────── Día del mes (any)
│ └──────── Hora (cada 2 horas)
└────────── Minuto (0)
```

**Ejecuciones:**
- 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00

---

## ⚠️ IMPORTANTE:

1. **Ventana de 30 min:** Evita envíos duplicados
2. **Solo `status = 'pending'`:** No envía si ya está confirmada
3. **Solo reservas HOY:** Filtra por `reservation_date = today`
4. **Requiere plantilla activa:** Si no existe `confirmacion_4h`, usa fallback

---

**Estado:** ✅ Listo para importar y activar


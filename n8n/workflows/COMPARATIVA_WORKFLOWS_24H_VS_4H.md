# 📊 COMPARATIVA: Workflow 24h vs 4h

**Fecha:** 12 de Octubre 2025

---

## 🔀 DIFERENCIAS CLAVE:

| **ELEMENTO** | **24h ANTES** | **4h ANTES** |
|--------------|---------------|--------------|
| **Archivo** | `02-recordatorio-24h-SIMPLE-FINAL.json` | `03-recordatorio-4h-antes-FINAL.json` |
| **Cron Expression** | `0 10 * * *` (Diario 10:00 AM) | `0 */2 * * *` (Cada 2 horas) |
| **Frecuencia** | 1 vez al día | 12 veces al día |
| **Reservas objetivo** | MAÑANA (`tomorrow`) | HOY (`today`) |
| **Ventana de tiempo** | Todas las del día siguiente | Entre 4h y 4.5h desde ahora |
| **Filtro fecha** | `reservation_date === tomorrowStr` | `reservation_date === todayStr && hoursUntil >= 4 && hoursUntil <= 4.5` |
| **Categoría plantilla** | `confirmacion_24h` | `confirmacion_4h` |
| **Nombre plantilla DB** | "Confirmación 24h Antes" | "Recordatorio Urgente" |
| **Tono del mensaje** | Informativo, tranquilo | Urgente, recordatorio |
| **Emoji fallback** | 👋 | 🚨 |
| **message_type en DB** | "Confirmación 24h antes" | "Confirmación 4h antes" |

---

## 📝 CÓDIGO SIDE-BY-SIDE:

### 1️⃣ **NODO CRON:**

#### 24h:
```json
{
  "name": "⏰ Cron Diario 10:00 AM",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 10 * * *"
        }
      ]
    }
  }
}
```

#### 4h:
```json
{
  "name": "⏰ Cron Cada 2 Horas",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 */2 * * *"
        }
      ]
    }
  }
}
```

---

### 2️⃣ **NODO FILTRO:**

#### 24h:
```javascript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const filtered = $input.all().filter(item => {
  const data = item.json;
  return data.reservation_date === tomorrowStr &&
         data.status === 'pending' &&
         data.customer_phone !== null &&
         data.customer_phone !== '';
});
```

#### 4h:
```javascript
const now = new Date();
const todayStr = now.toISOString().split('T')[0];

const filtered = $input.all().filter(item => {
  const data = item.json;
  
  if (data.reservation_date !== todayStr) return false;
  if (data.status !== 'pending' || !data.customer_phone) return false;
  
  const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
  const hoursUntil = (reservationDateTime - now) / (1000 * 60 * 60);
  
  return hoursUntil >= 4 && hoursUntil <= 4.5;
});
```

---

### 3️⃣ **NODO OBTENER PLANTILLA:**

#### 24h:
```json
{
  "name": "📄 Obtener Plantilla 24h",
  "filters": {
    "conditions": [
      {
        "keyName": "category",
        "keyValue": "confirmacion_24h"
      }
    ]
  }
}
```

#### 4h:
```json
{
  "name": "📄 Obtener Plantilla 4h",
  "filters": {
    "conditions": [
      {
        "keyName": "category",
        "keyValue": "confirmacion_4h"
      }
    ]
  }
}
```

---

### 4️⃣ **MENSAJE FALLBACK:**

#### 24h:
```javascript
template = `Hola {{customer_name}}! 👋

Te recordamos tu reserva en {{restaurant_name}} para mañana a las {{reservation_time}} para {{party_size}} persona(s).

¡Te esperamos!`;
```

#### 4h:
```javascript
template = `🚨 RECORDATORIO URGENTE 🚨

Hola {{customer_name}}!

Tu reserva en {{restaurant_name}} es en 4 HORAS a las {{reservation_time}} para {{party_size}} persona(s).

¡Te esperamos pronto!`;
```

---

### 5️⃣ **REGISTRO EN DB:**

#### 24h:
```json
{
  "fieldId": "message_type",
  "fieldValue": "Confirmación 24h antes"
}
```

#### 4h:
```json
{
  "fieldId": "message_type",
  "fieldValue": "Confirmación 4h antes"
}
```

---

## 📋 RESUMEN:

### **LO QUE ES IGUAL:**
✅ Estructura general del workflow  
✅ Normalización de teléfono  
✅ Obtención de config restaurante  
✅ Sistema de variables `{{customer_name}}`, etc.  
✅ Envío por Twilio  
✅ Registro en `customer_confirmations`  

### **LO QUE CAMBIA:**
🔄 Frecuencia de ejecución (1x día vs 12x día)  
🔄 Reservas objetivo (mañana vs hoy)  
🔄 Ventana de tiempo (todo el día vs 4-4.5h)  
🔄 Categoría de plantilla (`confirmacion_24h` vs `confirmacion_4h`)  
🔄 Tono del mensaje (informativo vs urgente)  

---

## 🎯 CUÁNDO SE ENVÍA CADA UNO:

### **Ejemplo: Reserva para HOY 13/10 a las 20:00**

#### Workflow 24h:
- **Se ejecuta:** AYER 12/10 a las 10:00 AM
- **Mensaje:** "Tu reserva en Casa Paco para **mañana** a las 20:00..."
- **Objetivo:** Recordatorio anticipado

#### Workflow 4h:
- **Se ejecuta:** HOY 13/10 a las 16:00 (4h antes)
- **Mensaje:** "🚨 Tu reserva en Casa Paco es en **4 HORAS** a las 20:00..."
- **Objetivo:** Recordatorio urgente de última hora

---

**Estado:** ✅ Workflows complementarios listos para usar


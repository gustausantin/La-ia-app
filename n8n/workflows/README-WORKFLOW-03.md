# 📞 WORKFLOW 3: Alerta Llamada Urgente (2h antes)

## 🎯 Objetivo
Detectar reservas de **ALTO RIESGO** (score >60) que están a 2-3 horas y crear alertas urgentes para que el equipo del restaurante llame al cliente.

---

## ⚙️ Configuración

### 🕐 Frecuencia
- **Cron**: `*/15 * * * *` (cada 15 minutos)

### 📊 Criterios de Filtrado
Busca reservas que cumplan **TODOS** estos requisitos:
- ⏰ **Tiempo**: Entre 2-3 horas hasta la reserva
- 🔴 **Riesgo**: `noshow_risk_score > 60` (Alto/Crítico)
- ✅ **Estado**: `pending` o `confirmed`
- 📱 **Teléfono**: Válido y no vacío

---

## 🔄 Flujo del Workflow

### 1️⃣ **⏰ Cron Cada 15 min**
- Se ejecuta automáticamente cada 15 minutos
- Busca constantemente reservas de riesgo

### 2️⃣ **📊 Obtener TODAS las Reservas**
- Tabla: `reservations`
- Operation: `Get All`
- Return All: `true`

### 3️⃣ **🔍 Filtrar: Riesgo Alto 2-3h**
Código JavaScript que filtra:
```javascript
const hoursUntil = (reservationTime - nowTime) / (1000 * 60 * 60);
return hoursUntil >= 2 && 
       hoursUntil <= 3 &&
       data.noshow_risk_score > 60 &&
       (data.status === 'pending' || data.status === 'confirmed');
```

### 4️⃣ **❓ ¿Hay Reservas Riesgo Alto?**
- Si **SÍ** → Continúa al Loop
- Si **NO** → Termina (✅ Fin)

### 5️⃣ **🔁 Loop Cada Reserva**
Procesa cada reserva de alto riesgo individualmente

### 6️⃣ **📞 Preparar Datos**
- Normaliza teléfono (añade `+34` si falta)
- Calcula `hours_remaining` y `minutes_remaining`

### 7️⃣ **📍 Obtener Config Restaurante**
- Tabla: `restaurants`
- Obtiene configuración del restaurante
- Para futuros envíos de notificaciones (email, Slack, etc.)

### 8️⃣ **🚨 Crear Alerta Urgente**
- Tabla: `noshow_alerts`
- Operation: `Create`
- Campos:
  - `alert_type`: `high_risk_no_confirmation`
  - `risk_score`: Score del cliente
  - `time_until_reservation_minutes`: Minutos restantes
  - `customer_name`, `customer_phone`, `party_size`, `reservation_time`
  - `message`: "🔴 URGENTE: Cliente {nombre} - Riesgo {score}% - Llamar AHORA"
  - `status`: `pending`

### 9️⃣ **💾 Registrar Acción Urgente**
- Tabla: `customer_confirmations`
- Operation: `Create`
- Campos:
  - `message_type`: `Llamada urgente`
  - `message_content`: Detalles de la alerta
  - Tracking para métricas

### 🔟 **🔁 Volver al Loop**
Continúa con la siguiente reserva de riesgo alto

---

## 📋 Datos que Escribe en Supabase

### Tabla: `noshow_alerts`
```sql
{
  reservation_id: UUID,
  restaurant_id: UUID,
  alert_type: 'high_risk_no_confirmation',
  risk_score: INT,
  time_until_reservation_minutes: INT,
  customer_name: TEXT,
  customer_phone: TEXT,
  party_size: INT,
  reservation_time: TIME,
  message: TEXT,
  status: 'pending',
  created_at: TIMESTAMPTZ
}
```

### Tabla: `customer_confirmations`
```sql
{
  reservation_id: UUID,
  restaurant_id: UUID,
  customer_id: UUID,
  message_type: 'Llamada urgente',
  sent_at: TIMESTAMPTZ,
  message_content: TEXT
}
```

---

## 🎨 Características Especiales

### ✅ Multi-tenant
- Cada alerta se asocia al `restaurant_id` correcto
- Permite gestión independiente por restaurante

### ✅ No Duplica Alertas
- Si ya existe una alerta `pending` para esa reserva, **no se duplica** (lógica a nivel de frontend/DB)

### ✅ Tracking Completo
- Cada acción queda registrada en `customer_confirmations`
- Permite análisis posterior de efectividad

---

## 🚀 Siguientes Pasos (Futuras Mejoras)

### 📧 Notificación al Staff
Añadir nodos para enviar:
- **Email** al gerente del restaurante
- **SMS** al encargado de turno
- **Slack/Discord** al canal #urgencias
- **Push Notification** a la app móvil

### 📞 Integración Twilio Call
- Llamada automática al cliente
- IVR para confirmar/cancelar
- Registro de resultado de llamada

---

## 🔧 Troubleshooting

### ❌ No se crean alertas
1. Verificar que existen reservas con `noshow_risk_score > 60`
2. Verificar que están en la ventana 2-3h
3. Revisar logs de Supabase para errores de INSERT

### ❌ Error: "violates check constraint"
- Verificar que `alert_type` es uno de los valores permitidos en el CHECK constraint
- Verificar que todos los campos NOT NULL tienen valor

### ❌ Alertas duplicadas
- Revisar lógica de frontend para prevenir duplicados
- Considerar añadir UNIQUE constraint en DB

---

## 📊 Métricas Clave

- **Alertas creadas por día**
- **Tasa de resolución** (resolved/pending)
- **Tiempo promedio de resolución**
- **% de no-shows prevenidos tras llamada urgente**

---

**Versión**: 1.0  
**Fecha**: 10 Octubre 2025  
**Estado**: ✅ PRODUCCIÓN



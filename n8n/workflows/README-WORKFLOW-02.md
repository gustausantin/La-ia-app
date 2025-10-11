# 📱 Workflow N8n: Recordatorio 4 Horas Antes

## 📋 Descripción
Workflow automatizado que envía recordatorios por WhatsApp 4 horas antes de cada reserva.

## 🔄 Flujo del Workflow

```
⏰ Cron (cada 30 min)
    ↓
📊 Obtener Reservas 4h Window (RPC)
    ↓
🔍 Filtrar: Sin Mensaje 4h Previo
    ↓
❓ ¿Hay Reservas?
    ↓ (Si)
🔁 Loop Cada Reserva
    ↓
📞 Normalizar Teléfono + Calcular Horas
    ↓
📍 Obtener Config Restaurante
    ↓
📱 Twilio: Enviar WhatsApp 4h
    ↓
💾 Registrar Confirmación 4h
    ↓ (volver al loop)
```

## ⏰ Diferencias con Workflow 01 (24h)

| Característica | Workflow 01 (24h) | Workflow 02 (4h) |
|----------------|-------------------|------------------|
| **Frecuencia** | 1 vez/día (10:00 AM) | Cada 30 minutos |
| **Ventana** | Mañana (24h) | 4-5h desde ahora |
| **Filtro** | `status = 'pending'` | Sin mensaje 4h previo |
| **Mensaje** | "Te esperamos mañana..." | "En 4 horas..." |
| **RPC** | Filtro manual | `get_reservations_4h_window()` |

## 🎯 Multi-Tenant

✅ **100% multi-tenant**:
- Usa RPC helper `get_reservations_4h_window()` que ya creamos
- Obtiene config de restaurante dinámicamente
- No hay hardcodes

## 📊 Datos de Supabase

### RPC Helper Function
```sql
SELECT * FROM get_reservations_4h_window();
```

Retorna reservas que:
- Están entre 4-5 horas de ahora
- Status: `pending` o `confirmed`
- Tienen teléfono válido

### Filtro Adicional (en N8n)
```javascript
// Solo enviar si NO ha recibido mensaje de 4h
!data.confirmacion_4h_sent || data.confirmacion_4h_sent === false
```

## 📝 Mensaje de WhatsApp

```
Hola {{customer_name}}! 👋

Te recordamos que tu reserva es *en {{hours_remaining}} horas* 
(a las {{reservation_time}}) para *{{party_size}} personas*.

¿Todo sigue en pie? 🤔

✅ Responde SÍ para confirmar
❌ Responde NO si necesitas cancelar

Gracias! 🍽️
```

## ⚙️ Configuración

### Horario
- **Cron**: `*/30 * * * *` (cada 30 minutos)
- Se ejecuta 48 veces al día
- Ventana de oportunidad más amplia que el 24h

### Lógica de Filtrado
1. RPC obtiene reservas en ventana 4-5h
2. Nodo Code filtra las que NO tienen `confirmacion_4h_sent`
3. Solo envía a las que cumplen ambas condiciones

## 🔧 Registro en BD

Guarda en `customer_confirmations`:
- **message_type**: `'Confirmación 4h antes'`
- **sent_at**: Timestamp actual
- **reservation_id**: ID de la reserva
- **restaurant_id**: ID del restaurante
- **message_content**: Cuerpo del mensaje enviado

## 🐛 Troubleshooting

### No se envían mensajes
**Causa 1**: Ya se envió mensaje 4h previo
- **Solución**: Verificar `customer_confirmations` con `message_type = 'Confirmación 4h antes'`

**Causa 2**: Reserva fuera de ventana 4-5h
- **Solución**: Verificar que RPC `get_reservations_4h_window()` retorna datos

**Causa 3**: Teléfono inválido o sin `+`
- **Solución**: Ya está resuelto con normalización automática (migración 003)

### Mensajes duplicados
**Causa**: El filtro de `confirmacion_4h_sent` no funciona
- **Solución**: Verificar que el registro en `customer_confirmations` se está haciendo correctamente

## 🚀 Mejoras Futuras

1. **Variable de ventana**: Hacer configurable 3h, 4h, 5h por restaurante
2. **Mensaje dinámico**: Usar plantillas de BD por idioma
3. **Skip si ya confirmó**: Si respondió al mensaje 24h, no enviar 4h
4. **Métricas**: Dashboard de tasa de respuesta 4h vs 24h

## 📊 Métricas

Con este workflow puedes medir:
- **Tasa de respuesta 4h** vs 24h
- **Tiempo de respuesta** desde envío hasta confirmación
- **Efectividad por hora** (¿a qué hora responden más?)
- **Cancelaciones last-minute** detectadas a tiempo

## 🔗 Dependencias

**Requiere:**
- ✅ Migración `20251010_001_n8n_helper_functions.sql` (RPC)
- ✅ Migración `20251010_002_normalize_customer_data.sql` (customers)
- ✅ Migración `20251010_003_normalize_phone_numbers.sql` (normalización)
- ✅ Tabla `customer_confirmations`

**Workflow anterior:**
- Workflow 01 (24h) debe estar activo para mejor coverage



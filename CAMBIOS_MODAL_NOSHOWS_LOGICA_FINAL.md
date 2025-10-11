# 🔧 CAMBIOS EN MODAL DE NO-SHOWS - LÓGICA FINAL

## 📋 PROBLEMA IDENTIFICADO:

El modal de "Detalles de Riesgo" mostraba **2 botones** (Enviar WhatsApp + Marcar Confirmado) en todas las situaciones, lo cual era confuso e incorrecto para reservas en **ventana crítica** (T-2h 15min → T-2h).

---

## ✅ SOLUCIÓN IMPLEMENTADA:

### 🕐 **LÓGICA POR TIEMPO:**

#### **Si faltan MÁS de 2h 15min** (135 minutos):
- 📱 **Botón "Enviar WhatsApp"** → VISIBLE
- 🔵 **Botón "Marcar Confirmado"** → VISIBLE
- 📝 **Mensaje:** "Acciones Recomendadas" (azul)
- 💬 Instrucciones normales según riesgo

#### **Si faltan MENOS de 2h 15min** (ventana crítica T-2h 15min → T-2h):
- ❌ **Botón "Enviar WhatsApp"** → **OCULTO** (ya se enviaron 2 WhatsApps automáticos)
- 🔵 **Botón "Marcar Confirmado"** → VISIBLE (único botón)
- 🚨 **Mensaje:** "ACCIÓN URGENTE REQUERIDA" (rojo, con animación)
- 📞 **Instrucciones claras:**
  - "LLAMAR AHORA AL CLIENTE por teléfono"
  - "Si confirma → Clic en 'Marcar Confirmado'"
  - "Si no contesta → Esperar hasta T-2h (auto-liberación)"

---

## 🎯 QUÉ HACE CADA BOTÓN:

### 📱 **"Enviar WhatsApp"** (solo si T > 2h 15min):
- Envía un WhatsApp manual al cliente
- Por ahora es una simulación (toast de éxito)
- Se puede implementar integración con Twilio más adelante

### 🔵 **"Marcar Confirmado"** (siempre visible):
**Después de llamar al cliente y confirmar, este botón:**
1. Actualiza el estado de la reserva a `confirmed` en Supabase
2. Registra la confirmación en `customer_confirmations`:
   - `message_type: 'Llamada urgente'`
   - `confirmed: true`
   - `response_time_minutes: 0` (confirmación inmediata)
3. Recalcula dinámicamente el `risk_score` (baja mucho)
4. La reserva desaparece de "Alto Riesgo"
5. Muestra toast de éxito ✅

---

## 📊 FLUJO COMPLETO:

```
1. Staff ve reserva con riesgo 85% a las 16:19
   Reserva: Lucía Meria Mamia - 18:00 (faltan 1h 41min)
   
2. Abre modal → Ve mensaje rojo:
   🚨 ACCIÓN URGENTE REQUERIDA
   📞 LLAMAR AHORA AL CLIENTE por teléfono
   
3. Staff llama al cliente → Cliente confirma ✅
   
4. Staff hace clic en "Marcar Confirmado"
   
5. Sistema:
   - Actualiza reserva → status: 'confirmed'
   - Registra en customer_confirmations
   - Recalcula riesgo dinámicamente (-50 pts)
   - Nuevo score: 35% (Riesgo Medio)
   
6. Reserva desaparece de "Alto Riesgo" o baja su prioridad
```

---

## 🔄 INTEGRACIÓN CON WORKFLOWS:

### Workflow 01 (T-24h):
- ✅ Envía WhatsApp automático
- ✅ Registra en `customer_confirmations`

### Workflow 02 (T-4h):
- ✅ Envía WhatsApp automático
- ✅ Registra en `customer_confirmations`

### Workflow 03 (T-2h 15min):
- ✅ Crea alerta en `noshow_alerts`
- ✅ Envía email al staff
- ❌ **NO envía WhatsApp** (staff debe llamar)
- ✅ Staff usa el modal para "Marcar Confirmado"

### Workflow 04 (T-2h = 1h 59min):
- ✅ Auto-liberación si NO confirmó
- ✅ Estado → `noshow`
- ✅ Mesa → LIBERADA

---

## 📁 ARCHIVOS MODIFICADOS:

1. **`src/components/noshows/NoShowReservationDetail.jsx`**
   - Agregado cálculo de tiempo restante (`timeUntilReservation`)
   - Agregada variable `isUrgentCallWindow` (<=135 min && >120 min)
   - Modificada sección "Acciones Recomendadas" (rojo si urgente)
   - Ocultado botón "Enviar WhatsApp" en ventana crítica
   - Importados `useMemo`, `parseISO`, `differenceInMinutes`, `PhoneCall`

2. **`src/pages/NoShowControlNuevo.jsx`**
   - Agregadas props `onSendWhatsApp` y `onMarkConfirmed` al modal
   - Implementada lógica de confirmación:
     - Actualiza `reservations.status`
     - Inserta en `customer_confirmations`
     - Recarga datos

---

## 🧪 CÓMO PROBAR:

1. **Caso 1: Reserva con mucho tiempo (>2h 15min)**
   - Abrir modal → Debe mostrar **2 botones**
   - Mensaje azul: "Acciones Recomendadas"

2. **Caso 2: Reserva urgente (<2h 15min)**
   - Abrir modal → Debe mostrar **1 botón** (Marcar Confirmado)
   - Mensaje rojo: "🚨 ACCIÓN URGENTE REQUERIDA"
   - Icono de teléfono con animación pulse

3. **Caso 3: Marcar como confirmado**
   - Clic en "Marcar Confirmado"
   - Toast: "Marcando como confirmado..."
   - Toast: "✅ Reserva confirmada correctamente"
   - Modal se cierra
   - Reserva desaparece de lista o baja riesgo

---

## ✅ RESULTADO:

- **Lógica clara y simple** según el tiempo
- **Staff sabe exactamente qué hacer** en cada momento
- **No hay confusión** sobre cuándo enviar WhatsApp vs llamar
- **Sistema dinámico** que ajusta el riesgo automáticamente
- **Preparado para Workflow 04** (auto-liberación)



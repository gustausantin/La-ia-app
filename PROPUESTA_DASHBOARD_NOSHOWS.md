# 📋 PROPUESTA: REDISEÑO DASHBOARD + NO-SHOWS

## 🎯 OBJETIVO
Mejorar el Dashboard para incluir información de **canales activos** y crear una **página dedicada a No-Shows** con estadísticas y acciones.

---

## 📊 AUDITORÍA COMPLETADA

### **1. ESTADO ACTUAL DEL DASHBOARD**

**Card "Control No-Shows" en Dashboard:**
```jsx
// src/pages/DashboardAgente.jsx - línea ~450
<div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    ALERTAS NO-SHOW
                </h3>
                <p className="text-xs text-gray-500">Control de riesgo</p>
            </div>
        </div>
    </div>
    <div className="text-center py-4">
        <p className="text-4xl font-bold text-gray-900">{noShowAlerts || 0}</p>
        <p className="text-xs text-green-600 mt-1">
            ✓ Sin riesgo detectado
        </p>
    </div>
    <button className="w-full mt-4 bg-gradient-to-br from-purple-500 to-indigo-600...">
        Ver historial
    </button>
</div>
```

**Datos mostrados:**
- `noShowAlerts`: Número de reservas de alto riesgo de no-show HOY
- Botón "Ver historial" → navega a `/no-show-control`

---

### **2. ESTADO ACTUAL DE NO-SHOWS**

**Archivo principal:** `src/pages/NoShowControl.jsx` + `src/components/NoShowManagerProfesional.jsx`

**Funcionalidades existentes:**
- ✅ **Sistema predictivo de riesgo** (scoring de 0-100)
- ✅ **Tabla `noshow_actions`** en base de datos
- ✅ **Integración con plantillas CRM** (`message_templates`)
- ✅ **Envío de WhatsApp** para confirmar reservas
- ✅ **Tracking de respuestas** (pending, confirmed, no_response)
- ✅ **Estadísticas semanales** (no-shows prevenidos, tasa de éxito)

**Datos disponibles en `noshow_actions`:**
```sql
- reservation_id, customer_id, customer_name
- reservation_date, reservation_time, party_size
- risk_score (0-100), risk_level (low/medium/high)
- action_type (whatsapp_confirmation, call, email)
- channel (whatsapp, phone, email)
- customer_response (pending, confirmed, no_response, cancelled)
- final_outcome (pending, showed_up, noshow, cancelled)
- prevented_noshow (boolean)
- metadata (JSONB con factores de riesgo)
```

**UI actual en NoShowControl.jsx:**
```
+----------------------------------------------------------+
| 🎯 Sistema de Alerta Temprana   | 📊 No-Shows Prevenidos |
|     [X] reservas en riesgo      |     [Y] esta semana    |
+----------------------------------------------------------+
| 📋 Reservas de Riesgo para Hoy                           |
| - Cliente X | Hora | Mesa | Riesgo: 85% | [Confirmar]   |
| - Cliente Y | Hora | Mesa | Riesgo: 70% | [Confirmar]   |
+----------------------------------------------------------+
```

---

### **3. CANALES - ESTADO ACTUAL**

**Archivo de configuración:** `src/pages/Configuracion.jsx` → sección "Canales de Comunicación IA"

**Canales disponibles:**
1. **VAPI** (Llamadas IA) - `channels.vapi.enabled`
2. **WhatsApp Business** - `channels.whatsapp.enabled`
3. **Instagram** - `channels.instagram.enabled`
4. **Facebook Messenger** - `channels.facebook.enabled`
5. **Web Chat** - `channels.webchat.enabled`

**Datos en BD:** `restaurants.settings.channels` (JSONB)

**Hook existente:** `src/hooks/useChannelStats.js`
```javascript
const { channelStats } = useChannelStats();
// Retorna: { active: 2, total: 5, validChannels: ['vapi', 'whatsapp'] }
```

**NO HAY** estadísticas de uso por canal en el Dashboard actual.

---

## 🔄 PROPUESTA DE CAMBIOS

### **CAMBIO 1: DASHBOARD - Reemplazar "Control No-Shows" por "Canales Activos"**

**Nueva card:**
```
+-----------------------------------------------+
| 🔗 CANALES ACTIVOS                            |
| 2 de 5 canales operativos                     |
+-----------------------------------------------+
| ✅ VAPI (Llamadas)      | 12 reservas hoy     |
| ✅ WhatsApp             | 8 reservas hoy      |
| ⚪ Instagram            | Inactivo            |
| ⚪ Facebook             | Inactivo            |
| ⚪ Web Chat             | Inactivo            |
+-----------------------------------------------+
| [Gestionar Canales]                           |
+-----------------------------------------------+
```

**Datos a mostrar:**
1. **Canales activos vs totales** (desde `useChannelStats`)
2. **Estado de cada canal** (enabled + configurado correctamente)
3. **Reservas por canal HOY** (desde `reservations.reservation_channel`)
4. **Botón** → navega a `/configuracion` (tab canales)

**Validación de canales:**
- VAPI: `api_key` + `voice_number` (o `use_same_phone`)
- WhatsApp: `api_token` + `business_account_id` + `phone_number`
- Instagram: `access_token` + `business_account_id`
- Facebook: `page_access_token` + `page_id`
- Web Chat: siempre válido (sin credenciales externas)

---

### **CAMBIO 2: NUEVA PÁGINA DEDICADA - No-Show Control**

**Ruta:** `/no-show-control` (ya existe, pero mejorar)

#### **SECCIÓN 1: KPIs Principales**
```
+---------------------------------------+---------------------------------------+
| 🎯 RIESGO HOY                         | 📊 NO-SHOWS PREVENIDOS (7 días)      |
| 3 reservas en riesgo                  | 12 de 15 acciones exitosas (80%)     |
+---------------------------------------+---------------------------------------+
| 🛡️ TASA DE PREVENCIÓN (30 días)      | ⏱️ TIEMPO PROMEDIO RESPUESTA          |
| 85% (17/20)                           | 2.5 horas                             |
+---------------------------------------+---------------------------------------+
```

#### **SECCIÓN 2: ¿Qué es un No-Show?**
```
+--------------------------------------------------------------------+
| ℹ️ ¿QUÉ ES UN NO-SHOW?                                             |
| Un no-show es cuando un cliente no se presenta a su reserva sin    |
| cancelar previamente. Esto genera:                                 |
| - Pérdida de ingresos (~45€ por reserva en promedio)              |
| - Capacidad desperdiciada (esa mesa no se vendió)                 |
| - Impacto operativo (preparación de mesa, personal asignado)      |
+--------------------------------------------------------------------+
```

#### **SECCIÓN 3: Sistema Predictivo**
```
+--------------------------------------------------------------------+
| 🧠 CÓMO FUNCIONA NUESTRO SISTEMA PREDICTIVO                        |
|                                                                    |
| Analizamos automáticamente cada reserva con estos factores:       |
| ✓ Historial del cliente (visitas previas, no-shows pasados)       |
| ✓ Canal de reserva (teléfono directo = mayor confianza)           |
| ✓ Anticipación (reservas de última hora = mayor riesgo)           |
| ✓ Tamaño del grupo (grupos grandes sin señal = riesgo)            |
| ✓ Día y hora (viernes/sábado noche = mayor demanda)               |
|                                                                    |
| Resultado: Score de 0-100 por reserva                              |
| - 0-40: Riesgo bajo (verde) → Seguimiento opcional                |
| - 41-70: Riesgo medio (ámbar) → Monitoreo recomendado             |
| - 71-100: Riesgo alto (rojo) → Acción inmediata                   |
+--------------------------------------------------------------------+
```

#### **SECCIÓN 4: Reservas en Riesgo HOY**
```
+--------------------------------------------------------------------+
| 📋 RESERVAS QUE REQUIEREN ATENCIÓN (Hoy - 2025-10-09)             |
+--------------------------------------------------------------------+
| Cliente         | Hora   | Comensales | Riesgo | Estado  | Acción|
|-----------------|--------|------------|--------|---------|-------|
| María García    | 14:00  | 4 personas | 🔴 85% | Pend.   | [MSG] |
| Pedro López     | 20:30  | 2 personas | 🟡 65% | ✅ Conf.| [VER] |
| Ana Martínez    | 21:00  | 6 personas | 🔴 90% | Pend.   | [MSG] |
+--------------------------------------------------------------------+
| [Enviar mensajes masivos a todos los pendientes]                  |
+--------------------------------------------------------------------+
```

**Detalles al hacer clic en una reserva:**
```
+--------------------------------------------------------------------+
| DETALLES DE RIESGO - María García                                 |
+--------------------------------------------------------------------+
| Score: 85% (Alto Riesgo)                                           |
|                                                                    |
| Factores de riesgo detectados:                                    |
| 🔴 Cliente nuevo (primera visita)                                 |
| 🔴 Reserva realizada hace < 2 horas                               |
| 🟡 Grupo grande (4 personas) sin señal                            |
| 🟢 Canal: WhatsApp (media confianza)                              |
|                                                                    |
| Acciones recomendadas:                                             |
| ✉️ Enviar confirmación por WhatsApp (automático)                  |
| 📞 Llamar 2 horas antes si no responde                            |
| 💳 Solicitar señal (si política del restaurante)                  |
+--------------------------------------------------------------------+
| [Enviar WhatsApp] [Llamar Ahora] [Marcar como Confirmado]         |
+--------------------------------------------------------------------+
```

#### **SECCIÓN 5: Historial y Tendencias**
```
+--------------------------------------------------------------------+
| 📈 TENDENCIAS (Últimos 30 días)                                    |
+--------------------------------------------------------------------+
| [Gráfico de línea]                                                 |
| No-Shows detectados vs Prevenidos por día                          |
|                                                                    |
| Día        | Detectados | Prevenidos | Tasa Éxito                 |
|------------|------------|------------|----------------------------|
| 2025-10-08 | 5          | 4          | 80%                        |
| 2025-10-07 | 3          | 3          | 100%                       |
| 2025-10-06 | 2          | 1          | 50%                        |
+--------------------------------------------------------------------+
```

#### **SECCIÓN 6: Acciones Configurables**
```
+--------------------------------------------------------------------+
| ⚙️ CONFIGURAR ACCIONES AUTOMÁTICAS                                 |
+--------------------------------------------------------------------+
| Riesgo Alto (>70):                                                 |
| ✅ Enviar WhatsApp automático 4h antes                             |
| ✅ Llamar si no responde en 2h                                     |
| ⚪ Solicitar señal de €10                                          |
|                                                                    |
| Riesgo Medio (40-70):                                              |
| ✅ Enviar WhatsApp 2h antes                                        |
| ⚪ Llamar si no responde                                           |
|                                                                    |
| Riesgo Bajo (<40):                                                 |
| ⚪ No tomar acciones                                               |
| ⚪ Enviar recordatorio opcional                                    |
+--------------------------------------------------------------------+
| [Guardar Configuración]                                            |
+--------------------------------------------------------------------+
```

---

## 📂 ARCHIVOS A MODIFICAR

### **Dashboard:**
1. `src/pages/DashboardAgente.jsx`
   - Eliminar card "Control No-Shows"
   - Añadir nueva card "Canales Activos"
   - Fetch de estadísticas de canales
   - Fetch de reservas por canal HOY

2. `src/hooks/useChannelStats.js` (ya existe)
   - Añadir función para obtener reservas por canal HOY
   - Validación completa de cada canal

### **No-Show Control:**
1. `src/pages/NoShowControl.jsx` (ya existe, rediseñar)
   - Añadir secciones informativas (¿Qué es?, ¿Cómo funciona?)
   - Mejorar tabla de reservas en riesgo
   - Añadir modal de detalles por reserva
   - Añadir sección de tendencias/historial
   - Añadir configuración de acciones

2. `src/components/NoShowManagerProfesional.jsx` (ya existe, mejorar)
   - Refactorizar para nuevo diseño
   - Añadir gráficos de tendencias
   - Añadir modal de configuración

3. **NUEVA:** `src/components/NoShowTrendChart.jsx`
   - Gráfico de línea con tendencias de 30 días
   - Usar `recharts` (ya instalado)

4. **NUEVA:** `src/components/NoShowReservationDetail.jsx`
   - Modal con detalles de riesgo por reserva
   - Factores de riesgo explicados
   - Acciones disponibles

5. **NUEVA:** `src/components/NoShowAutomationConfig.jsx`
   - Panel de configuración de acciones automáticas
   - Por nivel de riesgo (alto, medio, bajo)

---

## 🔧 CAMBIOS EN BASE DE DATOS

**NO SE REQUIEREN** - Las tablas ya existen:
- ✅ `noshow_actions` - Acciones tomadas y resultados
- ✅ `reservations` - Reservas con `reservation_channel`
- ✅ `message_templates` - Plantillas para mensajes
- ✅ `restaurants.settings.channels` - Configuración de canales

**OPCIONAL:** Añadir tabla de configuración de no-shows
```sql
CREATE TABLE noshow_automation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    risk_level VARCHAR NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    auto_whatsapp BOOLEAN DEFAULT false,
    auto_call BOOLEAN DEFAULT false,
    require_deposit BOOLEAN DEFAULT false,
    hours_before INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ RESUMEN DE CAMBIOS

### **DASHBOARD:**
- ❌ **Eliminar:** Card "Control No-Shows"
- ✅ **Añadir:** Card "Canales Activos" con:
  - Estado de cada canal (activo/inactivo)
  - Reservas por canal HOY
  - Botón para gestionar canales

### **NO-SHOW CONTROL (página dedicada):**
- ✅ **Sección educativa:** ¿Qué es un no-show? ¿Por qué importa?
- ✅ **Sección explicativa:** Cómo funciona el sistema predictivo
- ✅ **KPIs mejorados:** Riesgo HOY, prevenidos, tasa de éxito, tiempo respuesta
- ✅ **Tabla mejorada:** Reservas en riesgo con acciones
- ✅ **Modal de detalles:** Factores de riesgo por reserva
- ✅ **Gráfico de tendencias:** Últimos 30 días
- ✅ **Configuración:** Acciones automáticas por nivel de riesgo

---

## 🎨 DISEÑO PROPUESTO

**Estilo consistente con:**
- Colores: Gradiente sutil lilac/purple como marca
- Cards: `bg-white border-2 border-gray-200 rounded-xl shadow-sm`
- Títulos: `text-sm font-bold text-gray-700 uppercase tracking-wide`
- Botones: Gradiente `from-purple-500 to-indigo-600`
- Iconos: `lucide-react` con tamaño `w-5 h-5` o `w-8 h-8`

---

## ❓ DECISIONES PENDIENTES

1. **¿Mantener acceso rápido a No-Shows desde Dashboard?**
   - Opción A: Eliminar completamente, solo acceso desde menú lateral
   - Opción B: Añadir badge en menú lateral con número de alertas
   - **Recomendación:** Opción B - Badge rojo con número en menú

2. **¿Qué hacer con el botón actual "Ver historial"?**
   - Cambiar texto a "Ver No-Shows" o "Gestionar Alertas"
   - Mantener en card de canales como "Ver Canales"
   - **Recomendación:** Renombrar en NoShowControl a "Gestionar No-Shows"

3. **¿Nivel de detalle en "Canales Activos"?**
   - Opción A: Solo activos/total + botón
   - Opción B: Lista de todos los canales con estado
   - Opción C: Lista + mini-gráfico de reservas por canal
   - **Recomendación:** Opción B para simplicidad

4. **¿Configuración de no-shows dónde?**
   - Opción A: En la página NoShowControl (recomendado)
   - Opción B: En Configuración general
   - **Recomendación:** Opción A - Todo en un solo lugar

---

## 📅 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Dashboard (30-45 min)**
1. Crear nueva card "Canales Activos"
2. Fetch de datos de canales desde `restaurants.settings.channels`
3. Fetch de reservas por canal HOY
4. Eliminar card antigua "Control No-Shows"
5. Testing

### **FASE 2: No-Show Control - Base (60 min)**
1. Rediseñar header con secciones educativas
2. Mejorar KPIs principales
3. Refactorizar tabla de reservas en riesgo
4. Testing

### **FASE 3: No-Show Control - Avanzado (90 min)**
1. Crear `NoShowReservationDetail.jsx` (modal)
2. Crear `NoShowTrendChart.jsx` (gráfico)
3. Crear `NoShowAutomationConfig.jsx` (configuración)
4. Integrar con componente principal
5. Testing

### **FASE 4: Pulido y Testing Final (30 min)**
1. Ajustes de diseño
2. Testing completo de flujos
3. Verificar responsive
4. Documentación

**TIEMPO TOTAL ESTIMADO:** 3-4 horas

---

## 🚀 ¿PROCEDER?

Esta propuesta está lista para implementación. Confirma:
- ✅ ¿Estás de acuerdo con los cambios propuestos?
- ✅ ¿Alguna modificación en el diseño o funcionalidades?
- ✅ ¿Procedo con la Fase 1 (Dashboard)?


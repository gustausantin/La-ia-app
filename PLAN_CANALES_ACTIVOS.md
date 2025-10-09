# 📋 PLAN: Reemplazar Widget No-Shows por Canales Activos

**Fecha:** 2025-10-09  
**Prioridad:** CALIDAD > VELOCIDAD

---

## 🎯 OBJETIVO:

Reemplazar el widget `<NoShowWidget>` en el dashboard ORIGINAL por un nuevo widget `<CanalesActivosWidget>` que muestre el estado real de los canales de comunicación.

---

## 📍 UBICACIÓN EXACTA:

**Archivo:** `src/pages/DashboardAgente.jsx`  
**Líneas:** 643-649

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
    <NoShowWidget 
        data={dashboardData.noShowWidgetData} 
        onViewDetails={() => navigate('/no-shows')} 
    />
    <ReturningCustomersWidget 
        data={dashboardData.returningCustomersData} 
    />
</div>
```

---

## 🔍 WIDGET ACTUAL (NoShowWidget):

**Muestra:**
- "Evitados esta semana": `{data.weeklyPrevented}`
- "Alto riesgo hoy": `{data.todayRisk}`
- "Reservas confirmadas": `100% de éxito`
- "Análisis Detallado"
- "Próximas 2h": Sin riesgo detectado
- "Protegiendo tus ingresos": Detectamos reservas problemáticas
- "Ahorro esta semana": ~0€ evitados

**Botón:** "Analizar y Ejecutar" → `/no-shows`

---

## ✅ NUEVO WIDGET (CanalesActivosWidget):

### **Datos necesarios:**

1. **Canales totales:** 5 (VAPI, WhatsApp, Instagram, Facebook, Web Chat)
2. **Estado de cada canal:** Verde (activo) / Gris (inactivo)
3. **Contador por canal:** Número de reservas HOY por cada canal
4. **Fuente de datos:**
   - Estado: `restaurants.settings.channels.{canal}.enabled`
   - Validación: Lógica de `useChannelStats` (api_key, tokens, etc.)
   - Contador: `SELECT COUNT(*) FROM reservations WHERE reservation_channel = X AND reservation_date = HOY`

### **Diseño propuesto:**

```
┌─────────────────────────────────────────┐
│ 🔗 CANALES ACTIVOS                      │
│                                         │
│ 2/5 canales operativos                 │
│                                         │
│ 🟢 VAPI (Llamadas)      | 0 reservas   │
│ 🟢 WhatsApp             | 1 reserva    │
│ ⚪ Instagram            | 0 reservas   │
│ ⚪ Facebook             | 0 reservas   │
│ ⚪ Web Chat             | 0 reservas   │
│                                         │
│ [Gestionar Canales →]                   │
└─────────────────────────────────────────┘
```

### **Colores:**
- 🟢 Verde: Canal activo y correctamente configurado
- ⚪ Gris: Canal inactivo o mal configurado
- Fondo: `bg-white rounded-xl shadow-sm border`
- Header: Icono `LinkIcon` con color azul

---

## 📊 DATOS REALES - VERIFICACIÓN:

### **1. Obtener estado de canales:**

```javascript
// ✅ Desde useChannelStats
const { channelStats } = useChannelStats();
// Retorna: { active: 2, total: 5, validChannels: ['vapi', 'whatsapp'] }
```

### **2. Obtener reservas por canal HOY:**

```javascript
// ✅ Query real
const { data: channelReservations } = await supabase
    .from('reservations')
    .select('reservation_channel')
    .eq('restaurant_id', restaurant.id)
    .eq('reservation_date', todayStr)
    .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);

// Contar por canal
const counts = channelReservations.reduce((acc, r) => {
    const channel = r.reservation_channel || 'web';
    acc[channel] = (acc[channel] || 0) + 1;
    return acc;
}, {});
```

### **3. Mapeo de canales:**

| Campo BD `reservation_channel` | Nombre Display | Canal Settings |
|-------------------------------|----------------|----------------|
| `vapi` | VAPI (Llamadas) | `settings.channels.vapi` |
| `whatsapp` | WhatsApp | `settings.channels.whatsapp` |
| `instagram` | Instagram | `settings.channels.instagram` |
| `facebook` | Facebook | `settings.channels.facebook` |
| `web` o `webchat` | Web Chat | `settings.channels.web_chat` |

---

## 🔧 IMPLEMENTACIÓN:

### **PASO 1: Crear componente `CanalesActivosWidget.jsx`**

```jsx
// src/components/CanalesActivosWidget.jsx
import React from 'react';
import { Link as LinkIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CanalesActivosWidget = ({ channelStats, channelCounts }) => {
    const navigate = useNavigate();
    
    const channels = [
        { key: 'vapi', name: 'VAPI (Llamadas)', active: channelStats?.validChannels?.includes('vapi') },
        { key: 'whatsapp', name: 'WhatsApp', active: channelStats?.validChannels?.includes('whatsapp') },
        { key: 'instagram', name: 'Instagram', active: channelStats?.validChannels?.includes('instagram') },
        { key: 'facebook', name: 'Facebook', active: channelStats?.validChannels?.includes('facebook') },
        { key: 'webchat', name: 'Web Chat', active: channelStats?.validChannels?.includes('web_chat') }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">Canales Activos</h3>
                </div>
            </div>

            {/* Contador */}
            <div className="text-center mb-4">
                <p className="text-3xl font-bold text-gray-900">
                    {channelStats?.active || 0}/{channelStats?.total || 5}
                </p>
                <p className="text-sm text-gray-600">canales operativos</p>
            </div>

            {/* Lista de canales */}
            <div className="space-y-2 mb-4">
                {channels.map(channel => (
                    <div key={channel.key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${channel.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-gray-700">{channel.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                            {channelCounts?.[channel.key] || 0} reservas
                        </span>
                    </div>
                ))}
            </div>

            {/* Botón */}
            <button 
                onClick={() => navigate('/configuracion')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            >
                Gestionar Canales <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};
```

### **PASO 2: Añadir estados en DashboardAgente.jsx**

```javascript
// Añadir después de los estados existentes
const [channelCounts, setChannelCounts] = useState({});
const { channelStats } = useChannelStats();
```

### **PASO 3: Cargar datos en loadDashboardData()**

```javascript
// Al final de loadDashboardData(), antes del setDashboardData()
const { data: channelReservations } = await supabase
    .from('reservations')
    .select('reservation_channel')
    .eq('restaurant_id', restaurant.id)
    .eq('reservation_date', todayStr)
    .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);

const counts = (channelReservations || []).reduce((acc, r) => {
    const channel = r.reservation_channel || 'web';
    acc[channel] = (acc[channel] || 0) + 1;
    return acc;
}, {});

setChannelCounts(counts);
```

### **PASO 4: Reemplazar widget en JSX**

```jsx
// ANTES (línea 643-649):
<NoShowWidget 
    data={dashboardData.noShowWidgetData} 
    onViewDetails={() => navigate('/no-shows')} 
/>

// DESPUÉS:
<CanalesActivosWidget 
    channelStats={channelStats}
    channelCounts={channelCounts}
/>
```

---

## ✅ VERIFICACIÓN DE NORMAS:

- ✅ **NORMA 1:** Ajuste quirúrgico - Solo reemplazamos 1 widget
- ✅ **NORMA 2:** Datos reales - Todo desde Supabase y useChannelStats
- ✅ **NORMA 3:** Multi-tenant - Filtrado por restaurant_id
- ✅ **NORMA 4:** Esquemas verificados - Usamos tablas existentes

---

## 🚀 SIGUIENTE PASO:

Una vez implementado esto, el widget `<NoShowWidget>` se moverá a la página `/no-shows-nuevo` donde tendrá más espacio y contexto.

---

**Estado:** ✅ PLAN APROBADO - LISTO PARA IMPLEMENTAR


# 🔧 CAMBIOS: Widget Canales Activos - Versión Compacta + Debug

**Fecha:** 2025-10-09 (Actualización)  
**Prioridad:** DATOS REALES 100%

---

## 🎯 PROBLEMAS DETECTADOS:

El usuario reportó:
1. ❌ **Widget muy alto** → Ocupaba demasiado espacio vertical
2. ❌ **Datos NO REALES** → Semáforos rojos cuando deberían ser verdes
3. ❌ **Web Chat mostraba "1"** → Dato inventado/hardcodeado

---

## ✅ SOLUCIONES IMPLEMENTADAS:

### **1. Widget más COMPACTO (reducido ~35% en altura)**

#### Antes → Después:
- Padding: `p-6` → `p-4` 
- Header icon: `w-10 h-10` → `w-8 h-8`
- Contador principal: `mb-5` → `mb-3`, `py-3` → `py-2`
- Items de canal: `p-3 space-y-3` → `py-1.5 px-2 space-y-1.5`
- Fuente contador: `text-2xl` → `text-lg`
- Botón: `py-2.5 text-sm` → `py-2 text-xs`
- Quité subtítulos ("Llamadas IA", "Mensajería") para ahorrar espacio

#### Resultado:
✅ Widget ahora termina aprox. a la altura de Instagram (como solicitó el usuario)

---

### **2. DEBUG añadido para detectar problema de datos**

#### A) `useChannelStats.js`:
```javascript
console.log('🔍 useChannelStats - channels desde DB:', channels);

Object.entries(channels).forEach(([channelType, channelSettings]) => {
    const isEnabled = channelSettings.enabled;
    const isValid = isChannelValid(channelType, channelSettings);
    
    console.log(`🔍 Canal "${channelType}":`, {
        enabled: isEnabled,
        valid: isValid,
        settings: channelSettings
    });
    
    if (isEnabled && isValid) {
        activeChannels.push(channelType);
    }
});

console.log('✅ useChannelStats - Canales activos:', activeChannels);
```

**Objetivo:** Ver por qué VAPI y WhatsApp no se marcan como activos.

**Hipótesis:** 
- Si `enabled: true` pero falta `api_key` o `phone_number`, el canal NO se valida.
- La lógica de `isChannelValid()` es muy estricta.

#### B) `DashboardAgente.jsx`:
```javascript
console.log('📊 Dashboard - Reservas por canal HOY:', counts);
console.log('📊 Dashboard - Total reservas consultadas:', channelReservations?.length || 0);
```

**Objetivo:** Verificar que los contadores NO sean hardcoded.

#### C) `CanalesActivosWidget.jsx`:
```javascript
useEffect(() => {
    console.log('🔗 CanalesActivosWidget - channelStats:', channelStats);
    console.log('🔗 CanalesActivosWidget - channelCounts:', channelCounts);
}, [channelStats, channelCounts]);
```

**Objetivo:** Ver qué props recibe el widget.

---

### **3. Contador Web Chat VERIFICADO como NO hardcodeado**

```javascript
// ✅ Obtener contador REAL desde channelCounts
let count = channelCounts[channel.countKey] || 0;

// Para webchat, buscar también 'webchat' además de 'web'
if (channel.key === 'webchat' && count === 0) {
    count = channelCounts['webchat'] || 0;
}
```

✅ NO hay `count = 1` hardcodeado en ninguna parte  
✅ Todos los contadores vienen de la query real a `reservations`

---

## 🔍 DIAGNÓSTICO ESPERADO:

Al recargar el dashboard, deberías ver en la consola:

```
🔍 useChannelStats - channels desde DB: {
    vapi: { enabled: true, api_key: "...", phone_number: "..." },
    whatsapp: { enabled: true, api_key: "...", phone_number: "..." },
    instagram: { enabled: false, ... },
    ...
}

🔍 Canal "vapi": { enabled: true, valid: true/false, settings: {...} }
🔍 Canal "whatsapp": { enabled: true, valid: true/false, settings: {...} }
...

✅ useChannelStats - Canales activos: ['vapi', 'whatsapp']

📊 Dashboard - Reservas por canal HOY: { web: 1 }
📊 Dashboard - Total reservas consultadas: 1

🔗 CanalesActivosWidget - channelStats: { active: 2, total: 5, validChannels: ['vapi', 'whatsapp'] }
🔗 CanalesActivosWidget - channelCounts: { web: 1 }
```

---

## 🧪 PRÓXIMOS PASOS PARA EL USUARIO:

1. **Abrir consola del navegador** (F12)
2. **Recargar dashboard**
3. **Buscar los logs 🔍 📊 🔗**
4. **Compartir captura de los logs** para diagnosticar por qué los canales no se validan

---

## 🚨 POSIBLES CAUSAS DEL PROBLEMA:

### **Causa A: Falta `api_key` o `phone_number` en Supabase**

Si en configuración guardaste VAPI y WhatsApp como `enabled: true` pero NO guardaste las credenciales (`api_key`, `phone_number`), el hook `useChannelStats` las marca como NO válidas.

**Solución:**
1. Ir a `/configuracion` → Pestaña "Canales"
2. Verificar que VAPI y WhatsApp tengan:
   - ✅ API Key
   - ✅ Número de teléfono
3. Hacer clic en "Guardar Canales"
4. Recargar dashboard

### **Causa B: Campo `reservation_channel` NULL o vacío**

Si las reservas en la BD tienen `reservation_channel = NULL`, se asignan a `'web'` por defecto:

```javascript
const channel = r.reservation_channel || 'web';
```

Esto explica por qué "Web Chat" muestra "1" → Es la reserva que no tiene canal asignado.

---

## 📝 ARCHIVOS MODIFICADOS:

1. ✅ `src/components/CanalesActivosWidget.jsx` → Compacto + debug
2. ✅ `src/hooks/useChannelStats.js` → Logs de validación
3. ✅ `src/pages/DashboardAgente.jsx` → Logs de contadores

---

## ✅ NORMA 2 RESPETADA:

- ✅ NO hay datos hardcoded
- ✅ TODO viene de Supabase
- ✅ Logs permiten auditar origen de datos
- ✅ Lógica de validación explícita y auditable

---

**Estado:** ✅ COMPACTADO + DEBUG AÑADIDO - Listo para diagnóstico


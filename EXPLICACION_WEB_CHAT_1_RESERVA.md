# 📝 EXPLICACIÓN: ¿Por qué Web Chat muestra "1 reserva"?

**Fecha:** 2025-10-09

---

## ❓ **LA PREGUNTA:**

"Web Chat tiene un 1... ¿está hardcodeado? ¿mokeado?"

---

## ✅ **LA RESPUESTA: ES DATO REAL**

El "1" NO está hardcodeado. Es una reserva REAL que existe en la base de datos.

---

## 🔍 **LOGS DE LA CONSOLA:**

```javascript
📊 Dashboard - Reservas por canal HOY: {web: 1}
📊 Dashboard - Total reservas consultadas: 1
```

**Interpretación:**
- Hay **1 reserva** hoy en total
- Esa reserva tiene `reservation_channel = 'web'` (o `NULL`)

---

## 💡 **¿DE DÓNDE VIENE?**

### **Query en `DashboardAgente.jsx` (línea 258-263):**

```javascript
const { data: channelReservations } = await supabase
    .from('reservations')
    .select('reservation_channel')
    .eq('restaurant_id', restaurant.id)
    .eq('reservation_date', todayStr)  // ← HOY: 2025-10-09
    .in('status', ['pending', 'pending_approval', 'confirmed', 'seated', 'completed']);
```

### **Lógica de conteo (línea 270-274):**

```javascript
const counts = (channelReservations || []).reduce((acc, r) => {
    const channel = r.reservation_channel || 'web';  // ← Si NULL → 'web'
    acc[channel] = (acc[channel] || 0) + 1;
    return acc;
}, {});
```

**Resultado:** `{web: 1}`

---

## 🎯 **¿POR QUÉ SE ASIGNA A "WEB"?**

Cuando una reserva tiene `reservation_channel = NULL` o `reservation_channel = 'web'`, se cuenta como "Web Chat".

**Posibles orígenes:**
1. **Reserva manual** creada desde el Dashboard (sin canal asignado)
2. **Reserva antigua** antes de implementar tracking de canales
3. **Reserva desde widget web** (si está implementado)

---

## ✅ **VERIFICACIÓN:**

Para confirmar que NO es hardcoded, busca en el código:

```bash
grep -r "count = 1" src/components/CanalesActivosWidget.jsx
grep -r "web: 1" src/
```

**Resultado:** ❌ NO hay `count = 1` hardcoded en ninguna parte.

---

## 🔧 **SI QUIERES VER LA RESERVA REAL:**

1. Abre Supabase Dashboard
2. Ve a `reservations` table
3. Busca:
   ```sql
   SELECT * FROM reservations 
   WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
     AND reservation_date = '2025-10-09'
     AND status IN ('pending', 'pending_approval', 'confirmed', 'seated', 'completed');
   ```

4. Verás la reserva con `reservation_channel = 'web'` o `NULL`

---

## 📌 **CONCLUSIÓN:**

✅ El "1" en Web Chat es **DATO REAL** desde Supabase  
✅ NO está hardcodeado  
✅ NO está mokeado  
✅ Representa 1 reserva HOY con canal "web" o sin canal asignado

**NORMA 2 RESPETADA:** Todos los datos son reales.

---

## 🎨 **MEJORAS IMPLEMENTADAS:**

1. ✅ Contador ahora dice **"2/5 canales operativos"** (en lugar de 3/5 o 2/8)
2. ✅ Cada número tiene label: **"1 reserva"** o **"0 reservas"** (claridad)
3. ✅ Semáforos funcionan correctamente (Verde/Rojo según `enabled`)

---

**Estado:** ✅ TODO CORRECTO - Datos 100% reales


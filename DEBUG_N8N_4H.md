# 🔍 DEBUG: Workflow 4h No Funciona

**Hora actual:** 09:35
**Reserva:** 14:00 (4.42h desde ahora)
**Ventana esperada:** 4-4.5h ✅

---

## 🐛 POSIBLES PROBLEMAS:

### 1️⃣ **Zona horaria UTC vs Local:**

**N8N usa UTC** por defecto en `new Date()`.

Si tu servidor está en UTC pero la reserva se guardó en hora local:
```javascript
now = 2025-10-13T07:35:00Z (UTC)
reservation = 2025-10-13T14:00:00 (sin timezone)
```

**Solución en el código N8N:**
```javascript
// ANTES:
const now = new Date();

// DESPUÉS:
const now = new Date();
// Ajustar a timezone de España (UTC+2)
const localNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
```

---

### 2️⃣ **Formato de fecha no coincide:**

```javascript
todayStr = "2025-10-13" (ISO)
reservation_date = "2025-10-13" (debe coincidir)
```

---

### 3️⃣ **Logs para DEBUG:**

Añadir al inicio del código de filtro:

```javascript
const now = new Date();
const todayStr = now.toISOString().split('T')[0];

// DEBUG
console.log('=== DEBUG INICIO ===');
console.log('Hora actual:', now.toISOString());
console.log('Fecha hoy:', todayStr);
console.log('Total reservas:', $input.all().length);

$input.all().forEach((item, idx) => {
  const data = item.json;
  console.log(`\nReserva ${idx + 1}:`, {
    name: data.customer_name,
    date: data.reservation_date,
    time: data.reservation_time,
    status: data.status,
    phone: data.customer_phone
  });
  
  if (data.reservation_date === todayStr) {
    const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
    const hoursUntil = (reservationDateTime - now) / (1000 * 60 * 60);
    console.log(`  -> Horas hasta reserva: ${hoursUntil.toFixed(2)}h`);
    console.log(`  -> Dentro de ventana 4-4.5h: ${hoursUntil >= 4 && hoursUntil <= 4.5}`);
  }
});

// Luego el filtro normal...
```

---

## ✅ SOLUCIÓN RÁPIDA:

**En N8N, reemplaza el código del nodo "🔍 Filtrar: 4h Antes + Pending" con esto:**

```javascript
const now = new Date();
const todayStr = now.toISOString().split('T')[0];

console.log('🔍 DEBUG - Hora actual UTC:', now.toISOString());
console.log('🔍 DEBUG - Fecha hoy:', todayStr);
console.log('🔍 DEBUG - Total items:', $input.all().length);

const filtered = $input.all().filter(item => {
  const data = item.json;
  
  console.log('\n📋 Evaluando reserva:', {
    name: data.customer_name,
    date: data.reservation_date,
    time: data.reservation_time,
    status: data.status,
    phone: data.customer_phone ? 'Sí' : 'No'
  });
  
  // Verificar que la reserva sea para hoy
  if (data.reservation_date !== todayStr) {
    console.log('  ❌ No es para hoy');
    return false;
  }
  
  // Verificar que esté pendiente y tenga teléfono
  if (data.status !== 'pending' || !data.customer_phone) {
    console.log('  ❌ Status:', data.status, '| Teléfono:', data.customer_phone ? 'Sí' : 'No');
    return false;
  }
  
  // Calcular tiempo hasta la reserva
  const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
  const hoursUntil = (reservationDateTime - now) / (1000 * 60 * 60);
  
  console.log(`  ⏰ Horas hasta reserva: ${hoursUntil.toFixed(2)}h`);
  console.log(`  ⏰ Ventana 4-4.5h: ${hoursUntil >= 4 && hoursUntil <= 4.5 ? 'SÍ ✅' : 'NO ❌'}`);
  
  // Filtrar reservas entre 4 y 4.5 horas (ventana de 30 min)
  return hoursUntil >= 4 && hoursUntil <= 4.5;
});

console.log('\n✅ Reservas filtradas:', filtered.length);
return filtered;
```

---

## 🧪 PROBAR:

1. Pega el código con DEBUG en N8N
2. Ejecuta manualmente el workflow
3. Mira los logs en la consola de N8N
4. Pégame los logs aquí

---

**Los logs te dirán exactamente por qué no está funcionando.** 🔍


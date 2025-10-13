# 🔧 FIX: N8N Timezone - Workflow 4h

## 🐛 PROBLEMA:

N8N usa **UTC** pero las reservas en Supabase tienen `reservation_time` **sin timezone**.

```javascript
now (UTC): 2025-10-13T07:35:00Z
reservation_time: "14:00:00" (¿UTC o Local?)
reservation_date: "2025-10-13"
```

---

## ✅ SOLUCIÓN:

Reemplaza el código del nodo **"🔍 Filtrar: 4h Antes + Pending"** con:

```javascript
// Obtener hora actual en UTC+2 (España)
const now = new Date();
const TIMEZONE_OFFSET = 2; // UTC+2 para España
const localNow = new Date(now.getTime() + (TIMEZONE_OFFSET * 60 * 60 * 1000));
const todayStr = localNow.toISOString().split('T')[0];

console.log('🔍 Hora actual UTC:', now.toISOString());
console.log('🔍 Hora local (UTC+2):', localNow.toISOString());
console.log('🔍 Fecha hoy:', todayStr);

const filtered = $input.all().filter(item => {
  const data = item.json;
  
  // Verificar que la reserva sea para hoy
  if (data.reservation_date !== todayStr) {
    console.log(`❌ ${data.customer_name}: No es hoy (${data.reservation_date} vs ${todayStr})`);
    return false;
  }
  
  // Verificar que esté pendiente y tenga teléfono
  if (data.status !== 'pending' || !data.customer_phone) {
    console.log(`❌ ${data.customer_name}: Status ${data.status} o sin teléfono`);
    return false;
  }
  
  // Calcular tiempo hasta la reserva EN HORA LOCAL
  const reservationDateTime = new Date(`${data.reservation_date}T${data.reservation_time}`);
  const hoursUntil = (reservationDateTime - localNow) / (1000 * 60 * 60);
  
  console.log(`⏰ ${data.customer_name}: ${hoursUntil.toFixed(2)}h hasta reserva`);
  
  // Filtrar reservas entre 4 y 4.5 horas (ventana de 30 min)
  const inWindow = hoursUntil >= 4 && hoursUntil <= 4.5;
  console.log(`${inWindow ? '✅' : '❌'} Dentro de ventana 4-4.5h: ${inWindow}`);
  
  return inWindow;
});

console.log(`\n✅ Total filtradas: ${filtered.length}`);
return filtered;
```

---

## 🧪 PRUEBA:

1. Pega este código en N8N
2. Ejecuta manualmente
3. Mira los logs

Si sigue sin funcionar, pégame los logs completos.


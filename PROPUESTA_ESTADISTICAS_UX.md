# 📊 PROPUESTA: REDISEÑO DE ESTADÍSTICAS (UX)

## ❌ ACTUAL (Confuso):
```
756 Horarios Totales
742 Disponibles
14 Ocupados
14 Con Reservas
6 Mesas
```

---

## ✅ PROPUESTA 1: ENFOQUE DÍAS + RESERVAS (Recomendado)

```
┌─────────────────────────────────────────────────────┐
│  ✅ Horarios Activos: Próximos 30 días             │
├─────────────────────────────────────────────────────┤
│                                                     │
│   30          26           4           7            │
│  Días       Días       Días con     Reservas        │
│  Totales    Libres     Reservas     Activas         │
│                                                     │
│  📊 Ocupación: 13%    🍽️ 6 Mesas                   │
└─────────────────────────────────────────────────────┘
```

**Cálculos:**
- **Días Totales:** 30 (fijo, configurable)
- **Días Libres:** Días sin ninguna reserva (26)
- **Días con Reservas:** Días que tienen al menos 1 reserva (4)
- **Reservas Activas:** Total de reservas (7)
- **Ocupación:** `(reservas / capacidad_total) * 100`

---

## ✅ PROPUESTA 2: ENFOQUE CAPACIDAD (Alternativo)

```
┌─────────────────────────────────────────────────────┐
│  📅 Período: HOY hasta 07/11/2025 (30 días)        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   180         173          7          13%           │
│  Turnos      Turnos     Reservas    Ocupación       │
│  Totales     Libres     Activas                     │
│                                                     │
│  📊 6 Mesas × 30 días = 180 turnos disponibles     │
└─────────────────────────────────────────────────────┘
```

**Cálculos:**
- **Turnos Totales:** `mesas × días × turnos_por_día`
- **Turnos Libres:** Turnos sin reserva
- **Reservas Activas:** Total de reservas
- **Ocupación:** % de turnos ocupados

---

## ✅ PROPUESTA 3: ENFOQUE SIMPLE (Minimalista)

```
┌─────────────────────────────────────────────────────┐
│  📆 30 días activos (HOY → 07/11/2025)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│   7 Reservas        26 Días libres       13%        │
│   activas           disponibles          ocupación  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 MI RECOMENDACIÓN: **PROPUESTA 1**

**¿Por qué?**
1. ✅ Claro para cualquier usuario
2. ✅ Habla de "días" (concepto familiar)
3. ✅ Separa "días libres" de "días con reservas"
4. ✅ Muestra reservas como número entero (7, no 14 slots)
5. ✅ Incluye % de ocupación (útil para decisiones)

---

## 📐 CÁLCULOS NECESARIOS:

### Para implementar PROPUESTA 1:

```javascript
// 1. Días Totales (ya lo tienes)
const totalDays = 30;

// 2. Días con Reservas (contar días únicos con al menos 1 reserva)
const { data: reservations } = await supabase
    .from('reservations')
    .select('reservation_date')
    .eq('restaurant_id', restaurantId)
    .gte('reservation_date', today)
    .lte('reservation_date', endDate);

const uniqueDaysWithReservations = new Set(
    reservations?.map(r => r.reservation_date) || []
).size;

// 3. Días Libres
const diasLibres = totalDays - uniqueDaysWithReservations;

// 4. Reservas Activas (ya lo tienes)
const reservasActivas = reservations?.length || 0;

// 5. Ocupación
const capacidadTotal = mesas × totalDays × turnosPorDia;
const ocupacion = (reservasActivas / capacidadTotal * 100).toFixed(0);
```

---

## 🎨 DISEÑO VISUAL:

```
┌──────────────────────────────────────────────────────────┐
│  ✅ Horarios de Reserva Activos                          │
│  📅 Período: HOY hasta 07/11/2025 (30 días)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │   30    │  │   26    │  │    4    │  │    7    │   │
│  │  Días   │  │  Días   │  │  Días   │  │ Reservas│   │
│  │ Totales │  │ Libres  │  │   con   │  │ Activas │   │
│  │         │  │         │  │ Reservas│  │         │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                          │
│  📊 Ocupación: 13%  |  🍽️ 6 Mesas  |  ⏰ 60 min/reserva│
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 ¿IMPLEMENTO LA PROPUESTA 1?

Si estás de acuerdo, implemento:
1. Cambiar "Horarios Totales" → "Días Totales"
2. Cambiar "Disponibles" → "Días Libres"
3. Cambiar "Ocupados" → "Días con Reservas"
4. Cambiar "Con Reservas" → "Reservas Activas"
5. Añadir "% Ocupación"
6. Mejorar layout visual


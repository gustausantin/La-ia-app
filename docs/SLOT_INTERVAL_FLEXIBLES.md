# 🎯 SLOTS FLEXIBLES - MÁXIMA OCUPACIÓN

**Fecha:** 30 Septiembre 2025  
**Feature:** Sistema de slots con intervalo configurable

---

## 🚀 PROBLEMA RESUELTO

### ❌ ANTES (Slots Fijos)
```
Horario: 18:00 - 22:00
Duración reserva: 90 min
Slots generados: 18:00, 19:30, 21:00

❌ Cliente pide 18:30 → NO DISPONIBLE
❌ Cliente pide 20:00 → NO DISPONIBLE
```

**Resultado:** Se desperdicia tiempo entre slots.

### ✅ AHORA (Slots Flexibles)
```
Horario: 18:00 - 22:00
Duración reserva: 90 min
Intervalo de slots: 30 min
Slots generados: 18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00, 21:30

✅ Cliente reserva 18:30 → Bloquea slots: 18:30, 19:00, 19:30 (90 min total)
✅ Siguiente disponible: 20:00
```

**Resultado:** Máxima ocupación, aprovecha todos los huecos.

---

## ⚙️ CONFIGURACIÓN

### Nueva propiedad en `restaurants.settings`:

```json
{
  "booking_settings": {
    "reservation_duration": 90,  // Duración de cada reserva
    "slot_interval": 30,         // ⭐ NUEVO: Intervalo entre slots
    "advance_booking_days": 30,
    "min_booking_hours": 2,
    "min_party_size": 1,
    "max_party_size": 12
  }
}
```

### Valores recomendados:

- **`slot_interval: 15`** → Máxima flexibilidad (más slots en BD)
- **`slot_interval: 30`** → **RECOMENDADO** - Balance perfecto
- **`slot_interval: 60`** → Slots cada hora (menos flexibilidad)

---

## 🔧 FUNCIONAMIENTO

### 1. Generación de Slots

```sql
-- Con slot_interval = 30 min
-- Genera: 12:00, 12:30, 13:00, 13:30, 14:00...

-- Con reservation_duration = 90 min
-- Cada slot tiene duración de 90 min pero se generan cada 30 min
```

### 2. Creación de Reserva

Cuando un cliente reserva:

```javascript
// Cliente reserva: 18:30 por 90 minutos
const slotsToBlock = [
  '18:30', // Inicio
  '19:00', // +30 min
  '19:30'  // +60 min  
  // Hasta cubrir 90 min
];

// Marcar todos como 'reserved'
```

### 3. Verificación de Disponibilidad

```javascript
// Cliente pide: 19:00
// ¿Hay 3 slots libres consecutivos desde 19:00?
// → 19:00 (ocupado), 19:30 (ocupado), 20:00 (libre)
// ❌ NO disponible

// Cliente pide: 20:00
// → 20:00 (libre), 20:30 (libre), 21:00 (libre)
// ✅ DISPONIBLE
```

---

## 📊 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Restaurante con alta demanda

```json
{
  "reservation_duration": 90,
  "slot_interval": 15  // Slots cada 15 min
}
```

**Resultado:**
- 18:00, 18:15, 18:30, 18:45, 19:00...
- Cliente puede reservar en cualquier cuarto de hora
- Máximo aprovechamiento de mesas

### Ejemplo 2: Restaurante tranquilo

```json
{
  "reservation_duration": 120,
  "slot_interval": 60  // Slots cada hora
}
```

**Resultado:**
- 18:00, 19:00, 20:00, 21:00
- Slots cada hora, más espaciados
- Menos presión operativa

### Ejemplo 3: Recomendado (Balance)

```json
{
  "reservation_duration": 90,
  "slot_interval": 30  // Slots cada 30 min
}
```

**Resultado:**
- 18:00, 18:30, 19:00, 19:30, 20:00...
- Buen balance entre flexibilidad y simplicidad
- **Default del sistema**

---

## 🎨 IMPACTO EN LA UI

### Selector de hora en reservas

**ANTES:**
```
[18:00] [19:30] [21:00]
```

**AHORA:**
```
[18:00] [18:30] [19:00] [19:30] [20:00] [20:30] [21:00] [21:30]
```

### Configuración del restaurante

Nuevo campo en **Configuración → Reservas**:

```
Intervalo de Slots:
[15 min] [30 min] [60 min] [Personalizado]

ℹ️ Slots más pequeños = mayor flexibilidad para tus clientes
```

---

## 💾 MIGRACIÓN

### Para restaurantes existentes:

**Valor por defecto:** `slot_interval = 30` min

Si no está configurado, el sistema usa automáticamente 30 minutos.

### Script de actualización:

```sql
-- Actualizar restaurantes existentes con valor default
UPDATE restaurants
SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{booking_settings,slot_interval}',
    '30'
)
WHERE settings->'booking_settings'->>'slot_interval' IS NULL;
```

---

## 📈 BENEFICIOS

✅ **Máxima ocupación** - Aprovecha huecos entre reservas  
✅ **Flexibilidad** - Cliente elige hora que prefiera  
✅ **Configurable** - Cada restaurante decide su ritmo  
✅ **Datos reales** - No se inventa nada  
✅ **Compatible** - Funciona con sistema actual  

---

## ⚠️ CONSIDERACIONES

1. **Performance:**
   - `slot_interval = 15` genera 4x más slots que `60 min`
   - Más slots = más espacio en BD
   - **Recomendación:** Usa 30 min salvo alta demanda

2. **UX:**
   - Demasiadas opciones pueden abrumar al cliente
   - **Balance:** 30 min es perfecto

3. **Operativa:**
   - Slots muy pequeños = cocina más presionada
   - Ajusta según capacidad del restaurante

---

## 🔗 ARCHIVOS MODIFICADOS

- ✅ `generate_availability_slots.sql` - Función SQL actualizada
- ✅ `docs/DISPONIBILIDADES-SISTEMA-COMPLETO-2025.md` - Documentación completa
- ✅ `docs/SLOT_INTERVAL_FLEXIBLES.md` - Este documento

---

**Última actualización:** 30 Septiembre 2025  
**Versión:** 2.1 - Slots Flexibles  
**Estado:** ✅ Implementado y Documentado

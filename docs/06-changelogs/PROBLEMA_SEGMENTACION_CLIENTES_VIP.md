# 🐛 PROBLEMA: Segmentación de Clientes VIP Incorrecta

**Fecha:** 13 Octubre 2025  
**Reportado por:** Usuario  
**Prioridad:** ALTA

---

## 🐛 PROBLEMA DETECTADO:

### **Dashboard muestra:**
```
CLIENTES DE HOY:
- Total: 9 personas
- Nuevos: 0
- Habituales: 0
- VIP: 9  ← INCORRECTO ❌
```

### **Lista de clientes muestra:**
- Todos marcados como "Nuevo" 🆕
- Gustavo Santín: 15 visitas (por pruebas con mismo teléfono)

---

## 🔍 CAUSA RAÍZ:

### **1. Lógica Dashboard (DashboardAgente.jsx línea 257):**
```javascript
const vipCustomers = enrichedReservations.reduce((sum, r) => {
    if (r.customer_id && (
        r.customers?.visits_count >= 10 ||  // ← Problema 1
        r.customers?.segment_auto === 'vip' // ← Problema 2
    )) {
        return sum + (r.party_size || 0);
    }
    return sum;
}, 0);
```

**Problema:**
- Cuenta como VIP si `visits_count >= 10` **O** si `segment_auto === 'vip'`
- Gust

avo tiene 15 visitas (pruebas)
- Todas las reservas con su teléfono se atribuyen a él
- `segment_auto` se actualiza automáticamente a `'vip'` cuando `visits_count >= 10`

---

### **2. Agrupación por teléfono:**

```sql
-- En customers, el teléfono es UNIQUE
-- Si haces varias reservas con +34671126148:
```

| Nombre | Teléfono | visits_count | segment_auto |
|--------|----------|--------------|--------------|
| Gustavo Santín | +34671126148 | 15 | vip |

**Todas las pruebas con ese teléfono → +15 visitas → VIP automático**

---

### **3. Badge "Nuevo" siempre visible:**

En `Clientes.jsx`, el badge "Nuevo" se muestra si:
```javascript
customer.segment_auto === 'nuevo' || customer.visits_count === 0
```

Pero `segment_auto` NO se actualiza automáticamente en tiempo real.

---

## ✅ SOLUCIÓN:

### **OPCIÓN 1: Limpiar datos de prueba (INMEDIATA)**

```sql
-- Resetear visitas de Gustavo
UPDATE customers
SET visits_count = 2,
    segment_auto = 'activo',
    total_spent = 0
WHERE phone = '+34671126148'
  AND restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1';

-- Eliminar reservas de prueba antiguas
DELETE FROM reservations
WHERE customer_phone = '+34671126148'
  AND restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
  AND created_at < '2025-10-13';  -- Antes de hoy
```

---

### **OPCIÓN 2: Corregir lógica de segmentación (DEFINITIVA)**

**Problema actual:** Mezcla de criterios (`visits_count` + `segment_auto`)

**Solución:** Usar SOLO `segment_auto` y asegurarse de que se calcula correctamente.

#### **2.1. Función para calcular segmento correcto:**

```javascript
// En DashboardAgente.jsx, añadir función:
const calculateRealTimeSegment = (customer) => {
    if (!customer) return 'nuevo';
    
    const visitsCount = customer.visits_count || 0;
    const totalSpent = customer.total_spent || 0;
    
    // Nuevo: 0-1 visitas
    if (visitsCount <= 1) return 'nuevo';
    
    // VIP: 10+ visitas O gasto alto
    if (visitsCount >= 10 || totalSpent >= 500) return 'vip';
    
    // Habitual: 2-9 visitas
    if (visitsCount >= 2 && visitsCount < 10) return 'habitual';
    
    return 'nuevo';
};
```

#### **2.2. Usar en el cálculo:**

```javascript
// ANTES:
const vipCustomers = enrichedReservations.reduce((sum, r) => {
    if (r.customer_id && (
        r.customers?.visits_count >= 10 ||
        r.customers?.segment_auto === 'vip'
    )) {
        return sum + (r.party_size || 0);
    }
    return sum;
}, 0);

// DESPUÉS:
const vipCustomers = enrichedReservations.reduce((sum, r) => {
    if (!r.customer_id) return sum;
    
    const segment = calculateRealTimeSegment(r.customers);
    if (segment === 'vip') {
        return sum + (r.party_size || 0);
    }
    return sum;
}, 0);

const returningCustomers = enrichedReservations.reduce((sum, r) => {
    if (!r.customer_id) return sum;
    
    const segment = calculateRealTimeSegment(r.customers);
    if (segment === 'habitual') {
        return sum + (r.party_size || 0);
    }
    return sum;
}, 0);

const newCustomers = enrichedReservations.reduce((sum, r) => {
    if (!r.customer_id) return sum + (r.party_size || 0); // Sin customer_id = nuevo
    
    const segment = calculateRealTimeSegment(r.customers);
    if (segment === 'nuevo') {
        return sum + (r.party_size || 0);
    }
    return sum;
}, 0);
```

---

### **OPCIÓN 3: Trigger automático en Supabase**

```sql
-- Actualizar segment_auto automáticamente cuando cambie visits_count
CREATE OR REPLACE FUNCTION update_customer_segment_auto()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular segmento basado en visits_count
    IF NEW.visits_count >= 10 THEN
        NEW.segment_auto := 'vip';
    ELSIF NEW.visits_count >= 2 THEN
        NEW.segment_auto := 'habitual';
    ELSIF NEW.visits_count <= 1 THEN
        NEW.segment_auto := 'nuevo';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_segment_auto
BEFORE INSERT OR UPDATE OF visits_count ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customer_segment_auto();
```

---

## 🎯 RECOMENDACIÓN:

**PASO 1 (HOY):** Ejecuta la OPCIÓN 1 para limpiar datos de prueba

**PASO 2 (MAÑANA):** Implementa la OPCIÓN 2 para corregir lógica del Dashboard

**PASO 3 (FUTURO):** Implementa la OPCIÓN 3 para automatizar en Supabase

---

## 📊 CRITERIOS DE SEGMENTACIÓN CORRECTOS:

| Segmento | Criterio | Badge Color |
|----------|----------|-------------|
| **Nuevo** | visits_count ≤ 1 | Azul 🔵 |
| **Habitual** | visits_count 2-9 | Verde 🟢 |
| **VIP** | visits_count ≥ 10 O total_spent ≥ €500 | Dorado 🟡 |
| **Inactivo** | No viene hace 90+ días | Gris ⚪ |

---

## ⚠️ NOTAS:

1. **Teléfono único:** Todas las reservas con el mismo teléfono se atribuyen al mismo cliente
2. **Pruebas:** Usa teléfonos diferentes para cada cliente de prueba
3. **Reset:** Puedes resetear `visits_count` cuando sea necesario

---

**Estado:** Identificado, solución propuesta, pendiente de implementar



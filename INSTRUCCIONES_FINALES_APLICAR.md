# 🎯 INSTRUCCIONES FINALES - APLICAR SQL

## ✅ LO QUE YA ESTÁ HECHO

1. ✅ **Frontend Dashboard corregido** → Desglose de clientes (Nuevos/Habituales/VIP) ahora suma `party_size`
2. ✅ **Función SQL actualizada** → `get_restaurant_noshow_metrics` ahora cuenta `medium` + `high` risk
3. ✅ **Estadísticas Reservas actualizadas** → Quitado "Por IA" y "Manual", añadido "No-Shows"

---

## 🔴 LO QUE FALTA: MARCAR RESERVAS PASADAS COMO NO-SHOW

### PASO 1: Ejecutar en Supabase SQL Editor

```sql
-- Marcar TODAS las reservas pasadas (con más de 2h de antigüedad) como no_show
SELECT * FROM mark_all_expired_reservations_as_noshow();
```

**Resultado esperado:**
```json
{
  "updated_count": 5 o 6,
  "reservation_ids": [array de UUIDs]
}
```

---

### PASO 2: Verificar que se marcaron correctamente

```sql
-- Ver reservas pasadas con su nuevo estado
SELECT 
    customer_name,
    reservation_date,
    reservation_time,
    status,
    updated_at
FROM reservations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND reservation_date < CURRENT_DATE
ORDER BY reservation_date DESC, reservation_time DESC;
```

**Resultado esperado:**
- Jordi Garcia (10/10 19:00) → **no_show**
- Lucia Meria (10/10 19:00) → **no_show**
- Mireia Reina (10/10 18:00) → **no_show**
- Bet Molina (09/10 20:00) → **no_show**
- Berta Dos (06/10 22:00) → **no_show**
- Andrea Martinez Pio (06/10 20:00) → **no_show**

---

### PASO 3: Recargar navegador (F5)

Después de ejecutar el SQL, recarga la aplicación y verifica:

#### Dashboard:
- **Clientes de hoy:** 6
  - **Nuevos:** 0
  - **Habituales:** 6 (Andrea 4 + Emilio 2)
  - **VIP:** 0
- **Alertas No-Shows:** 2 ✅

#### Página No-Shows:
- **Reservas de riesgo hoy:** 2 ✅

#### Página Reservas (Tab PASADAS):
- **Total:** 6 (o las que sean)
- **Confirmadas:** [las que estén confirmadas]
- **Pendientes:** 0 (todas deben estar marcadas no_show)
- **No-Shows:** 6 (o las que se marcaron)
- **Comensales:** [suma party_size]

#### Reservas pasadas en la lista:
- Todas deben mostrar badge **"No-Show"** en **ROJO**, no "Pending" en amarillo

---

## 🐛 SI ALGO FALLA

### Problema: "Las reservas siguen en Pending"

**Solución:** Ejecuta manualmente el UPDATE:

```sql
-- Marcar manualmente las 6 reservas específicas
UPDATE reservations
SET 
    status = 'no_show',
    updated_at = NOW()
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND status = 'pending'
AND (reservation_date::TIMESTAMP + reservation_time) < (NOW() - INTERVAL '2 hours')
RETURNING customer_name, reservation_date, reservation_time, status;
```

---

### Problema: "El desglose de clientes sigue en 0+0+0"

**Solución:** Abre la consola del navegador (F12) y busca este log:

```
📊 Desglose calculado: {newCustomers: X, returningCustomers: Y, vipCustomers: Z, total: 6}
```

Si muestra `total: 6` pero el frontend muestra 0+0+0, el problema es que el componente no se está re-renderizando. **Fuerza recarga con Ctrl+Shift+R**.

---

### Problema: "No veo la tarjeta No-Shows en Reservas"

**Solución:** Ya está añadida. Si no la ves, limpia caché con **Ctrl+Shift+R**.

---

## 📋 CHECKLIST FINAL

Después de aplicar todo:

- [ ] Dashboard "Clientes de hoy" muestra desglose correcto (no 0+0+0)
- [ ] Dashboard "Alertas No-Shows" muestra 2 (no 0)
- [ ] Página No-Shows "Reservas de riesgo hoy" muestra 2 (no 0)
- [ ] Página Reservas tiene 5 tarjetas: Total, Confirmadas, Pendientes, **No-Shows**, Comensales
- [ ] Página Reservas (tab PASADAS) muestra "No-Shows: 6" (o el número correcto)
- [ ] Reservas pasadas en la lista muestran badge rojo "No-Show", no amarillo "Pending"

---

## ⚡ COMANDO RÁPIDO

Si prefieres todo en un solo paso:

```sql
-- 1. Marcar reservas caducadas
SELECT * FROM mark_all_expired_reservations_as_noshow();

-- 2. Verificar métricas
SELECT * FROM get_restaurant_noshow_metrics('d6b63130-1ebf-4284-98fc-a3b31a85d9d1');

-- 3. Ver predicciones de riesgo
SELECT customer_name, risk_level, risk_score FROM predict_upcoming_noshows_v2('d6b63130-1ebf-4284-98fc-a3b31a85d9d1', 0);

-- 4. Ver clientes de hoy con tipo
SELECT 
    r.customer_name,
    r.party_size,
    c.visits_count,
    CASE 
        WHEN r.customer_id IS NULL THEN 'NUEVO'
        WHEN c.visits_count = 1 THEN 'NUEVO'
        WHEN c.visits_count >= 2 AND c.visits_count < 10 THEN 'HABITUAL'
        WHEN c.visits_count >= 10 OR c.segment_auto = 'vip' THEN 'VIP'
    END as tipo
FROM reservations r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND r.reservation_date = CURRENT_DATE;
```



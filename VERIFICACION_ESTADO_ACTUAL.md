# 🔍 VERIFICACIÓN ESTADO ACTUAL - 11/10/2025 09:53

## PROBLEMAS REPORTADOS POR EL USUARIO

### 1. DASHBOARD - "Clientes de hoy" = 6, pero desglose = 0+0+0
- ✅ Clientes de hoy: 6 (CORRECTO)
- ❌ Nuevos: 0 (INCORRECTO)
- ❌ Habituales: 0 (INCORRECTO)
- ❌ VIP: 0 (INCORRECTO)

**DIAGNÓSTICO:** El total está bien (suma party_size), pero el DESGLOSE no se está calculando.

---

### 2. DASHBOARD - "Alertas No-Shows" = 0 (pero en página No-Shows = 2)
- ❌ Dashboard muestra: 0
- ✅ Página No-Shows muestra: 2

**DIAGNÓSTICO:** El RPC `predict_upcoming_noshows_v2` está devolviendo datos, pero el Dashboard no los está capturando correctamente.

---

### 3. NO-SHOWS - "Reservas de riesgo hoy" = 0 (pero abajo lista 2)
- ❌ Tarjeta superior muestra: 0
- ✅ Lista inferior muestra: 2 reservas

**DIAGNÓSTICO:** La tarjeta usa `stats.reservasRiesgo` que viene de `get_restaurant_noshow_metrics`, pero esa función NO está contando correctamente.

---

### 4. RESERVAS PASADAS - Todas siguen "Pending" (deberían ser "No-Show")
- Jordi Garcia - 10/10 19:00 - **Pending** (❌ debería ser No-Show)
- Lucia Meria - 10/10 19:00 - **Pending** (❌ debería ser No-Show)
- Bet Molina - 09/10 20:00 - **Pending** (❌ debería ser No-Show)
- Berta Dos - 06/10 22:00 - **Pending** (❌ debería ser No-Show)
- Andrea Martinez - 06/10 20:00 - **Pending** (❌ debería ser No-Show)

**DIAGNÓSTICO:** El cron job del servidor NO se ha ejecutado, o la función SQL NO está funcionando correctamente.

---

## PRÓXIMOS PASOS

1. ✅ Verificar estado REAL en BD de las 5 reservas pasadas
2. ✅ Ejecutar manualmente `mark_all_expired_reservations_as_noshow()` y ver resultado
3. ✅ Corregir función `get_restaurant_noshow_metrics` para contar `high_risk_today` correctamente
4. ✅ Corregir desglose de clientes (Nuevos/Habituales/VIP) en Dashboard
5. ✅ Sincronizar Dashboard con página No-Shows

---

## QUERIES DE VERIFICACIÓN

```sql
-- 1. Estado actual de reservas pasadas
SELECT 
    customer_name,
    reservation_date,
    reservation_time,
    status,
    (reservation_date::TIMESTAMP + reservation_time) as momento_reserva,
    NOW() - INTERVAL '2 hours' as cutoff
FROM reservations
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
AND status = 'pending'
AND reservation_date <= CURRENT_DATE
ORDER BY reservation_date DESC, reservation_time DESC;

-- 2. Predicciones de riesgo HOY
SELECT * FROM predict_upcoming_noshows_v2('d6b63130-1ebf-4284-98fc-a3b31a85d9d1', 0);

-- 3. Métricas de No-Shows
SELECT * FROM get_restaurant_noshow_metrics('d6b63130-1ebf-4284-98fc-a3b31a85d9d1');
```



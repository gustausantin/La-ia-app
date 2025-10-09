# 🚀 INSTRUCCIONES: APLICAR SISTEMA DE RIESGO DINÁMICO

**Fecha:** 9 de Octubre, 2025  
**Estado:** ✅ LISTO PARA APLICAR  

---

## 📋 **QUÉ SE HA CREADO**

He creado **2 archivos SQL** de migración que debes aplicar en Supabase:

### **Archivo 1:** `supabase/migrations/20251009_002_customer_confirmations.sql`
**Propósito:** Crear tabla para trackear confirmaciones de clientes

**Contiene:**
- ✅ Tabla `customer_confirmations`
- ✅ 4 índices para rendimiento
- ✅ 2 triggers automáticos (calcular tiempo de respuesta y updated_at)
- ✅ 3 políticas RLS
- ✅ 3 funciones helper:
  - `record_customer_confirmation()` → Registrar envío/respuesta
  - `update_confirmation_response()` → Actualizar respuesta
  - `get_customer_response_metrics()` → Métricas del cliente

### **Archivo 2:** `supabase/migrations/20251009_003_dynamic_risk_calculation.sql`
**Propósito:** Calcular riesgo dinámico basado en confirmaciones

**Contiene:**
- ✅ Función `calculate_dynamic_risk_score()` → Calcula riesgo con ajustes dinámicos
- ✅ Función `predict_upcoming_noshows_v2()` → Versión mejorada de predicción
- ✅ Función `get_dynamic_noshow_metrics()` → Métricas de confirmaciones

---

## 🎯 **CÓMO APLICAR EN SUPABASE**

### **OPCIÓN A: SQL Editor (RECOMENDADO)**

1. **Abre Supabase Dashboard:**
   - Ve a tu proyecto en https://supabase.com
   - Click en "SQL Editor" en el menú izquierdo

2. **Aplica Migración 1:**
   - Click en "New Query"
   - Copia TODO el contenido de `supabase/migrations/20251009_002_customer_confirmations.sql`
   - Pégalo en el editor
   - Click en "Run" (▶️)
   - ✅ Deberías ver: "Success. No rows returned"

3. **Aplica Migración 2:**
   - Click en "New Query" de nuevo
   - Copia TODO el contenido de `supabase/migrations/20251009_003_dynamic_risk_calculation.sql`
   - Pégalo en el editor
   - Click en "Run" (▶️)
   - ✅ Deberías ver: "Success. No rows returned"

4. **Verifica que se creó:**
   ```sql
   -- Verificar tabla
   SELECT * FROM customer_confirmations LIMIT 1;
   
   -- Verificar funciones
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name LIKE '%dynamic%';
   ```

---

### **OPCIÓN B: Supabase CLI (si prefieres)**

```bash
# Asegúrate de estar en el directorio del proyecto
cd C:\Users\Usuario\Desktop\LA-IA\La-ia-app-V1

# Aplica las migraciones
supabase db push

# O aplica manualmente cada una
supabase db execute -f supabase/migrations/20251009_002_customer_confirmations.sql
supabase db execute -f supabase/migrations/20251009_003_dynamic_risk_calculation.sql
```

---

## ✅ **VERIFICACIÓN POST-MIGRACIÓN**

Ejecuta estas queries para verificar que todo funciona:

### **1. Verificar tabla creada:**
```sql
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_confirmations'
ORDER BY ordinal_position;
```

**Deberías ver:** 14 columnas (id, customer_id, reservation_id, restaurant_id, sent_at, message_type, message_channel, message_content, responded_at, response_time_minutes, response_content, confirmed, created_at, updated_at)

---

### **2. Verificar funciones creadas:**
```sql
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'record_customer_confirmation',
    'update_confirmation_response',
    'get_customer_response_metrics',
    'calculate_dynamic_risk_score',
    'predict_upcoming_noshows_v2',
    'get_dynamic_noshow_metrics'
)
ORDER BY routine_name;
```

**Deberías ver:** 6 funciones de tipo 'FUNCTION'

---

### **3. Probar función de riesgo dinámico:**
```sql
-- Obtener una reserva de prueba
SELECT id, customer_name, reservation_date, reservation_time
FROM reservations
WHERE restaurant_id = '<TU_RESTAURANT_ID>'
AND status IN ('confirmed', 'pending', 'confirmada', 'pendiente')
AND reservation_date >= CURRENT_DATE
LIMIT 1;

-- Calcular su riesgo dinámico (usa el ID de arriba)
SELECT * FROM calculate_dynamic_risk_score('<RESERVATION_ID_AQUI>');
```

**Deberías ver:** JSON con risk_score, risk_level, risk_factors, etc.

---

### **4. Probar predicción v2:**
```sql
SELECT * FROM predict_upcoming_noshows_v2(
    '<TU_RESTAURANT_ID>',
    2  -- próximos 2 días
)
LIMIT 5;
```

**Deberías ver:** Reservas con riesgo calculado dinámicamente

---

## 📊 **CÓMO USAR EL SISTEMA**

### **CASO 1: Registrar envío de confirmación T-24h**

```sql
SELECT record_customer_confirmation(
    '<reservation_id>'::UUID,
    'T-24h',
    'whatsapp',
    'Hola! Confirma tu reserva para mañana a las 20:00h. Responde SI para confirmar.'
);
```

Esto crea un registro en `customer_confirmations` con estado "enviado".

---

### **CASO 2: Registrar respuesta del cliente**

```sql
SELECT update_confirmation_response(
    '<confirmation_id>'::UUID,  -- ID devuelto en caso 1
    'Sí, confirmo!',
    TRUE  -- confirmed = true
);
```

Esto actualiza:
- `responded_at` → Timestamp actual
- `response_time_minutes` → Calculado automáticamente
- `confirmed` → TRUE

Y automáticamente **recalcula el riesgo** de la reserva (score baja).

---

### **CASO 3: Ver riesgo dinámico en Dashboard**

```javascript
// En el frontend (React)
const { data: riskData } = await supabase
    .rpc('predict_upcoming_noshows_v2', {
        p_restaurant_id: restaurant.id,
        p_days_ahead: 2
    });

console.log(riskData);
// Verás: base_score, dynamic_adjustment, final risk_score
```

---

## 🎯 **FLUJO COMPLETO DE EJEMPLO**

### **Escenario: Juan García hace reserva para mañana**

1. **Reserva creada:**
   - Base score: 75 pts (tiene 40% no-shows históricos + grupo grande)
   - Risk level: **ALTO** 🔴

2. **T-24h: Sistema envía WhatsApp:**
   ```sql
   SELECT record_customer_confirmation(
       '550e8400-e29b-41d4-a716-446655440000'::UUID,  -- reservation_id
       'T-24h',
       'whatsapp',
       'Confirma tu reserva...'
   );
   ```

3. **Juan responde en 10 minutos:**
   ```sql
   SELECT update_confirmation_response(
       '<confirmation_id>',
       'Sí, confirmo',
       TRUE
   );
   ```

4. **Sistema recalcula riesgo:**
   - Base score: 75 pts
   - Ajuste dinámico: **-30 pts** (respondió <1h)
   - **Nuevo score: 45 pts** → **MEDIO** 🟡

5. **T-4h: Sistema envía recordatorio suave:**
   ```sql
   SELECT record_customer_confirmation(
       '550e8400-e29b-41d4-a716-446655440000'::UUID,
       'T-4h',
       'whatsapp',
       'Te esperamos en 4 horas!'
   );
   ```

6. **Juan responde: "Ok!":**
   ```sql
   SELECT update_confirmation_response(
       '<confirmation_id>',
       'Ok!',
       TRUE
   );
   ```

7. **Sistema recalcula de nuevo:**
   - Base score: 75 pts
   - Ajuste: -30 (T-24h) -20 (T-4h) = **-50 pts**
   - **Nuevo score: 25 pts** → **BAJO** 🟢

8. **T-2h 15min: NO salta alarma** ✅ (porque score < 60)

---

## 🎨 **EJEMPLOS VISUALES PARA LA UI**

Estos ejemplos ya están implementados en `NoShowControlNuevo.jsx`:

### **Ejemplo 1: ALTO RIESGO → Baja a MEDIO**
```
Juan García
├─ Base: 75 pts (historial 40% + inactivo 8 meses + grupo 8 personas)
├─ Confirma T-24h en 10 min: -30 pts
└─ Final: 45 pts → MEDIO 🟡 → WhatsApp reforzado T-4h
```

### **Ejemplo 2: MEDIO RIESGO → Baja a BAJO**
```
María López
├─ Base: 45 pts (historial 15% + horario 22h + canal teléfono)
├─ Confirma T-24h: -20 pts
├─ Confirma T-4h: -20 pts
└─ Final: 5 pts → BAJO 🟢 → Solo recordatorio T-24h
```

### **Ejemplo 3: BAJO RIESGO → Se mantiene**
```
Ana Martínez
├─ Base: 0 pts (cliente fiable, frecuente, todo normal)
├─ Confirma T-24h: -10 pts (ya era bajo)
└─ Final: 0 pts → BAJO 🟢 → Recordatorio estándar
```

---

## 🚨 **ERRORES COMUNES Y SOLUCIONES**

### **Error 1: "function does not exist"**
**Causa:** No aplicaste las migraciones
**Solución:** Ejecuta los 2 archivos SQL en orden

### **Error 2: "table customer_confirmations does not exist"**
**Causa:** Solo aplicaste la migración 2 sin la 1
**Solución:** Aplica primero `20251009_002_customer_confirmations.sql`

### **Error 3: "permission denied for function"**
**Causa:** RLS policies no aplicadas
**Solución:** Verifica que las políticas se crearon correctamente

---

## 📝 **PRÓXIMOS PASOS**

Después de aplicar las migraciones:

1. ✅ **Actualizar UI** para mostrar riesgo dinámico
2. ✅ **Integrar con N8n** para registrar confirmaciones automáticas
3. ✅ **Testing** con reservas reales
4. ✅ **Monitorear** métricas de confirmación

---

## 🎉 **BENEFICIOS DEL SISTEMA DINÁMICO**

| Antes (Estático) | Después (Dinámico) |
|-----------------|-------------------|
| Riesgo fijo | ✅ Riesgo que cambia en tiempo real |
| Llamadas innecesarias | ✅ Solo llamas si no confirma |
| Sin feedback | ✅ Se adapta a respuestas |
| Cliente "malo" siempre | ✅ Cliente "malo" puede mejorar |
| Experiencia robótica | ✅ Experiencia personalizada |

---

**¿Listo para aplicar?** 🚀

**SIGUIENTE PASO:** Ejecuta las 2 migraciones en Supabase y avísame cuando esté listo para actualizar la UI.


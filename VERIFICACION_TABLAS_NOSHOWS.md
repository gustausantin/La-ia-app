# ✅ VERIFICACIÓN DE TABLAS PARA SISTEMA NO-SHOWS

**Fecha:** 2025-10-09  
**Propósito:** Verificar qué tablas existen y qué necesitamos crear

---

## 📊 TABLAS EXISTENTES VERIFICADAS:

### 1. ✅ `reservations` - EXISTE
**Columna `status`:** VARCHAR, Default: `'confirmed'`

**Estados actuales documentados:**
- `confirmed` - Confirmada
- `cancelled` - Cancelada
- `completed` - Completada
- `no_show` - No se presentó

**Estados NUEVOS que necesitamos para el flujo:**
- `pending` - Recién creada, sin confirmar
- `pending_risk` - T-24h sin respuesta (riesgo medio)
- `high_risk` - T-4h sin respuesta (riesgo alto)
- `needs_call` - T-2h 15min - Requiere llamada URGENTE
- `cancelled_noshow` - Liberada automáticamente por no confirmar

**✅ ACCIÓN:** Necesitamos verificar si estos estados están permitidos o si el campo `status` tiene un CHECK constraint

---

### 2. ✅ `noshow_actions` - EXISTE

**Columnas verificadas:**
```sql
id UUID
restaurant_id UUID (FK)
reservation_id UUID
customer_id UUID
customer_name VARCHAR
customer_phone VARCHAR
reservation_date DATE
reservation_time TIME
party_size INT
risk_level VARCHAR
risk_score INT
risk_factors JSONB (default '[]')
action_type VARCHAR
template_id UUID
template_name VARCHAR
message_sent TEXT
channel VARCHAR (default 'whatsapp')
customer_response VARCHAR
response_time INTERVAL
response_message TEXT
final_outcome VARCHAR
prevented_noshow BOOLEAN (default false)
sent_at TIMESTAMPTZ
response_received_at TIMESTAMPTZ
reservation_completed_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**✅ PERFECTO:** Esta tabla ya tiene TODO lo que necesitamos para tracking

---

### 3. ❌ `noshow_alerts` - NO EXISTE

**Propósito:** Almacenar alarmas activas para que el personal llame

**Estructura propuesta:**
```sql
CREATE TABLE noshow_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR NOT NULL,
    customer_phone VARCHAR,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INT NOT NULL,
    risk_score INT NOT NULL,
    alert_type VARCHAR NOT NULL DEFAULT 'needs_call', -- 'needs_call', 'auto_release'
    status VARCHAR NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'expired'
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    auto_release_at TIMESTAMPTZ, -- Hora de liberación automática (T-2h)
    
    -- Índices
    CONSTRAINT noshow_alerts_restaurant_date_idx 
        UNIQUE(restaurant_id, reservation_id, created_at)
);

-- RLS
ALTER TABLE noshow_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own restaurant alerts"
    ON noshow_alerts FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_restaurant_mapping 
        WHERE user_id = auth.uid()
    ));
```

**✅ ACCIÓN:** Crear esta tabla en migración SQL

---

### 4. ✅ `message_templates` - EXISTE

**Usado para:** Plantillas de WhatsApp automáticos

**Categorías necesarias:**
- `noshow_prevention` - Mensajes de confirmación
- `noshow_reminder` - Recordatorios

**✅ YA EXISTE:** Verificado en esquema

---

### 5. ✅ `restaurants.settings` (JSONB) - EXISTE

**Necesitamos añadir:**
```json
{
  "noshow_automation": {
    "enabled": true,
    "whatsapp_24h": true,
    "whatsapp_4h": true,
    "alert_2h15min": true,
    "auto_release_2h": true,
    "default_risk_thresholds": {
      "low": 30,
      "medium": 60,
      "high": 80
    }
  }
}
```

**✅ ACCIÓN:** No requiere migración, solo UPSERT en settings

---

## 🔧 MIGRACIONES NECESARIAS:

### **Migración 1: Crear tabla `noshow_alerts`**
```sql
-- supabase/migrations/20251009_001_create_noshow_alerts.sql
```

### **Migración 2: (OPCIONAL) Modificar CHECK constraint de `reservations.status`**
Solo si hay constraint que limite los valores actuales.

**Query para verificar:**
```sql
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'reservations' 
AND constraint_name LIKE '%status%';
```

---

## ✅ RESUMEN:

| Tabla/Campo | Existe | Acción Requerida |
|-------------|--------|------------------|
| `reservations` | ✅ | Verificar CHECK constraint de `status` |
| `noshow_actions` | ✅ | ✅ Listo para usar |
| `noshow_alerts` | ❌ | Crear tabla nueva |
| `message_templates` | ✅ | ✅ Listo para usar |
| `restaurants.settings` | ✅ | Añadir sección `noshow_automation` |

---

## 🚀 SIGUIENTE PASO:

1. Crear migración SQL para `noshow_alerts`
2. Verificar constraint de `reservations.status`
3. Proceder con las páginas de prueba

---

**Estado:** ✅ VERIFICACIÓN COMPLETADA


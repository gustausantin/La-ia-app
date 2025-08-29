# 🧾 **GUÍA DE INTEGRACIÓN - FACTURACIÓN Y TICKETS**

## 📋 **RESUMEN EJECUTIVO**

Sistema completo para vincular **reservas ↔ consumo real** mediante tickets de facturación, permitiendo CRM automático basado en datos reales de gasto.

---

## 🗄️ **ESQUEMA DE BASE DE DATOS**

### **Tabla: `billing_tickets`**

```sql
-- Campos principales
id UUID PRIMARY KEY
restaurant_id UUID → restaurants(id)
reservation_id UUID → reservations(id) [OPCIONAL]
table_id UUID → tables(id) [OPCIONAL] 
customer_id UUID → customers(id) [OPCIONAL]

-- Datos del ticket
ticket_number VARCHAR(100) -- Número único del sistema de caja
external_ticket_id VARCHAR(255) -- ID en sistema externo
ticket_date TIMESTAMP

-- Productos (JSON)
items JSONB -- [{"name", "quantity", "unit_price", "total_price", "category"}]

-- Totales financieros
subtotal DECIMAL(10,2)
tax_amount DECIMAL(10,2)
discount_amount DECIMAL(10,2)
total_amount DECIMAL(10,2)
payment_method VARCHAR(50)

-- Metadatos
covers_count INTEGER -- comensales
waiter_name VARCHAR(255)
source_system VARCHAR(100) -- 'manual', 'tpv_api', 'csv_import'
```

---

## 🔧 **MÉTODOS DE INTEGRACIÓN**

### **1️⃣ INTEGRACIÓN MANUAL**
```javascript
// Crear ticket desde interfaz web
const createManualTicket = async (reservationId, ticketData) => {
    const { data, error } = await supabase.rpc('create_ticket_from_reservation', {
        p_reservation_id: reservationId,
        p_ticket_number: ticketData.ticket_number,
        p_items: ticketData.items,
        p_total_amount: ticketData.total_amount,
        p_payment_method: ticketData.payment_method
    });
    return { data, error };
};
```

### **2️⃣ INTEGRACIÓN API REST**
```javascript
// Endpoint para sistemas de caja externos
POST /api/billing/tickets

{
    "restaurant_id": "uuid",
    "ticket_number": "TICKET-12345",
    "external_ticket_id": "TPV-98765",
    "table_number": 5,
    "customer_phone": "+34600123456", // Para buscar cliente
    "items": [
        {
            "name": "Paella Valenciana",
            "quantity": 2,
            "unit_price": 18.50,
            "total_price": 37.00,
            "category": "Principales"
        }
    ],
    "total_amount": 49.00,
    "payment_method": "tarjeta",
    "timestamp": "2025-01-29T20:30:00Z"
}
```

### **3️⃣ IMPORTACIÓN CSV**
```csv
ticket_number,date,table,customer_phone,items_json,total_amount,payment_method
TICKET-001,2025-01-29,Mesa 3,+34600123456,"[{""name"":""Paella"",""price"":37}]",49.00,efectivo
```

### **4️⃣ INTEGRACIÓN N8N (WORKFLOW AUTOMATION)**
```json
{
    "workflow": "TPV → Supabase",
    "trigger": "Webhook desde sistema de caja",
    "steps": [
        {
            "node": "Webhook",
            "config": "Recibir datos del TPV"
        },
        {
            "node": "Transform",
            "config": "Formatear datos para Supabase"
        },
        {
            "node": "Supabase",
            "config": "Insertar en billing_tickets"
        }
    ]
}
```

---

## 📊 **ACTUALIZACIÓN AUTOMÁTICA DE STATS**

### **Stats de Cliente Automáticos:**
- ✅ **Total gastado:** Suma de `total_amount` de todos sus tickets
- ✅ **Número de visitas:** Días únicos con tickets
- ✅ **Última visita:** Fecha del ticket más reciente
- ✅ **Ticket medio:** Promedio de gasto por visita

### **Trigger Automático:**
```sql
-- Se ejecuta automáticamente al insertar/actualizar ticket
CREATE TRIGGER update_customer_stats_from_ticket
    AFTER INSERT OR UPDATE ON billing_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats_from_ticket();
```

---

## 🎯 **SEGMENTACIÓN AUTOMÁTICA**

### **Reglas Basadas en Facturación Real:**

```javascript
const CUSTOMER_SEGMENTS = {
    'nuevo': { 
        criteria: customer => customer.total_visits <= 1,
        color: 'green'
    },
    'regular': { 
        criteria: customer => customer.total_visits >= 3 && customer.total_visits <= 8,
        color: 'blue'
    },
    'vip': { 
        criteria: customer => customer.total_spent >= 500 || customer.total_visits >= 10,
        color: 'purple'
    },
    'alto_valor': { 
        criteria: customer => customer.total_spent >= 1000,
        color: 'yellow'
    },
    'inactivo': { 
        criteria: customer => {
            const daysSinceLastVisit = (Date.now() - new Date(customer.last_visit)) / (1000*60*60*24);
            return daysSinceLastVisit > 60;
        },
        color: 'gray'
    }
};
```

---

## 📈 **ANALYTICS Y REPORTES**

### **RPC de Analytics:**
```sql
SELECT get_billing_analytics(
    restaurant_id, 
    '2025-01-01'::date, 
    '2025-01-31'::date
);
```

### **Resultados de Ejemplo:**
```json
{
    "total_revenue": 15420.50,
    "total_tickets": 127,
    "average_ticket": 121.42,
    "top_customers": [
        {
            "name": "María García",
            "email": "maria@email.com",
            "visits": 8,
            "total_spent": 456.30,
            "avg_ticket": 57.04
        }
    ],
    "daily_revenue": [
        {"date": "2025-01-01", "tickets": 12, "revenue": 892.30}
    ]
}
```

---

## 🔌 **SISTEMAS DE CAJA COMPATIBLES**

### **TPVs Populares en España:**

| Sistema | Método Integración | API Disponible | Dificultad |
|---------|-------------------|----------------|------------|
| **Revel Systems** | API REST | ✅ | Fácil |
| **Lightspeed** | API REST + Webhooks | ✅ | Fácil |
| **Toast POS** | API REST | ✅ | Medio |
| **Square** | API REST | ✅ | Fácil |
| **Loyverse** | API REST | ✅ | Fácil |
| **TPV Genérico** | CSV Export | ❌ | Manual |
| **Sistema Custom** | Webhook/API | Depende | Variable |

### **Ejemplo API Lightspeed:**
```javascript
// Configuración webhook en Lightspeed
const webhookConfig = {
    url: 'https://tu-app.vercel.app/api/lightspeed/webhook',
    events: ['sale.created', 'sale.updated'],
    headers: {
        'Authorization': 'Bearer your-api-key'
    }
};

// Handler del webhook
export default async function handler(req, res) {
    const { event, data } = req.body;
    
    if (event === 'sale.created') {
        await createTicketFromLightspeed(data);
    }
    
    res.status(200).json({ success: true });
}
```

---

## 🚀 **PLAN DE IMPLEMENTACIÓN**

### **Fase 1: Base Manual (1-2 días)**
- ✅ Tabla `billing_tickets` creada
- ✅ RPC `create_ticket_from_reservation` 
- ✅ Triggers automáticos de stats
- 🔄 Interface para crear tickets manuales

### **Fase 2: CSV Import (2-3 días)**
- 📋 Función de importación CSV
- 📋 Validación y mapping de datos
- 📋 Preview antes de importar

### **Fase 3: API REST (3-5 días)**
- 📋 Endpoint `/api/billing/tickets`
- 📋 Autenticación y validación
- 📋 Documentación API

### **Fase 4: Integraciones Específicas (1-2 semanas)**
- 📋 Webhooks para TPVs populares
- 📋 N8N workflows
- 📋 Monitoring y logs

---

## 💡 **CASOS DE USO REALES**

### **Caso 1: Restaurante con Lightspeed**
```
1. Cliente hace reserva → Sistema crea reserva con table_id + customer_id
2. Cliente llega → Camarero toma pedido en Lightspeed
3. Se paga → Lightspeed envía webhook con ticket
4. Sistema recibe webhook → Crea billing_ticket vinculado
5. Stats del cliente se actualizan automáticamente
6. Segmentación se recalcula → Cliente pasa de "nuevo" a "regular"
```

### **Caso 2: Restaurante sin TPV Digital**
```
1. Cliente hace reserva y consume
2. Al final del día → Camarero exporta CSV de ventas
3. Manager sube CSV → Sistema importa y vincula tickets
4. Stats de todos los clientes se actualizan
5. CRM automático funciona con 1 día de delay
```

### **Caso 3: Restaurante con TPV Custom**
```
1. Desarrollador crea webhook desde TPV → La IA App
2. Configuración una vez → Tickets se sincronizan automáticamente
3. Zero trabajo manual → CRM 100% automático
```

---

## 🔒 **SEGURIDAD Y COMPLIANCE**

- ✅ **RLS (Row Level Security)** por restaurante
- ✅ **Datos encriptados** en tránsito y reposo
- ✅ **Validación de totales** con constraints SQL
- ✅ **Audit trail** con created_at/updated_at
- ✅ **GDPR compliant** con soft deletes

---

## 📞 **SOPORTE Y DOCUMENTACIÓN**

- 📧 **Soporte técnico:** support@la-ia-app.com
- 📖 **API Docs:** https://docs.la-ia-app.com/billing
- 🎥 **Video tutoriales:** Configuración de integraciones
- 🔧 **Herramientas test:** Sandbox para probar webhooks

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **Para Restaurantes:**
- [ ] Identificar sistema de caja actual
- [ ] Verificar si tiene API o export CSV
- [ ] Configurar integración elegida
- [ ] Probar con datos de prueba
- [ ] Importar datos históricos (opcional)
- [ ] Capacitar al equipo

### **Para Desarrolladores:**
- [ ] Subir migración `20250129_001_billing_tickets_table.sql`
- [ ] Crear interfaces de importación manual
- [ ] Implementar endpoints API
- [ ] Configurar webhooks según TPV
- [ ] Setup monitoring y alertas
- [ ] Documentar APIs custom

---

**🎯 OBJETIVO FINAL:** CRM completamente automático basado en datos reales de facturación, sin trabajo manual del restaurante.

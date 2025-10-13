# 📋 N8N WORKFLOWS - LA-IA APP

**Última actualización:** 13 Octubre 2025

---

## 📁 WORKFLOWS ACTIVOS:

### **🤖 SISTEMA DE IA Y CLASIFICACIÓN:**

#### **1. `1-whatsapp-input-with-buffer.json`**
- **Función:** Buffer de mensajes WhatsApp
- **Descripción:** Recibe mensajes y los almacena temporalmente
- **Trigger:** Webhook WhatsApp

#### **2. `2-gateway-unified.json`**
- **Función:** Gateway unificado de entrada
- **Descripción:** Punto de entrada unificado para todos los canales
- **Trigger:** Múltiples fuentes

#### **3. `3-classifier-super-agent.json`**
- **Función:** Clasificador inteligente de mensajes
- **Descripción:** Usa IA para clasificar y enrutar mensajes
- **Trigger:** Desde gateway

---

### **📱 SISTEMA DE RECORDATORIOS CRM:**

#### **4. `02-recordatorio-24h-SIMPLE-FINAL.json`**
- **Función:** Recordatorio 24h antes de reserva
- **Cron:** Diario a las 10:00 AM
- **Plantilla:** `confirmacion_24h` (desde Supabase)
- **Envío:** WhatsApp vía Twilio
- **Descripción:** Envía confirmación anticipada a clientes con reservas para mañana

**Flujo:**
```
Cron 10:00 AM
  ↓
Buscar reservas para mañana (status=pending)
  ↓
Por cada reserva:
  ↓
Obtener plantilla activa (confirmacion_24h)
  ↓
Reemplazar variables (nombre, hora, personas)
  ↓
Enviar WhatsApp
  ↓
Registrar en customer_confirmations
```

#### **5. `03-recordatorio-4h-antes-FINAL.json`**
- **Función:** Recordatorio urgente 4h antes de reserva
- **Cron:** Cada 2 horas
- **Plantilla:** `confirmacion_4h` (desde Supabase)
- **Envío:** WhatsApp vía Twilio
- **Descripción:** Recordatorio urgente para reservas de hoy

**Flujo:**
```
Cron cada 2h
  ↓
Buscar reservas HOY entre 4-4.5h (ventana de 30 min)
  ↓
Por cada reserva:
  ↓
Obtener plantilla activa (confirmacion_4h)
  ↓
Reemplazar variables (nombre, hora, personas)
  ↓
Enviar WhatsApp urgente 🚨
  ↓
Registrar en customer_confirmations
```

---

## 🔧 CONFIGURACIÓN NECESARIA:

### **Credenciales en N8N:**

1. **Supabase La-IA**
   - URL: `https://ktsqwvhqamedpmzkzjaz.supabase.co`
   - Key: Anon key

2. **Twilio account**
   - Account SID
   - Auth Token
   - WhatsApp From: `whatsapp:+14155238886`

---

## 📊 PLANTILLAS CRM (Supabase):

Los workflows 02 y 03 usan plantillas dinámicas desde `message_templates`:

| Categoría | Nombre | Uso |
|-----------|--------|-----|
| `confirmacion_24h` | "Confirmación 24h Antes" | Workflow 02 |
| `confirmacion_4h` | "Recordatorio Urgente" | Workflow 03 |

**Variables disponibles:**
- `{{customer_name}}` - Nombre del cliente
- `{{restaurant_name}}` - Nombre del restaurante
- `{{reservation_time}}` - Hora de reserva
- `{{party_size}}` - Número de personas

---

## 🚀 CÓMO IMPORTAR:

1. Abrir N8N: `http://localhost:5678`
2. Click en **"+"** → **"Import from File"**
3. Seleccionar el `.json` correspondiente
4. Verificar credenciales (Supabase + Twilio)
5. Activar workflow

---

## ⚠️ IMPORTANTE:

- **Solo una plantilla activa** por categoría (`is_active = true`)
- **Ventana de 4h:** Entre 4h y 4.5h para evitar duplicados
- **Multi-tenant:** Cada restaurante sus plantillas
- **Fallback:** Si falla plantilla, usa mensaje por defecto

---

## 📈 PRÓXIMOS WORKFLOWS:

- [ ] Seguimiento No-Show (recordar política)
- [ ] Bienvenida cliente VIP
- [ ] Reactivación clientes inactivos

---

**Documentación completa:** `docs/02-sistemas/SISTEMA-N8N-AGENTE-IA.md`


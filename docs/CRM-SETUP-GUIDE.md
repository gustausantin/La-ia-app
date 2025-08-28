# 🎯 **CRM SISTEMA INTELIGENTE - GUÍA DE CONFIGURACIÓN**

## 📋 **ÍNDICE**
1. [Variables de Entorno](#variables-de-entorno)
2. [Configuración de Base de Datos](#configuración-de-base-de-datos)
3. [Integración con N8N](#integración-con-n8n)
4. [Configuración de Servicios Externos](#configuración-de-servicios-externos)
5. [Job Diario (Cron)](#job-diario-cron)
6. [Testing y Verificación](#testing-y-verificación)

---

## 🔐 **VARIABLES DE ENTORNO**

### **Archivo `.env` requerido:**

```bash
# ===== SUPABASE =====
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ===== CRM API =====
CRM_API_KEY=your-secret-api-key-for-cron-jobs

# ===== N8N INTEGRATION =====
REACT_APP_N8N_BASE_URL=https://n8n.tu-dominio.com
REACT_APP_N8N_API_KEY=your-n8n-api-key

# ===== EMAIL SERVICE (SENDGRID) =====
REACT_APP_SENDGRID_API_KEY=your-sendgrid-api-key
REACT_APP_FROM_EMAIL=noreply@tu-restaurante.com

# ===== SMS SERVICE (TWILIO) =====
REACT_APP_TWILIO_ACCOUNT_SID=your-twilio-account-sid
REACT_APP_TWILIO_AUTH_TOKEN=your-twilio-auth-token
REACT_APP_TWILIO_PHONE_NUMBER=+1234567890

# ===== WHATSAPP API =====
REACT_APP_WHATSAPP_API_URL=https://api.whatsapp.com
REACT_APP_WHATSAPP_API_TOKEN=your-whatsapp-api-token

# ===== DEVELOPMENT FLAGS =====
NODE_ENV=development
REACT_APP_DEBUG_MODE=true
REACT_APP_SIMULATE_SENDS=true
```

---

## 🗄️ **CONFIGURACIÓN DE BASE DE DATOS**

### **1. Ejecutar Migraciones**

```sql
-- Ejecutar en orden:
-- 1. 20250128_001_crm_customers_enhanced.sql
-- 2. 20250128_002_crm_interactions_table.sql
-- 3. 20250128_003_crm_automation_rules.sql
-- 4. 20250128_004_crm_message_templates_enhanced.sql
```

### **2. Verificar Tablas Creadas**

```sql
-- Verificar que existan todas las tablas:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'customer_interactions',
    'automation_rules', 
    'automation_rule_executions',
    'message_templates',
    'template_variables'
);
```

### **3. Configurar RLS (Row Level Security)**

Las migraciones incluyen RLS automático, pero verificar:

```sql
-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE '%customer%' OR tablename LIKE '%automation%';
```

---

## 🔗 **INTEGRACIÓN CON N8N**

### **1. Workflows Requeridos**

Crear estos workflows en N8N:

#### **A) Reserva Completada**
- **Webhook URL:** `/webhook/crm/reservation-completed`
- **Trigger:** POST desde la app
- **Acciones:** Actualizar CRM externo, enviar notificaciones

#### **B) Cambio de Segmento**
- **Webhook URL:** `/webhook/crm/segment-changed`
- **Trigger:** POST cuando cliente cambia segmento
- **Acciones:** Activar campañas específicas

#### **C) Envío de Email**
- **Webhook URL:** `/webhook/crm/send-email`
- **Trigger:** POST con datos del email
- **Acciones:** SendGrid/SMTP, tracking

#### **D) Envío de SMS**
- **Webhook URL:** `/webhook/crm/send-sms`
- **Trigger:** POST con datos del SMS
- **Acciones:** Twilio, tracking

#### **E) Envío de WhatsApp**
- **Webhook URL:** `/webhook/crm/send-whatsapp`
- **Trigger:** POST con datos del WhatsApp
- **Acciones:** WhatsApp Business API

#### **F) Job Diario**
- **Webhook URL:** `/webhook/crm/daily-job`
- **Trigger:** POST con resultados del job
- **Acciones:** Reportes, alertas

### **2. Configuración N8N**

```javascript
// Ejemplo de workflow N8N para envío de email
{
  "nodes": [
    {
      "parameters": {
        "path": "/webhook/crm/send-email",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "parameters": {
        "authentication": "sendGridApi",
        "fromEmail": "={{$node.Webhook.json.data.email_config.from}}",
        "toEmail": "={{$node.Webhook.json.data.email_config.to}}",
        "subject": "={{$node.Webhook.json.data.email_config.subject}}",
        "emailType": "html",
        "html": "={{$node.Webhook.json.data.email_config.html_content}}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.sendGrid"
    }
  ]
}
```

---

## 📧 **CONFIGURACIÓN DE SERVICIOS EXTERNOS**

### **1. SendGrid (Email)**

```bash
# 1. Crear cuenta en SendGrid
# 2. Generar API Key
# 3. Configurar dominio y DNS
# 4. Agregar API Key a .env
REACT_APP_SENDGRID_API_KEY=SG.xxxxx
REACT_APP_FROM_EMAIL=noreply@tu-restaurante.com
```

### **2. Twilio (SMS)**

```bash
# 1. Crear cuenta en Twilio
# 2. Comprar número de teléfono
# 3. Generar credenciales
REACT_APP_TWILIO_ACCOUNT_SID=ACxxxxx
REACT_APP_TWILIO_AUTH_TOKEN=xxxxx
REACT_APP_TWILIO_PHONE_NUMBER=+1234567890
```

### **3. WhatsApp Business API**

```bash
# Opción 1: WhatsApp Business API oficial
# Opción 2: Servicio tercero (Twilio, ChatAPI, etc.)
REACT_APP_WHATSAPP_API_URL=https://api.chatapi.com
REACT_APP_WHATSAPP_API_TOKEN=xxxxx
```

---

## ⏰ **JOB DIARIO (CRON)**

### **1. Configurar Cron Job**

```bash
# Agregar a crontab del servidor
# Ejecutar todos los días a las 6:00 AM
0 6 * * * curl -X POST \
  -H "Authorization: Bearer your-secret-api-key" \
  https://tu-app.vercel.app/api/crm-daily-job
```

### **2. Alternativa: GitHub Actions**

```yaml
# .github/workflows/crm-daily-job.yml
name: CRM Daily Job
on:
  schedule:
    - cron: '0 6 * * *'  # 6:00 AM UTC diariamente
  workflow_dispatch:  # Permite ejecución manual

jobs:
  run-crm-job:
    runs-on: ubuntu-latest
    steps:
      - name: Execute CRM Job
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRM_API_KEY }}" \
            https://tu-app.vercel.app/api/crm-daily-job
```

### **3. Alternativa: Vercel Cron Jobs**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/crm-daily-job",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### **4. Monitoreo del Job**

```bash
# Verificar ejecución del job
curl -X GET \
  -H "Authorization: Bearer your-secret-api-key" \
  https://tu-app.vercel.app/api/crm-status
```

---

## 🧪 **TESTING Y VERIFICACIÓN**

### **1. Test de Configuración CRM**

```javascript
// En consola del navegador (página /configuracion)
import { getCRMStats } from '../services/CRMService';

const stats = await getCRMStats('restaurant-id');
console.log('CRM Stats:', stats);
```

### **2. Test de Segmentación**

```javascript
// Test de recomputar segmento
import { recomputeSegment } from '../services/CRMService';

const result = await recomputeSegment('customer-id', 'restaurant-id');
console.log('Segmentation Result:', result);
```

### **3. Test de Automatizaciones**

```javascript
// Test de automatizaciones
import { runCRMAutomations } from '../services/CRMAutomationService';

const result = await runCRMAutomations('restaurant-id');
console.log('Automation Result:', result);
```

### **4. Test de Webhooks**

```javascript
// Test de webhook
import { triggerReservationWebhook } from '../services/CRMWebhookService';

const result = await triggerReservationWebhook(
  { id: 'reservation-id', customer_name: 'Test' },
  { id: 'customer-id', name: 'Test Customer' },
  { segmentChanged: true, newSegment: 'vip' }
);
console.log('Webhook Result:', result);
```

### **5. Test Manual del Job Diario**

```bash
# Ejecutar job manualmente
curl -X POST \
  -H "Authorization: Bearer your-secret-api-key" \
  -H "Content-Type: application/json" \
  https://tu-app.vercel.app/api/crm-daily-job
```

---

## 📊 **MÉTRICAS Y MONITOREO**

### **1. Dashboard CRM**

- Acceder a `/configuracion` → "CRM & IA"
- Verificar umbrales configurados
- Ver preview de segmentación

### **2. Métricas en Supabase**

```sql
-- Ver estadísticas de automatizaciones
SELECT 
    rule_type,
    COUNT(*) as executions,
    COUNT(CASE WHEN status = 'executed' THEN 1 END) as successful
FROM automation_rule_executions 
WHERE executed_at >= NOW() - INTERVAL '7 days'
GROUP BY rule_type;

-- Ver interacciones por canal
SELECT 
    channel,
    interaction_type,
    status,
    COUNT(*) as count
FROM customer_interactions 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY channel, interaction_type, status;
```

### **3. Logs y Debugging**

```javascript
// Activar logs detallados
localStorage.setItem('crm_debug', 'true');

// Ver logs en consola
console.log('CRM Debug Mode Enabled');
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comunes:**

1. **Job diario no ejecuta:**
   - Verificar API key en headers
   - Verificar endpoint accesible
   - Revisar logs en Vercel/servidor

2. **Webhooks fallan:**
   - Verificar N8N running
   - Verificar URLs de webhook
   - Verificar headers de autenticación

3. **Emails no llegan:**
   - Verificar SendGrid API key
   - Verificar dominio configurado
   - Verificar DNS y SPF records

4. **Segmentación incorrecta:**
   - Verificar umbrales en configuración
   - Ejecutar recompute manual
   - Verificar datos de reservas

---

## 🎯 **PRÓXIMOS PASOS**

1. **Configurar todos los servicios externos**
2. **Crear workflows N8N**
3. **Configurar cron job**
4. **Probar todo el flujo end-to-end**
5. **Monitorear y optimizar**

---

**📞 ¿Necesitas ayuda?** Consulta los logs en la consola del navegador o revisa la documentación técnica en `/docs/`.

✅ **CRM Sistema Inteligente listo para producción!** 🚀

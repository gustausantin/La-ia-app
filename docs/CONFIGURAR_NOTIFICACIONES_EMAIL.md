# 📧 Configuración de Notificaciones por Email

## Sistema Profesional de Notificaciones Automáticas

Este documento explica cómo configurar el sistema de notificaciones por email que se activa automáticamente cuando hay eventos en las reservas.

---

## 🏗️ Arquitectura

```
Reserva creada/cancelada
    ↓
Database Trigger (Supabase)
    ↓
Edge Function (Supabase)
    ↓
API Endpoint /api/send-email (Vercel)
    ↓
SMTP Hostinger
    ↓
📧 Email al restaurante
```

---

## ⚙️ Paso 1: Configurar variables de entorno

### 1.1 En tu `.env` local:

```env
# SMTP Configuration (Hostinger)
SMTP_USER=noreply@la-ia.site
SMTP_PASSWORD=tu_contraseña_smtp_aquí

# Supabase (ya las tienes)
SUPABASE_URL=https://ktsqwvhqamedpmzkzjaz.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 1.2 En Vercel (Variables de entorno):

Ve a: https://vercel.com/tu-proyecto/settings/environment-variables

Añade:
- `SMTP_USER` = `noreply@la-ia.site`
- `SMTP_PASSWORD` = `[tu contraseña de Hostinger]`

**✅ Recuerda hacer redeploy después de añadir variables**

---

## 📦 Paso 2: Instalar dependencia (nodemailer)

```bash
npm install nodemailer
```

✅ Ya lo añadimos al código de `server.js`

---

## 🗄️ Paso 3: Habilitar extensión pg_net en Supabase

Los triggers necesitan la extensión `pg_net` para hacer peticiones HTTP.

### Opción A: Desde el Dashboard de Supabase

1. Ve a: https://supabase.com/dashboard/project/ktsqwvhqamedpmzkzjaz/database/extensions
2. Busca `pg_net`
3. Click en **Enable**

### Opción B: Por SQL

```sql
-- Ejecutar en el SQL Editor de Supabase
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 🚀 Paso 4: Desplegar Edge Function en Supabase

### 4.1 Instalar Supabase CLI:

```bash
npm install -g supabase
```

### 4.2 Login en Supabase:

```bash
supabase login
```

### 4.3 Link al proyecto:

```bash
supabase link --project-ref ktsqwvhqamedpmzkzjaz
```

### 4.4 Desplegar la función:

```bash
supabase functions deploy send-notification-email
```

### 4.5 Configurar secrets de la Edge Function:

```bash
# Service Role Key (para autenticación)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# URL de tu proyecto
supabase secrets set SUPABASE_URL=https://ktsqwvhqamedpmzkzjaz.supabase.co
```

---

## 🗃️ Paso 5: Ejecutar migración SQL (crear triggers)

### Opción A: Desde Supabase Dashboard

1. Ve a: https://supabase.com/dashboard/project/ktsqwvhqamedpmzkzjaz/sql/new
2. Copia todo el contenido de `supabase/migrations/create_email_notification_triggers.sql`
3. Pega y ejecuta

### Opción B: Por CLI

```bash
supabase db push
```

---

## ⚙️ Paso 6: Configurar settings en Supabase

Necesitamos configurar dos settings personalizados para que los triggers sepan dónde llamar:

```sql
-- Ejecutar en SQL Editor de Supabase
ALTER DATABASE postgres SET app.settings.edge_function_url TO 'https://ktsqwvhqamedpmzkzjaz.supabase.co/functions/v1/send-notification-email';

ALTER DATABASE postgres SET app.settings.service_role_key TO 'tu_service_role_key_aquí';
```

**⚠️ IMPORTANTE:** Reemplaza `tu_service_role_key_aquí` con tu Service Role Key real.

---

## ✅ Paso 7: Verificar que todo funciona

### 7.1 Verificar que los triggers se crearon:

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname LIKE '%notify%';
```

Deberías ver:
- `trigger_notify_new_reservation` → `reservations`
- `trigger_notify_cancelled_reservation` → `reservations`

### 7.2 Verificar que pg_net está activo:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Debería devolver 1 fila.

### 7.3 Test manual (crear reserva de prueba):

```sql
-- Crear una reserva de prueba (asegúrate de usar un restaurant_id real)
INSERT INTO reservations (
  restaurant_id,
  customer_name,
  customer_email,
  customer_phone,
  reservation_date,
  reservation_time,
  party_size,
  status,
  channel,
  source
) VALUES (
  'tu_restaurant_id_aquí', -- Reemplazar con un ID real
  'Cliente de Prueba',
  'test@example.com',
  '+34 600 000 000',
  CURRENT_DATE + INTERVAL '1 day',
  '20:00',
  4,
  'confirmed',
  'manual',
  'test'
);
```

**✅ Deberías recibir un email en los emails de notificación configurados del restaurante**

### 7.4 Revisar logs de la Edge Function:

```bash
supabase functions logs send-notification-email --project-ref ktsqwvhqamedpmzkzjaz
```

---

## 🎯 Configuración del restaurante

Para que un restaurante reciba notificaciones, debe tener configurado en `restaurants.settings`:

```json
{
  "contact_name": "José",
  "notification_emails": [
    "jose@restaurante.com",
    "recepcion@restaurante.com"
  ],
  "notifications": {
    "new_reservation": {
      "enabled": true
    },
    "cancelled_reservation": {
      "enabled": true
    },
    "quiet_hours": {
      "enabled": true,
      "start": "23:00",
      "end": "09:00",
      "mode": "silent"
    }
  }
}
```

**✅ Esto ya se configura desde la UI en `/configuracion` → Tab "Notificaciones"**

---

## 🐛 Troubleshooting

### Problema: No llegan emails

**Verificar:**
1. ✅ Variables de entorno en Vercel (`SMTP_USER`, `SMTP_PASSWORD`)
2. ✅ Contraseña SMTP correcta de Hostinger
3. ✅ Edge Function desplegada: `supabase functions list`
4. ✅ Triggers creados: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%'`
5. ✅ pg_net habilitado: `SELECT * FROM pg_extension WHERE extname = 'pg_net'`
6. ✅ Settings configurados: `SHOW app.settings.edge_function_url;`

### Problema: Error 401 Unauthorized

**Causa:** El Service Role Key no coincide.

**Solución:**
```bash
# Actualizar secret en Edge Function
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_key_correcta

# Actualizar setting en DB
ALTER DATABASE postgres SET app.settings.service_role_key TO 'tu_key_correcta';
```

### Problema: Trigger se ejecuta pero no llega email

**Revisar logs:**
```bash
# Logs de Edge Function
supabase functions logs send-notification-email

# Logs del servidor Vercel
vercel logs tu-proyecto
```

**Verificar que el endpoint `/api/send-email` responde:**
```bash
curl -X POST https://la-ia-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_service_role_key" \
  -d '{
    "from": "Test <noreply@la-ia.site>",
    "to": ["tu@email.com"],
    "subject": "Test",
    "html": "<h1>Test</h1>"
  }'
```

---

## 📊 Monitoreo

### Ver historial de emails enviados:

Los logs quedan en:
1. **Supabase Edge Function logs** (últimas 24h)
2. **Vercel logs** (últimos 7 días en plan free)
3. **Hostinger SMTP logs** (según plan)

### Métricas a vigilar:

- Tasa de entrega (debería ser ~100%)
- Tiempo de envío (debería ser <5 segundos)
- Errores de SMTP (verificar credenciales si >0%)

---

## 🎉 ¡Listo!

Ahora el sistema enviará emails automáticamente cuando:
- ✅ Se cree una nueva reserva
- ✅ Se cancele una reserva

**Sin tocar código, sin intervención manual, 100% profesional.**

---

## 📝 Notas adicionales

### Límites de Hostinger SMTP:
- Típicamente: 100-500 emails/hora
- 1,000-5,000 emails/día (según plan)

### Costos:
- **Hostinger SMTP:** $0 (ya incluido en tu hosting)
- **Supabase Edge Functions:** Gratis hasta 500k invocaciones/mes
- **Vercel API calls:** Gratis en plan hobby

### Escalabilidad futura:
Si superas límites de Hostinger, puedes migrar a:
- **Resend:** $0 hasta 3k emails/mes, luego $20/mes
- **SendGrid:** $0 hasta 100 emails/día, luego $20/mes
- **Amazon SES:** $0.10 por cada 1,000 emails


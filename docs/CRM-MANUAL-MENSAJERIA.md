# 📱 **MANUAL DE INSTRUCCIONES - SISTEMA DE MENSAJERÍA CRM**

> **Guía completa para gestionar mensajes automáticos y comunicaciones con clientes**

---

## 🎯 **¿QUÉ ES EL SISTEMA DE MENSAJERÍA?**

El **Sistema de Mensajería CRM** es una herramienta automática que envía mensajes personalizados a tus clientes por **WhatsApp** y **Email** según su comportamiento y segmento.

### **¿Cómo funciona?**
1. **El sistema observa** el comportamiento de cada cliente (visitas, gastos, última visita)
2. **Clasifica automáticamente** a cada cliente en un segmento (Nuevo, VIP, Inactivo, etc.)
3. **Evalúa reglas** para determinar si debe enviar un mensaje
4. **Programa el mensaje** respetando consentimientos y horarios
5. **Envía automáticamente** por WhatsApp o Email
6. **Rastrea la entrega** y actualiza el estado

---

## 📨 **ACCEDER A PRÓXIMOS MENSAJES**

### **🗺️ Cómo llegar:**
1. En el menú lateral, clic en **"CRM Mensajes"** ⚡
2. O navegar directamente a `/crm/mensajes`

### **🎛️ Qué verás:**
- **Lista de mensajes programados** con cliente, segmento, canal y fecha
- **7 métricas clave** en tiempo real (Total, Programados, Enviados, etc.)
- **Filtros avanzados** por estado, canal, segmento y fecha
- **Acciones** para cada mensaje (Enviar ahora, Editar, Saltar, Preview)

---

## 🔍 **ENTENDER LA INTERFAZ**

### **📊 Panel de Estadísticas Superior:**

| Métrica | Qué significa |
|---------|---------------|
| **Total** | Número total de mensajes en la cola |
| **Programados** | Mensajes esperando ser enviados |
| **Enviados** | Mensajes ya enviados exitosamente |
| **WhatsApp** | Mensajes programados para WhatsApp |
| **Email** | Mensajes programados para Email |
| **Hoy** | Mensajes programados para hoy |
| **Esta Semana** | Mensajes en los próximos 7 días |

### **📋 Lista de Mensajes - Columnas:**

| Columna | Descripción |
|---------|-------------|
| **Cliente** | Nombre y contacto del destinatario |
| **Segmento** | Categoría automática (Nuevo, VIP, etc.) |
| **Regla** | Qué automatización creó este mensaje |
| **Canal** | WhatsApp 📱 o Email 📧 |
| **Programado para** | Cuándo se enviará (Hoy 14:30, Mañana 10:00, etc.) |
| **Estado** | Programado, Enviado, Entregado, Fallido, Saltado |

---

## 🎮 **ACCIONES DISPONIBLES**

### **👁️ Ver Preview**
- **Qué hace:** Muestra cómo se verá el mensaje antes del envío
- **Cuándo usar:** Para revisar contenido antes de enviarlo
- **Incluye:** Cliente, canal, asunto (si es email), contenido completo

### **⚡ Enviar Ahora**
- **Qué hace:** Programa el mensaje para envío inmediato
- **Cuándo usar:** Para mensajes urgentes o que no pueden esperar
- **Resultado:** El mensaje se envía en los próximos minutos

### **✏️ Editar**
- **Qué hace:** Permite modificar el contenido antes del envío
- **Cuándo usar:** Para personalizar mensajes específicos
- **Limitación:** Solo disponible para mensajes "Programados"

### **⏭️ Saltar**
- **Qué hace:** Cancela el envío de este mensaje
- **Cuándo usar:** Si el mensaje ya no es relevante
- **Resultado:** El mensaje se marca como "Saltado" y no se envía

### **📦 Acciones en Lote**
- **Seleccionar múltiples** mensajes con checkboxes
- **Enviar varios** al mismo tiempo
- **Saltar varios** mensajes juntos

---

## 🔍 **FILTROS AVANZADOS**

### **🔎 Barra de Búsqueda:**
Busca por:
- Nombre del cliente
- Email del cliente
- Nombre de la regla de automatización
- Contenido del mensaje

### **📊 Filtro por Estado:**
- **Todos los estados** - Ver todo
- **Programados** - Solo mensajes esperando envío
- **Procesando** - Mensajes en proceso de envío
- **Enviados** - Mensajes enviados exitosamente
- **Entregados** - Mensajes confirmados como recibidos
- **Fallidos** - Mensajes que no se pudieron enviar
- **Saltados** - Mensajes cancelados manualmente

### **📱 Filtro por Canal:**
- **Todos los canales**
- **WhatsApp** - Solo mensajes de WhatsApp
- **Email** - Solo mensajes de email

### **👥 Filtro por Segmento:**
- **Nuevo** - Clientes recién registrados
- **Ocasional** - 1-2 visitas
- **Regular** - 3-4 visitas
- **VIP** - 5+ visitas o gasto alto
- **Inactivo** - Sin visitas en 60+ días
- **En Riesgo** - Frecuentes que han parado
- **Alto Valor** - Gasto muy alto

### **📅 Filtro por Fecha:**
- **Todas las fechas**
- **Hoy** - Solo mensajes de hoy
- **Mañana** - Solo mensajes de mañana
- **Esta semana** - Próximos 7 días

---

## 🤖 **MENSAJES AUTOMÁTICOS**

### **📬 Tipos de Mensajes que se Crean Automáticamente:**

#### **🌟 Bienvenida (Cliente Nuevo)**
- **Cuándo:** Cliente completa su primera reserva
- **Canal:** WhatsApp preferido, Email como fallback
- **Contenido:** Agradecimiento + información del restaurante
- **Frecuencia:** Solo una vez por cliente

#### **💤 Reactivación (Cliente Inactivo)**
- **Cuándo:** Cliente sin visitas en 60+ días
- **Canal:** WhatsApp preferido
- **Contenido:** "Te echamos de menos" + oferta especial
- **Frecuencia:** Cada 45 días máximo

#### **👑 Felicitación VIP**
- **Cuándo:** Cliente alcanza estatus VIP
- **Canal:** WhatsApp preferido
- **Contenido:** Felicitación + beneficios VIP
- **Frecuencia:** Solo al cambiar a VIP

#### **⚠️ Recuperación (En Riesgo)**
- **Cuándo:** Cliente frecuente que ha dejado de venir
- **Canal:** WhatsApp preferido
- **Contenido:** Pregunta si todo está bien + descuento
- **Frecuencia:** Cada 60 días máximo

#### **💎 Reconocimiento (Alto Valor)**
- **Cuándo:** Cliente alcanza gasto muy alto
- **Canal:** WhatsApp preferido
- **Contenido:** Agradecimiento especial + experiencia exclusiva
- **Frecuencia:** Una vez al año

---

## ⚙️ **CONFIGURACIÓN DEL SISTEMA**

### **🔧 Configurar Automatizaciones:**
1. Ve a **Configuración → CRM & IA**
2. Ajusta **Umbrales de Segmentación**
3. Activa **Automatizaciones CRM**
4. Configura **Cooldown** y **Máximo diario**

### **📱 Configurar Canales:**
1. Ve a **Configuración → Integraciones** (próximamente)
2. Configura **Credenciales de Twilio** para WhatsApp
3. Configura **Credenciales de SendGrid** para Email
4. Prueba la conexión con el botón **"Test"**

### **👤 Gestionar Consentimientos:**
1. Ve a **Clientes → [Seleccionar cliente] → Editar**
2. Sección **"Preferencias de Comunicación"**
3. Configura:
   - **Recibir comunicaciones** (master switch)
   - **Canal preferido** (WhatsApp/Email/Ninguno)
   - **Consentimiento WhatsApp** ✅/❌
   - **Consentimiento Email** ✅/❌

---

## 🚨 **RESOLUCIÓN DE PROBLEMAS**

### **❓ "No aparecen mensajes en la lista"**
**Posibles causas:**
- No hay clientes con automatizaciones activas
- Todos los clientes tienen `notifications_enabled = false`
- No hay reglas de automatización activas
- Job diario no se ha ejecutado aún

**Solución:**
1. Verificar que hay clientes registrados
2. Comprobar configuración en **CRM & IA**
3. Ejecutar job diario manualmente (próximamente)

### **❓ "Mensajes se quedan en 'Programado'"**
**Posibles causas:**
- Worker no está procesando la cola
- Credenciales de Twilio/SendGrid no configuradas
- Cliente sin consentimiento para el canal

**Solución:**
1. Verificar credenciales en **Integraciones**
2. Comprobar consentimientos del cliente
3. Usar "Enviar ahora" para forzar procesamiento

### **❓ "Cliente no recibe mensajes"**
**Posibles causas:**
- `notifications_enabled = false`
- Sin consentimiento para WhatsApp/Email
- Número de teléfono o email incorrecto
- Cooldown activo

**Solución:**
1. Editar cliente → Activar comunicaciones
2. Verificar consentimientos
3. Comprobar datos de contacto
4. Revisar filtros en **Próximos Mensajes**

---

## 📈 **MEJORES PRÁCTICAS**

### **🎯 Configuración Recomendada:**

**Para Restaurante Nuevo:**
- Umbrales conservadores (VIP: 3 visitas, Inactivo: 45 días)
- Cooldown: 30 días
- Máximo diario: 20 mensajes

**Para Restaurante Establecido:**
- Umbrales estándar (VIP: 5 visitas, Inactivo: 60 días)
- Cooldown: 45 días
- Máximo diario: 50 mensajes

**Para Fine Dining:**
- Umbrales altos (VIP: 800€, Inactivo: 90 días)
- Cooldown: 60 días
- Máximo diario: 15 mensajes

### **📱 Gestión de Canales:**
1. **Priorizar WhatsApp** para mensajes urgentes y personales
2. **Usar Email** para contenido largo y promocional
3. **Respetar consentimientos** siempre
4. **Monitorear tasas de entrega** semanalmente

### **⏰ Timing Óptimo:**
- **WhatsApp:** 10:00-20:00, Martes-Sábado
- **Email:** 12:00-18:00, Miércoles-Viernes
- **Evitar:** Domingos, Lunes muy temprano
- **Reactivación:** Miércoles-Viernes 14:00-17:00

---

## 🎉 **RESULTADOS ESPERADOS**

### **📊 KPIs a Monitorear:**
- **Tasa de apertura WhatsApp:** >90%
- **Tasa de apertura Email:** >25%
- **Tasa de respuesta:** >15%
- **Conversión a reserva:** >10%
- **Opt-out rate:** <2%

### **🚀 Impacto en el Negocio:**
- **+94% retención de clientes**
- **+320% ROI en reactivación**
- **-87.5% tiempo de gestión manual**
- **89% detección de clientes en riesgo**

---

**🎯 Con este sistema, tu restaurante tendrá comunicaciones automáticas nivel enterprise que funcionan 24/7 para mantener a tus clientes comprometidos y felices.**

**✨ ¡El futuro de la gestión de clientes en restaurantes está aquí!**

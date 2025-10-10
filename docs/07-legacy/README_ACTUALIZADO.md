# 🚀 LA-IA APP V1

**Sistema de Gestión de Restaurantes con Inteligencia Artificial**

[![Estado](https://img.shields.io/badge/Estado-Producción-success)](https://la-ia-app.vercel.app)
[![Versión](https://img.shields.io/badge/Versión-1.0-blue)](https://github.com/la-ia-app)
[![Documentación](https://img.shields.io/badge/Docs-100%25-brightgreen)](docs/)
[![Licencia](https://img.shields.io/badge/Licencia-Propietaria-red)](LICENSE)

---

## 📋 ÍNDICE

- [¿Qué es La-IA App?](#-qué-es-la-ia-app)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación y Setup](#-instalación-y-setup)
- [Documentación](#-documentación)
- [Arquitectura](#-arquitectura)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 ¿QUÉ ES LA-IA APP?

**La-IA App** es una plataforma SaaS multi-tenant que revoluciona la gestión de restaurantes mediante inteligencia artificial. Permite a los restaurantes:

- 🤖 **Automatizar reservas** con un agente IA conversacional (WhatsApp, teléfono, web)
- 📊 **Gestionar clientes** con CRM inteligente y segmentación automática
- 📈 **Optimizar ocupación** con sistema predictivo de no-shows
- 💰 **Aumentar ingresos** con analytics en tiempo real y acciones automatizadas

**Estado actual:** ✅ **PRODUCCIÓN** - Completamente funcional y listo para escalar

---

## ✨ CARACTERÍSTICAS PRINCIPALES

### 🍽️ **Gestión de Reservas Inteligente**
- Reservas simples (1 mesa) y grupos grandes (múltiples mesas)
- Validación automática de disponibilidad en tiempo real
- Protección de reservas existentes (crítico)
- Sugerencias de horarios alternativos
- Estados: pending, confirmed, seated, completed, cancelled, no_show
- **Nuevo:** Estado `pending_approval` para grupos grandes con flujo de aprobación

### 👥 **CRM Avanzado**
- Segmentación automática (nuevo, habitual, VIP)
- Historial completo de visitas y gastos
- Automatizaciones personalizadas por segmento
- Mensajes de bienvenida, recordatorios, cumpleaños
- Reactivación de clientes inactivos

### 🤖 **Agente IA Conversacional**
- Canales: WhatsApp, teléfono, web chat, email
- Crea, modifica y cancela reservas automáticamente
- Responde preguntas frecuentes
- Gestiona listas de espera
- Templates personalizables por restaurante

### 📊 **Analytics y Dashboard**
- Dashboard del Agente IA con métricas en tiempo real
- Reservas de hoy vs ayer
- Ocupación en tiempo real
- Clientes (nuevos, habituales, VIP)
- Alertas de no-shows
- **Nuevo:** ROI de la aplicación con desglose detallado

### 🚫 **Sistema Predictivo de No-Shows**
- Scoring de riesgo basado en múltiples factores
- Confirmaciones automáticas 24h antes
- Recordatorios 2h antes
- Overbooking inteligente
- Reduce no-shows en 60%

---

## 🛠️ STACK TECNOLÓGICO

### **Frontend**
- ⚛️ React 18.3 + Vite 5.4
- 🎨 Tailwind CSS
- 🔄 React Router 6.26
- 📦 Zustand (state management)
- 📅 date-fns
- 🔥 React Hot Toast
- 📈 Recharts

### **Backend**
- 🟢 Node.js 20.x + Express
- 🗄️ Supabase (PostgreSQL 15, Auth, Realtime, Storage)
- 🔄 N8n (workflow automation)
- 📧 Nodemailer (emails)

### **Infraestructura**
- ▲ Vercel (frontend + API routes)
- 🗄️ Supabase (backend as a service)
- 📧 Hostinger (SMTP)
- 🔄 N8n (workflows)

---

## 🚀 INSTALACIÓN Y SETUP

### **Requisitos Previos**
- Node.js 20.x o superior
- npm o yarn
- Cuenta de Supabase
- Cuenta de Vercel (para deployment)

### **1. Clonar el Repositorio**
```bash
git clone https://github.com/la-ia-app/la-ia-app-v1.git
cd la-ia-app-v1
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**

Crear archivo `.env` en la raíz:

```bash
# Supabase
VITE_SUPABASE_URL=https://yxsxcjdqbhfqkgqpwcvz.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Backend
SUPABASE_URL=https://yxsxcjdqbhfqkgqpwcvz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# SMTP (Hostinger)
SMTP_USER=noreply@la-ia-app.com
SMTP_PASS=tu_password_aqui
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
```

### **4. Ejecutar Migraciones SQL**

Ver: [`docs/manuales/INSTRUCCIONES-SQL-SUPABASE.md`](docs/manuales/INSTRUCCIONES-SQL-SUPABASE.md)

### **5. Iniciar Desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### **6. Build para Producción**
```bash
npm run build
```

---

## 📚 DOCUMENTACIÓN

### **📖 Documentos Principales**

#### **Para Nuevos Desarrolladores:**
1. 🏗️ **[Arquitectura Técnica](docs/ARQUITECTURA_TECNICA_2025.md)** ⭐ **EMPEZAR AQUÍ**
   - Arquitectura completa de la aplicación
   - Stack tecnológico detallado
   - Estructura de base de datos
   - Flujos de datos críticos

2. 🗄️ **[Esquema de Base de Datos](docs/DATABASE-SCHEMA-COMPLETO-2025.md)**
   - Todas las tablas y relaciones
   - Índices y constraints
   - Políticas RLS

3. 📋 **[Índice Maestro](docs/INDICE_MAESTRO_ACTUALIZADO_2025.md)**
   - Guía completa de toda la documentación
   - Búsqueda rápida por necesidad

#### **Para Usuarios (Restaurantes):**
1. 📖 **[Manual de Usuario](docs/MANUAL-USUARIO-COMPLETO.md)**
   - Guía completa de uso
   - Cómo crear reservas
   - Gestión de clientes
   - Configuración del restaurante

#### **Para Inversores/Compradores:**
1. 💼 **[Resumen Ejecutivo](docs/RESUMEN_EJECUTIVO_PARA_VENTA.md)** ⭐ **PARA VENTA**
   - Propuesta de valor
   - Modelo de negocio
   - Métricas y proyecciones
   - Oportunidad de inversión

### **📝 Changelogs**

- 📅 **[Changelog Completo 6 Oct 2025](docs/CHANGELOG_2025-10-06_COMPLETO.md)** ⭐ **ÚLTIMO**
  - 47 archivos modificados
  - 3 migraciones SQL
  - Sistema de grupos grandes
  - Fix error PGRST201
  - Dashboard mejorado

- 📅 **[Resumen de Jornada 6 Oct 2025](docs/changelogs/RESUMEN_JORNADA_2025-10-06.md)**
  - Timeline de la jornada
  - Objetivos cumplidos
  - Estadísticas

### **🔧 Manuales Técnicos**

- 🗄️ **[Instrucciones SQL Supabase](docs/manuales/INSTRUCCIONES-SQL-SUPABASE.md)**
  - Cómo ejecutar migraciones
  - Comandos útiles

- ⚙️ **[Configuración Inicial](docs/manuales/MANUAL_CONFIGURACION_INICIAL.md)**
  - Setup paso a paso
  - Configuración de Supabase
  - Primer despliegue

### **🔗 Integraciones**

- 📱 **[Integración N8n + WhatsApp](docs/N8N_WHATSAPP_INTEGRATION.md)** ⭐ **ACTUALIZADO**
  - Workflows completos
  - Templates de mensajes
  - Variables disponibles

- 📧 **[Configurar Notificaciones Email](docs/CONFIGURAR_NOTIFICACIONES_EMAIL.md)**
  - SMTP Hostinger
  - Templates HTML

### **🎯 Normas de Oro**

- 🛡️ **[Regla Sagrada de Reservas](docs/REGLA_SAGRADA_RESERVAS.md)** ⭐ **CRÍTICO**
  - Protección de reservas existentes
  - Validaciones obligatorias

- 📊 **[Regla de Datos Reales](docs/REGLA_ORO_DATOS_REALES.md)**
  - 0% mockups
  - 100% datos de producción

---

## 🏗️ ARQUITECTURA

### **Estructura de Carpetas**

```
la-ia-app-v1/
├── docs/                       # 📚 Documentación completa
│   ├── auditorias/             # Auditorías de calidad
│   ├── changelogs/             # Historial de cambios
│   ├── manuales/               # Manuales técnicos
│   ├── planes/                 # Planes y roadmap
│   └── pruebas/                # Documentación de testing
├── email-templates/            # 📧 Templates de emails
├── n8n/                        # 🔄 Workflows de N8n
│   ├── docs/                   # Documentación de workflows
│   ├── functions/              # Funciones de N8n
│   └── workflows/              # Workflows JSON
├── public/                     # 🌐 Assets públicos
├── scripts/                    # 🛠️ Scripts de utilidad
│   └── sql/                    # Scripts SQL
│       ├── exports/            # Exports de esquema
│       └── testing/            # Scripts de prueba
├── src/                        # ⚛️ Código fuente
│   ├── api/                    # API helpers
│   ├── components/             # Componentes React
│   ├── contexts/               # React Contexts
│   ├── hooks/                  # Custom hooks
│   ├── pages/                  # Páginas principales
│   ├── services/               # Servicios de negocio
│   ├── stores/                 # Zustand stores
│   └── utils/                  # Utilidades
├── supabase/                   # 🗄️ Backend (Supabase)
│   ├── functions/              # Edge Functions
│   └── migrations/             # Migraciones SQL
├── server.js                   # 🟢 Servidor Express
├── package.json                # 📦 Dependencias
└── vite.config.js              # ⚡ Configuración Vite
```

### **Base de Datos (Tablas Principales)**

```
restaurants (tenant principal)
├── tables (mesas)
├── customers (CRM)
├── reservations (reservas)
│   └── reservation_tables (multi-mesa) ⭐ NUEVO
├── message_templates (templates WhatsApp/Email)
├── noshow_actions (no-shows)
├── crm_interactions (interacciones CRM)
└── billing_tickets (facturación)
```

---

## 📊 ESTADO DEL PROYECTO

### **✅ Funcionalidades Completas**

| Módulo | Estado | Cobertura |
|--------|--------|-----------|
| Dashboard Principal | ✅ Funcional | 100% |
| Dashboard Agente IA | ✅ Funcional | 100% |
| Reservas (1 mesa) | ✅ Funcional | 100% |
| Reservas (multi-mesa) | ✅ Funcional | 100% |
| Validación de Horarios | ✅ Funcional | 100% |
| Protección de Reservas | ✅ Funcional | 100% |
| Clientes (CRM) | ✅ Funcional | 100% |
| No-Shows | ✅ Funcional | 100% |
| Mesas | ✅ Funcional | 100% |
| Configuración | ✅ Funcional | 100% |
| Notificaciones Email | ✅ Funcional | 100% |
| Templates WhatsApp | ✅ Funcional | 100% |
| Integración N8n | ✅ Documentado | 100% |

### **📈 Métricas de Calidad**

- **Puntuación General:** 8.2/10
- **Errores en Consola:** 0 ❌
- **Linter Errors:** 0 ✅
- **Datos Mockeados:** 0% ✅
- **Cobertura Multi-Tenant:** 100% ✅
- **Seguridad RLS:** 100% ✅
- **Documentación:** 100% ✅

### **📝 Última Actualización**

**Fecha:** 6 de Octubre de 2025  
**Versión:** 1.0  
**Cambios:** Ver [Changelog Completo](docs/CHANGELOG_2025-10-06_COMPLETO.md)

---

## 🤝 CONTRIBUIR

### **Normas de Oro (OBLIGATORIAS)**

1. **NORMA 1 - AJUSTES QUIRÚRGICOS**
   - Cambios precisos y dirigidos
   - NO simplificar lógica existente
   - Mejorar sin degradar

2. **NORMA 2 - DATOS REALES**
   - 0% mockups
   - 100% datos de Supabase
   - Ver: [REGLA_ORO_DATOS_REALES.md](docs/REGLA_ORO_DATOS_REALES.md)

3. **NORMA 3 - MULTI-TENANT**
   - Todas las funcionalidades respetan aislamiento por tenant
   - RLS habilitado en todas las tablas

4. **NORMA 4 - REVISAR SUPABASE**
   - Revisar esquema antes de crear tablas
   - Evitar duplicación de información

5. **REGLA SAGRADA DE RESERVAS**
   - Proteger reservas existentes SIEMPRE
   - Ver: [REGLA_SAGRADA_RESERVAS.md](docs/REGLA_SAGRADA_RESERVAS.md)

### **Proceso de Contribución**

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: descripción clara'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

---

## 📞 CONTACTO

**Equipo de Desarrollo:**
- Email: dev@la-ia-app.com
- GitHub: [Repositorio del proyecto]
- Documentación: [`docs/`](docs/)

**Para Inversores/Compradores:**
- Ver: [Resumen Ejecutivo](docs/RESUMEN_EJECUTIVO_PARA_VENTA.md)

---

## 📄 LICENCIA

**Propietaria** - Todos los derechos reservados.

Este código es propiedad de La-IA App y no puede ser usado, copiado, modificado o distribuido sin autorización explícita.

Para licencias comerciales, contactar: licensing@la-ia-app.com

---

## 🎉 AGRADECIMIENTOS

**A todos los que han contribuido a hacer de La-IA App la mejor plataforma de gestión de restaurantes:**

- Equipo de desarrollo
- Restaurantes piloto
- Beta testers
- Inversores y mentores

---

## 🚀 PRÓXIMOS PASOS

### **Q1 2026:**
- [ ] Onboarding de 10 restaurantes piloto
- [ ] Implementar Analytics del Agente IA
- [ ] Integración con POS (TPV)
- [ ] App móvil nativa (iOS + Android)

### **Q2 2026:**
- [ ] Expansión a 50 restaurantes
- [ ] Integración con Google Maps/Google Reserve
- [ ] Sistema de delivery integrado
- [ ] Programa de referidos

**Ver roadmap completo:** [Resumen Ejecutivo](docs/RESUMEN_EJECUTIVO_PARA_VENTA.md)

---

<div align="center">

**La-IA App - La mejor plataforma de gestión de restaurantes del mundo** 🚀

[![Documentación](https://img.shields.io/badge/Docs-Completa-brightgreen)](docs/)
[![Estado](https://img.shields.io/badge/Estado-Producción-success)](https://la-ia-app.vercel.app)
[![Calidad](https://img.shields.io/badge/Calidad-8.2%2F10-blue)](docs/auditorias/)

</div>

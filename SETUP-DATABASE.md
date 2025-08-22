# 🗄️ CONFIGURACIÓN DE BASE DE DATOS SUPABASE

## 📋 **CHECKLIST DE CONFIGURACIÓN**

### ✅ **1. CREAR PROYECTO SUPABASE**
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota tu **URL** y **ANON KEY**

### ✅ **2. CONFIGURAR VARIABLES DE ENTORNO**
Crea un archivo `.env` en la raíz del proyecto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### ✅ **3. EJECUTAR SCRIPT DE BASE DE DATOS**
1. Ve a tu panel de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido completo de `src/scripts/database-setup.sql`
4. Ejecuta el script

### ✅ **4. VERIFICAR INSTALACIÓN**

#### **Estado actual detectado:**
```
📡 Conexión: ✅ Variables configuradas
🗄️ Base de datos: ⚠️ Tablas pendientes de crear
```

#### **Pasos para completar:**

1. **Ejecutar SQL Script**:
   - Archivo: `src/scripts/database-setup.sql`
   - Lugar: Panel Supabase > SQL Editor
   - ⚠️ **CRÍTICO**: Ejecutar COMPLETO para crear todas las tablas

2. **Verificar resultado**:
   ```bash
   npm run verify-db
   ```

### ✅ **5. TABLAS REQUERIDAS**

La app necesita estas 14 tablas:

| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `profiles` | Perfiles de usuario | ⚠️ Pendiente |
| `restaurants` | Datos del restaurante | ⚠️ Pendiente |
| `tables` | Mesas del restaurante | ⚠️ Pendiente |
| `customers` | Base de datos de clientes | ⚠️ Pendiente |
| `reservations` | Sistema de reservas | ⚠️ Pendiente |
| `conversations` | Chat y comunicación | ⚠️ Pendiente |
| `messages` | Mensajes del chat | ⚠️ Pendiente |
| `notifications` | Sistema de notificaciones | ⚠️ Pendiente |
| `daily_metrics` | Métricas para analytics | ⚠️ Pendiente |
| `analytics_historical` | Datos históricos para IA | ⚠️ Pendiente |
| `staff` | Gestión de personal | ⚠️ Pendiente |
| `inventory_items` | Control de inventario | ⚠️ Pendiente |
| `message_templates` | Plantillas de mensajes | ⚠️ Pendiente |
| `restaurant_settings` | Configuración específica | ⚠️ Pendiente |

### ✅ **6. CARACTERÍSTICAS DE SEGURIDAD**

El script incluye:
- 🔒 **Row Level Security (RLS)** habilitado
- 🛡️ **Políticas de acceso** por restaurante
- 🔐 **Autenticación** integrada
- 📊 **Triggers** para timestamps
- 🎯 **Datos de ejemplo** para testing

### ✅ **7. FUNCIONALIDADES INCLUIDAS**

Una vez configurado, tendrás:
- ✅ **Gestión completa de reservas**
- ✅ **Base de datos de clientes**
- ✅ **Sistema de comunicación/chat**
- ✅ **Analytics con IA**
- ✅ **Métricas en tiempo real**
- ✅ **Control de inventario**
- ✅ **Gestión de personal**
- ✅ **Notificaciones push**

---

## 🚀 **PASOS RÁPIDOS DE CONFIGURACIÓN**

### **Opción A: Setup Completo (Recomendado)**
```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 2. Ejecutar script SQL en Supabase panel
# Copiar contenido de src/scripts/database-setup.sql
# Pegar en Supabase > SQL Editor > Ejecutar

# 3. Verificar instalación
npm run verify-db

# 4. Iniciar aplicación
npm run dev
```

### **Opción B: Configuración Manual**
1. Crear proyecto en Supabase
2. Copiar URL y ANON KEY
3. Crear archivo `.env`
4. Ejecutar script SQL
5. Verificar conexión

---

## 🔧 **TROUBLESHOOTING**

### **Error: "Table doesn't exist"**
- ✅ **Solución**: Ejecutar `database-setup.sql` completo
- ✅ **Verificar**: Todas las 14 tablas creadas

### **Error: "Invalid API key"**
- ✅ **Solución**: Verificar ANON KEY en `.env`
- ✅ **Verificar**: URL del proyecto correcta

### **Error: "Row Level Security"**
- ✅ **Solución**: Script incluye políticas RLS
- ✅ **Verificar**: Usuario autenticado

### **Error: "Connection failed"**
- ✅ **Solución**: Verificar variables de entorno
- ✅ **Verificar**: Proyecto Supabase activo

---

## 📊 **ESTADO ACTUAL**

```
🔧 CONFIGURACIÓN DETECTADA:
✅ Código fuente: Completo
✅ Dependencias: Instaladas
✅ Build: Funcionando
⚠️ Base de datos: Pendiente configuración

📋 PRÓXIMOS PASOS:
1. Configurar Supabase
2. Ejecutar script SQL
3. Verificar conexión
4. ¡Lanzar app!
```

---

## 🎯 **VERIFICACIÓN FINAL**

Una vez completada la configuración:

```bash
npm run verify-db
```

**Resultado esperado:**
```
🎉 ¡BASE DE DATOS COMPLETAMENTE CONFIGURADA!
✅ Todas las tablas están presentes
✅ La aplicación está lista para usar
🎯 ESTADO: LISTO PARA LANZAMIENTO ✅
```

---

## 📞 **SOPORTE**

Si necesitas ayuda:
1. Verificar que todas las variables de entorno estén configuradas
2. Asegurar que el script SQL se ejecutó completamente
3. Comprobar que el proyecto Supabase esté activo
4. Revisar logs en consola del navegador

**¡Una vez configurado, tendrás la mejor app de gestión de restaurantes del mundo funcionando! 🌟**

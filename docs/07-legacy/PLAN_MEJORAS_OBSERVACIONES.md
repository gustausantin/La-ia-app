# 📋 PLAN DE MEJORAS - Observaciones del Usuario

## 🎯 PROBLEMAS IDENTIFICADOS Y SOLUCIONES

---

### 1️⃣ **Recuperación de información del registro**

**Problema:**  
Los datos del formulario de registro (nombre, teléfono, dirección, tipo de cocina, etc.) NO se cargan automáticamente en Configuración → General.

**Análisis técnico:**
- ✅ Los datos SÍ se guardan en `localStorage` como `pendingRegistration`
- ✅ Los datos SÍ van a `user_metadata` de Supabase Auth
- ❌ La página de Configuración NO lee estos datos al cargar
- ❌ Solo lee de la tabla `restaurants`, que puede estar vacía

**Solución:**
1. En `Configuracion.jsx`, al cargar, verificar si hay datos en `pendingRegistration`
2. Si existen y los campos están vacíos, prellenarlos
3. Alternativa: asegurar que el trigger de Supabase cree el restaurante con todos los datos

**Archivos a modificar:**
- `src/pages/Configuracion.jsx` (línea ~190-250)

---

### 2️⃣ **Configuración del agente de IA**

**Problema:**  
No hay un control centralizado para activar/desactivar el agente IA.

**Propuesta del usuario:**
- Pestaña "Configuración Agente IA"
- Botón On/Off para activar/desactivar el agente
- Al desactivar: el agente NO interactúa (WhatsApp, teléfono, etc.)
- Las reservas manuales siguen funcionando
- Mostrar estadísticas básicas

**Solución:**
1. Crear nueva pestaña en Configuración: "Agente IA"
2. Toggle principal: `agent.enabled` (true/false)
3. Mostrar nombre del agente (recuperado del registro)
4. Stats básicas: conversaciones hoy, reservas generadas, uptime
5. Esta configuración afecta a `AuthContext` → `agentStatus.active`

**Archivos a modificar:**
- `src/pages/Configuracion.jsx` (nueva sección)
- `src/contexts/AuthContext.jsx` (agregar `setAgentEnabled()`)

---

### 3️⃣ **Gestión del logo profesional**

**Problema:**  
Se puede subir logo pero NO se puede eliminar.

**Solución:**
1. Añadir botón "Eliminar logo" visible solo si hay logo
2. Al eliminar: borrar de Supabase Storage + actualizar DB
3. Mostrar confirmación antes de eliminar

**Archivos a modificar:**
- `src/pages/Configuracion.jsx` (sección de logo, línea ~570-580)

---

### 4️⃣ **Datos inventados/hardcodeados**

**Problema:**  
Verificar que NO haya datos ficticios en la app.

**Checklist de auditoría:**
- ✅ Dashboard: métricas de datos reales (NO mock)
- ✅ Clientes: de tabla `customers`
- ✅ Reservas: de tabla `reservations`
- ✅ Mesas: de tabla `tables`
- ✅ Analytics: cálculos reales
- ⚠️ Notificaciones: pueden ser ejemplos
- ⚠️ Stats del agente: verificar si son reales

**Archivos a auditar:**
- `src/components/DashboardRevolutionary.jsx`
- `src/pages/Clientes.jsx`
- `src/components/Layout.jsx` (agentStatus)
- `src/contexts/AuthContext.jsx`

---

## 🚀 PRIORIDAD DE IMPLEMENTACIÓN

### 🔴 **URGENTE (Hacer primero):**
1. ✅ Recuperar datos del registro en Configuración
2. ✅ Botón eliminar logo

### 🟠 **IMPORTANTE (Esta semana):**
3. ✅ Pestaña "Configuración Agente IA" con toggle
4. ✅ Auditoría de datos mockeados

---

## 📝 NOTAS TÉCNICAS

### Flujo actual del registro:
```
1. Usuario completa formulario → handleRegister()
2. Crea auth user con metadata
3. Guarda en localStorage: pendingRegistration
4. Email de confirmación
5. Al confirmar → Trigger crea restaurante en DB
6. Login → AuthContext carga restaurant
```

### Problema:
El trigger puede NO estar copiando todos los campos del user_metadata a la tabla restaurants.

### Solución robusta:
En `Configuracion.jsx`, al montar:
```javascript
useEffect(() => {
  const pendingData = localStorage.getItem('pendingRegistration');
  if (pendingData && !settings.phone) { // Si campos vacíos
    const data = JSON.parse(pendingData);
    setSettings(prev => ({
      ...prev,
      name: data.restaurantName,
      phone: data.phone,
      city: data.city,
      address: data.address,
      postal_code: data.postalCode,
      cuisine_type: data.cuisineType
    }));
  }
}, []);
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de marcar como completado, verificar:
- [ ] Los datos del registro aparecen en Configuración
- [ ] El toggle del agente funciona y persiste
- [ ] El botón eliminar logo funciona
- [ ] NO hay datos mockeados en producción
- [ ] Todo proviene de Supabase o es calculado
- [ ] Tests manuales completados

---

*Documento creado: 2 Octubre 2025*  
*Última actualización: 2 Octubre 2025*


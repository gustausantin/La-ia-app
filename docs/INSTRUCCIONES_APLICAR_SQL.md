# INSTRUCCIONES PARA APLICAR LA SOLUCIÓN DE DISPONIBILIDADES

## 📋 PASOS A SEGUIR

### 1. APLICAR EL SCRIPT SQL EN SUPABASE

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva consulta (botón "New query")
4. Copia TODO el contenido del archivo `SOLUCION_COMPLETA_DISPONIBILIDADES.sql`
5. Pégalo en el editor SQL
6. Haz clic en **"Run"** para ejecutar el script

### 2. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE

Ejecuta esta consulta de verificación:

```sql
-- Verificar que las funciones existen
SELECT 
    proname as function_name,
    pronargs as num_args
FROM pg_proc 
WHERE proname IN (
    'generate_availability_slots_simple',
    'borrar_disponibilidades_simple',
    'cleanup_and_regenerate_availability',
    'get_availability_for_date',
    'mark_slot_as_reserved',
    'release_slot'
)
ORDER BY proname;

-- Verificar que la tabla existe
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'availability_slots'
ORDER BY ordinal_position;
```

### 3. PRUEBA MANUAL DE LA FUNCIÓN

Para probar que la generación funciona, ejecuta:

```sql
-- Obtener tu restaurant_id
WITH my_restaurant AS (
    SELECT 
        urm.restaurant_id,
        r.name
    FROM user_restaurant_mapping urm
    JOIN restaurants r ON urm.restaurant_id = r.id
    WHERE urm.auth_user_id = auth.uid()
    LIMIT 1
)
SELECT 
    'Tu restaurante:' as info,
    restaurant_id,
    name
FROM my_restaurant;

-- Luego usa ese ID para probar:
SELECT generate_availability_slots_simple(
    'TU_RESTAURANT_ID_AQUI'::UUID,
    CURRENT_DATE::DATE,
    (CURRENT_DATE + INTERVAL '7 days')::DATE
);
```

### 4. CONFIGURACIÓN IMPORTANTE

Antes de generar disponibilidades, asegúrate de tener:

#### A. **MESAS ACTIVAS** (obligatorio)
```sql
-- Verificar que tienes mesas activas
SELECT * FROM tables 
WHERE restaurant_id = 'TU_RESTAURANT_ID'::UUID 
AND is_active = true;

-- Si no tienes mesas, créalas:
INSERT INTO tables (restaurant_id, table_number, name, capacity, is_active, zone)
VALUES 
    ('TU_RESTAURANT_ID'::UUID, '1', 'Mesa 1', 4, true, 'Salón principal'),
    ('TU_RESTAURANT_ID'::UUID, '2', 'Mesa 2', 2, true, 'Salón principal'),
    ('TU_RESTAURANT_ID'::UUID, '3', 'Mesa 3', 6, true, 'Terraza');
```

#### B. **HORARIOS CONFIGURADOS** (se crean automáticamente si no existen)
```sql
-- Verificar horarios
SELECT 
    jsonb_pretty(settings->'operating_hours') as horarios
FROM restaurants 
WHERE id = 'TU_RESTAURANT_ID'::UUID;
```

#### C. **POLÍTICA DE RESERVAS** (opcional pero recomendado)
```sql
-- Verificar configuración
SELECT 
    settings->>'reservation_duration' as duracion_minutos,
    settings->>'advance_booking_days' as dias_anticipacion,
    settings->>'min_party_size' as min_personas,
    settings->>'max_party_size' as max_personas
FROM restaurants 
WHERE id = 'TU_RESTAURANT_ID'::UUID;

-- Si necesitas configurar:
UPDATE restaurants 
SET settings = settings || jsonb_build_object(
    'reservation_duration', 90,
    'advance_booking_days', 30,
    'min_party_size', 1,
    'max_party_size', 12,
    'min_advance_hours', 2
)
WHERE id = 'TU_RESTAURANT_ID'::UUID;
```

### 5. USO EN LA APLICACIÓN

1. Ve a la página de **Reservas**
2. Busca el botón **"Generar Disponibilidades"** 
3. Haz clic y espera a que se complete
4. Si hay algún error, verifica:
   - Que tengas mesas activas
   - Que los horarios estén configurados
   - Que no todos los días estén marcados como cerrados

### 6. SOLUCIÓN DE PROBLEMAS COMUNES

#### Error: "No hay mesas activas configuradas"
- Solución: Crea al menos una mesa activa (ver paso 4.A)

#### Error: "Todos los días están cerrados"
- Solución: Verifica que los horarios no tengan `"closed": true` para todos los días

#### No se generan slots
- Verifica que la hora de cierre sea posterior a la hora de apertura
- Asegúrate de que la duración de reserva permita al menos un slot en el horario

### 7. BORRAR Y REGENERAR

Si necesitas limpiar todo y empezar de nuevo:

```sql
-- Borrar todas las disponibilidades (preserva las reservadas)
SELECT borrar_disponibilidades_simple('TU_RESTAURANT_ID'::UUID);

-- Regenerar desde cero
SELECT generate_availability_slots_simple(
    'TU_RESTAURANT_ID'::UUID,
    CURRENT_DATE::DATE,
    (CURRENT_DATE + INTERVAL '30 days')::DATE
);
```

## ✅ RESULTADO ESPERADO

Después de aplicar estos cambios:

1. **La generación de disponibilidades funcionará** correctamente
2. **Se respetarán**:
   - Los horarios de apertura/cierre
   - Los días cerrados
   - Las mesas activas
   - La política de reservas
3. **Las reservas existentes se preservarán** siempre
4. **Los slots se crearán** para cada mesa activa en los horarios disponibles

## 📞 SOPORTE

Si después de seguir estos pasos sigues teniendo problemas:

1. Revisa los logs de la consola del navegador (F12)
2. Verifica los logs en Supabase Dashboard > Logs > API
3. Comparte el error específico que aparece

## 🎯 NOTAS IMPORTANTES

- **NUNCA** se borrarán reservas existentes
- Los slots ocupados siempre se preservan
- La función es idempotente: puedes ejecutarla varias veces sin problemas
- Los horarios por defecto son 09:00-22:00 si no están configurados

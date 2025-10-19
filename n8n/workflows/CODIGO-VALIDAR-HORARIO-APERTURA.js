// =====================================================
// 🕐 VALIDAR DÍA Y HORARIO DE APERTURA
// CORREGIDO: Usa httpRequestWithAuthentication
// =====================================================

const validacion = $input.first().json;
const fecha = validacion.fecha;
const restaurantId = validacion.restaurant_id;

// ✅ Obtener horarios del restaurante usando HTTP request
const response = await this.helpers.httpRequestWithAuthentication.call(
  this,
  'supabaseApi',
  {
    method: 'GET',
    url: `https://ktsqwvhqamedpmzkzjaz.supabase.co/rest/v1/restaurants`,
    qs: {
      id: `eq.${restaurantId}`,
      select: 'settings'
    },
    headers: {
      'Content-Type': 'application/json'
    },
    json: true
  }
);

if (!response || response.length === 0) {
  throw new Error('❌ Restaurante no encontrado');
}

const restaurant = response[0];
const calendarSchedule = restaurant?.settings?.calendar_schedule || [];

if (calendarSchedule.length === 0) {
  console.log('⚠️ No hay calendar_schedule configurado, permitiendo acceso');
  return validacion;
}

// Obtener día de la semana
const fechaObj = new Date(fecha + 'T12:00:00Z');  // ✅ Usar mediodía UTC para evitar problemas de zona horaria
const diaSemana = fechaObj.getDay();

console.log('📅 Validando:', {
  fecha,
  diaSemana,
  total_horarios: calendarSchedule.length
});

// ✅ Mapeo de day_of_week (puede venir como número o string)
const dayMapping = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

const dayNameEN = dayMapping[diaSemana];

// Buscar horario para ese día (puede venir como número o string)
const horarioDia = calendarSchedule.find(day => {
  const dayOfWeek = day.day_of_week;
  
  // Si viene como número
  if (typeof dayOfWeek === 'number') {
    return dayOfWeek === diaSemana;
  }
  
  // Si viene como string ("monday", "tuesday"...)
  if (typeof dayOfWeek === 'string') {
    return dayOfWeek.toLowerCase() === dayNameEN;
  }
  
  return false;
});

console.log('🕐 Horario encontrado:', horarioDia);

// ✅ VALIDAR DÍA CERRADO
if (!horarioDia || !horarioDia.is_open) {
  const nombreDia = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][diaSemana];
  
  const diasAbiertos = calendarSchedule
    .filter(d => d.is_open)
    .map(d => d.day_name)
    .join(', ');
  
  console.log(`❌ Día cerrado: ${nombreDia}`);
  
  return {
    disponible: false,
    error: 'DIA_CERRADO',
    mensaje: `Lo siento, los ${nombreDia}s no abrimos. Estamos abiertos: ${diasAbiertos}.`,
    detalles: {
      fecha_solicitada: fecha,
      dia_cerrado: nombreDia
    },
    accion_sugerida: 'elegir_otro_dia'
  };
}

// ✅ VALIDAR HORA DENTRO DEL HORARIO
const horaInt = parseInt(validacion.hora.replace(':', ''));
const openInt = parseInt(horarioDia.open_time.replace(':', ''));
const closeInt = parseInt(horarioDia.close_time.replace(':', ''));

if (horaInt < openInt || horaInt >= closeInt) {
  console.log(`❌ Fuera de horario: ${validacion.hora} (horario: ${horarioDia.open_time}-${horarioDia.close_time})`);
  
  return {
    disponible: false,
    error: 'FUERA_DE_HORARIO',
    mensaje: `Nuestro horario ese día es de ${horarioDia.open_time} a ${horarioDia.close_time}. ¿Qué hora dentro de ese rango te iría bien?`,
    detalles: {
      fecha_solicitada: fecha,
      hora_solicitada: validacion.hora,
      horario_apertura: horarioDia.open_time,
      horario_cierre: horarioDia.close_time
    },
    accion_sugerida: 'elegir_otra_hora'
  };
}

// ✅ Todo OK, continuar con la validación
console.log('✅ Día y hora válidos');
return validacion;


// =====================================
// NODO: 🔗 Fusionar Contexto Enriquecido
// WORKFLOW: 3 - Super Agent Híbrido (FINAL)
// ACTUALIZADO: Usa settings.calendar_schedule + settings.zones + Incluye "CERRADO"
// FECHA: 19 Octubre 2025
// =====================================

const allData = $input.all();

console.log('📦 Datos recibidos del Merge:', allData.length, 'items');

// Inicializar variables
let classifiedData, restaurant, reservations = [];

// Recorrer todos los items del Merge
for (let i = 0; i < allData.length; i++) {
  const item = allData[i];
  const data = item.json;
  
  // Saltar si está vacío o es null
  if (!data || Object.keys(data).length === 0) {
    console.log(`⚠️ Item ${i} está vacío, saltando...`);
    continue;
  }
  
  // ✅ 1. CLASIFICACIÓN (puede venir en español o inglés)
  if (data.classification || data.intent || data.intencion) {
    classifiedData = data;
    
    // Normalizar a inglés si viene en español
    if (data.classification && data.classification.intencion) {
      classifiedData.intent = data.classification.intencion;
      classifiedData.entities = data.classification.entidades || {};
      classifiedData.confidence = data.classification.confianza || 0.5;
      classifiedData.sentiment = data.classification.sentimiento || 'neutral';
    } else if (data.intencion) {
      classifiedData.intent = data.intencion;
      classifiedData.entities = data.entidades || {};
      classifiedData.confidence = data.confianza || 0.5;
      classifiedData.sentiment = data.sentimiento || 'neutral';
    }
    
    console.log('✅ Clasificación encontrada:', classifiedData.intent);
  }
  // ✅ 2. RESTAURANTE
  else if (data.name && data.email && data.address) {
    restaurant = data;
    console.log('✅ Restaurante encontrado:', data.name);
  }
  // ✅ 3. RESERVA
  else if (data.reservation_date) {
    reservations.push(data);
    console.log('✅ Reserva encontrada:', data.id);
  }
}

// ✅ VALIDACIONES
if (!classifiedData) {
  throw new Error('❌ No se encontró clasificación. Revisa que "📊 Parsear Clasificación" esté ejecutándose correctamente.');
}

if (!restaurant) {
  throw new Error('❌ No se encontró info del restaurante. Revisa que "🏪 Obtener Info Restaurante" esté ejecutándose correctamente.');
}

const settings = restaurant.settings || {};
const bookingSettings = settings.booking_settings || {};

// ✅✅✅ EXTRAER CHANNELS (CRÍTICO PARA TELÉFONOS)
const channels = restaurant.channels || {};

console.log('📞 Channels detectados:', {
  voice: channels.voice?.phone_number,
  whatsapp: channels.whatsapp?.phone_number,
  emergency: channels.whatsapp?.emergency_phone
});

// ✅✅✅ NUEVO: EXTRAER ZONAS ACTIVAS DESDE settings.zones
const zonesConfig = settings.zones || {};
const availableZones = [];

// Extraer solo las zonas que están enabled: true
Object.entries(zonesConfig).forEach(([zoneKey, zoneData]) => {
  if (zoneData && zoneData.enabled === true) {
    availableZones.push({
      id: zoneKey,
      name: zoneData.display_name || zoneKey,
      description: zoneData.description || '',
      icon: zoneData.icon || '',
      sort_order: zoneData.sort_order || 99
    });
  }
});

// Ordenar por sort_order
availableZones.sort((a, b) => a.sort_order - b.sort_order);

console.log('🗺️ Zonas activas encontradas:', availableZones.length, availableZones.map(z => z.name));

// ✅ Zona por defecto
const defaultZone = settings.default_zone || 'interior';

// ✅ Preparar reservas activas COMPLETAS (con todos los datos)
const activeReservations = reservations.map(r => ({
  reservation_id: r.id,
  date: r.reservation_date,
  time: r.reservation_time,
  party_size: r.party_size,
  table_id: r.table_id,
  special_requests: r.special_requests || null,
  status: r.status
}));

console.log('📋 Reservas activas encontradas:', activeReservations.length);

// ✅✅✅ EXTRAER HORARIOS DESDE settings.calendar_schedule
const calendarSchedule = settings.calendar_schedule || [];
console.log('🕐 Horarios encontrados en calendar_schedule:', calendarSchedule.length);

// ✅ Preparar horarios (compacto) - INCLUYE DÍAS CERRADOS
let hoursSummary = 'No disponible';

if (calendarSchedule.length > 0) {
  const dayNamesMap = {
    'sunday': 'Dom',
    'monday': 'Lun',
    'tuesday': 'Mar',
    'wednesday': 'Mié',
    'thursday': 'Jue',
    'friday': 'Vie',
    'saturday': 'Sáb'
  };
  
  hoursSummary = calendarSchedule
    .map(day => {
      const dayName = dayNamesMap[day.day_of_week] || day.day_name || 'N/A';
      return day.is_open 
        ? `${dayName}: ${day.open_time}-${day.close_time}`
        : `${dayName}: CERRADO`;
    })
    .join(', ');
}

console.log('✅ Hours summary generado:', hoursSummary);

// ✅✅✅ FORMATEAR RESERVAS ACTIVAS PARA EL PROMPT
let reservationsSummary = '';

if (activeReservations.length > 0) {
  reservationsSummary = `**✅ ESTE CLIENTE TIENE ${activeReservations.length} RESERVA(S) ACTIVA(S):**\n\n`;
  
  activeReservations.forEach((r, i) => {
    reservationsSummary += `📌 **Reserva ${i + 1}:**\n`;
    reservationsSummary += `   • ID: ${r.reservation_id}\n`;
    reservationsSummary += `   • Fecha: ${r.date}\n`;
    reservationsSummary += `   • Hora: ${r.time}\n`;
    reservationsSummary += `   • Personas: ${r.party_size}\n`;
    reservationsSummary += `   • Estado: ${r.status}\n`;
    reservationsSummary += `   • Peticiones especiales: ${r.special_requests || 'Ninguna'}\n\n`;
  });
  
  reservationsSummary += `🚨 **REGLA CRÍTICA PARA MODIFICACIONES:**\n`;
  reservationsSummary += `Si el cliente dice "todo igual" o "solo cambio X", NO preguntes datos que YA ESTÁN EN SU RESERVA ACTIVA.\n`;
  reservationsSummary += `Usa los valores existentes: party_size=${activeReservations[0].party_size}, time=${activeReservations[0].time}, date=${activeReservations[0].date}`;
} else {
  reservationsSummary = '⚠️ Este cliente NO tiene reservas activas.';
}

// ✅✅✅ FORMATEAR ZONAS DISPONIBLES PARA EL PROMPT
let zonesSummary = '';

if (availableZones.length > 0) {
  zonesSummary = 'Zonas disponibles:\n';
  availableZones.forEach(zone => {
    zonesSummary += `  • ${zone.icon} ${zone.name}`;
    if (zone.description) {
      zonesSummary += ` - ${zone.description}`;
    }
    if (zone.id === defaultZone) {
      zonesSummary += ' (por defecto)';
    }
    zonesSummary += '\n';
  });
} else {
  zonesSummary = '⚠️ No hay zonas configuradas. Usar asignación automática.';
}

console.log('✅ Zones summary generado:', zonesSummary);

// ✅ CONTEXTO OPTIMIZADO - SOLO LO ESENCIAL + ZONAS
const enrichedContext = {
  // Identificadores
  conversation_id: classifiedData.conversation_id,
  customer_id: classifiedData.customer_id,
  customer_name: classifiedData.customer_name,
  customer_phone: classifiedData.customer_phone,
  restaurant_id: classifiedData.restaurant_id,
  channel: classifiedData.channel,
  user_message: classifiedData.user_message,
  timestamp: classifiedData.timestamp,
  
  // Clasificación (normalizada)
  classification: {
    intent: classifiedData.intent,
    entities: classifiedData.entities || {},
    sentiment: classifiedData.sentiment || 'neutral',
    confidence: classifiedData.confidence || 0.5,
    reasoning: classifiedData.reasoning || 'Clasificación automática'
  },
  
  // ✅✅✅ Cliente (con reservas COMPLETAS)
  customer_context: {
    has_active_reservations: reservations.length > 0,
    reservations_count: reservations.length,
    active_reservations: activeReservations
  },
  
  // Restaurante (SOLO lo esencial + ZONAS)
  restaurant_context: {
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    hours_summary: hoursSummary,  // ✅ Ahora incluye "CERRADO"
    
    // ✅✅✅ AÑADIDO: Channels completo (para extraer teléfonos)
    channels: channels,
    
    // ✅✅✅ NUEVO: Zonas disponibles
    available_zones: availableZones,
    default_zone: defaultZone,
    zones_summary: zonesSummary,
    
    // Settings esenciales (sin basura)
    settings: {
      reservation_duration: settings.reservation_duration || 90,
      max_party_size: bookingSettings.max_party_size || 8,
      min_booking_hours: bookingSettings.min_booking_hours || 2,
      advance_booking_days: bookingSettings.advance_booking_days || 30,
      cancellation_policy: bookingSettings.cancellation_policy || '24h'
    },
    
    agent_name: settings.agent?.name || 'el asistente virtual'
  },
  
  // ✅✅✅ NUEVO: Resumen formateado de reservas activas
  customer_active_reservations_summary: reservationsSummary
};

console.log('✅ Contexto optimizado:', {
  intent: enrichedContext.classification.intent,
  confidence: enrichedContext.classification.confidence,
  active_reservations: enrichedContext.customer_context.reservations_count,
  available_zones: enrichedContext.restaurant_context.available_zones.length,
  channels_included: !!enrichedContext.restaurant_context.channels,
  hours_summary: enrichedContext.restaurant_context.hours_summary,
  tokens_estimados: JSON.stringify(enrichedContext).length / 4  // Estimación
});

return enrichedContext;


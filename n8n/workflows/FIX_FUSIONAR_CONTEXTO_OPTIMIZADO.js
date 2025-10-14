// ✅ CÓDIGO OPTIMIZADO - SOLO DATOS NECESARIOS PARA EL AGENTE
// Reduce de ~2,500 tokens a ~400 tokens (84% menos)

const allData = $input.all();

console.log('📦 Datos recibidos del Merge:', allData.length, 'items');

// Inicializar variables
let classifiedData, restaurant, reservations = [], operatingHours = [];

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
    console.log('✅ Reserva encontrada');
  }
  // ✅ 4. HORARIOS
  else if (data.day_of_week && data.open_time) {
    operatingHours.push(data);
    console.log('✅ Horario encontrado:', data.day_of_week);
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

// Preparar resumen de reservas activas (compacto)
const reservationsSummary = reservations.length > 0 
  ? reservations.map(r => `${r.reservation_date} ${r.reservation_time} (${r.party_size}p)`).join(', ')
  : 'No tiene reservas activas';

// Preparar horarios (compacto)
let hoursSummary = 'No disponible';
if (operatingHours.length > 0) {
  hoursSummary = operatingHours
    .map(h => `${h.day_of_week.substring(0, 3)}: ${h.open_time}-${h.close_time}`)
    .join(', ');
} else if (settings.calendar_schedule && settings.calendar_schedule.length > 0) {
  hoursSummary = settings.calendar_schedule
    .filter(day => day.is_open)
    .map(day => `${day.day_name}: ${day.open_time}-${day.close_time}`)
    .join(', ');
}

// ✅ CONTEXTO OPTIMIZADO - SOLO LO ESENCIAL
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
  
  // Cliente (compacto)
  customer_context: {
    has_active_reservations: reservations.length > 0,
    reservations_count: reservations.length,
    reservations_summary: reservationsSummary
  },
  
  // Restaurante (SOLO lo esencial)
  restaurant_context: {
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    hours_summary: hoursSummary,
    
    // Settings esenciales (sin basura)
    settings: {
      reservation_duration: settings.reservation_duration || 90,
      max_party_size: bookingSettings.max_party_size || 8,
      min_booking_hours: bookingSettings.min_booking_hours || 2,
      advance_booking_days: bookingSettings.advance_booking_days || 30,
      cancellation_policy: bookingSettings.cancellation_policy || '24h'
    },
    
    agent_name: settings.agent?.name || 'el asistente virtual'
  }
};

console.log('✅ Contexto optimizado:', {
  intent: enrichedContext.classification.intent,
  confidence: enrichedContext.classification.confidence,
  active_reservations: enrichedContext.customer_context.reservations_count,
  tokens_estimados: JSON.stringify(enrichedContext).length / 4  // Estimación
});

return enrichedContext;


// =====================================
// NODO: 🔀 Preparar Actualización
// TIPO: Code
// POSICIÓN: ANTES de "🔄 Actualizar Conversación"
// =====================================

const data = $input.first().json;

// Mapeo profesional de intents español → inglés (valores válidos en BD)
const intentMap = {
  'reservar': 'reservation',
  'modificar': 'modification',
  'modificación': 'modification',
  'cancelar': 'cancellation',
  'cancelación': 'cancellation',
  'consultar': 'inquiry',
  'consulta': 'inquiry',
  'queja': 'complaint',
  'quejas': 'complaint',
  'feedback': 'feedback',         // ✨ NUEVO
  'opinión': 'feedback',          // ✨ NUEVO
  'valoración': 'feedback',       // ✨ NUEVO
  'satisfacción': 'feedback',     // ✨ NUEVO
  'información': 'inquiry',
  'info': 'inquiry',
  'otro': 'other'
};

// Obtener el intent de la clasificación
const intent = data.classification?.intent || 'consultar';
const interactionType = intentMap[intent.toLowerCase()] || 'inquiry';

// Preparar metadata completa y estructurada
const metadata = {
  classification: {
    intent: data.classification.intent,
    entities: data.classification.entities || {},
    sentiment: data.classification.sentiment || 'neutral',
    confidence: data.classification.confidence || 0,
    reasoning: data.classification.reasoning || ''
  },
  last_response_at: new Date().toISOString(),
  agent_response: data.agent_response,
  response_timestamp: data.timestamp,
  // Si es feedback solicitado, incluir contexto
  is_solicited_feedback: data.is_solicited_feedback || false,
  campaign_id: data.campaign_id || null
};

// Logs para debugging (producción)
console.log('🔀 Preparando actualización conversación:');
console.log(`   Intent original: ${intent}`);
console.log(`   Interaction type mapeado: ${interactionType}`);
console.log(`   Sentiment: ${metadata.classification.sentiment}`);
console.log(`   Conversation ID: ${data.conversation_id}`);

return {
  conversation_id: data.conversation_id,
  interaction_type: interactionType,
  status: 'active',
  metadata: metadata,
  metadata_json: JSON.stringify(metadata)
};


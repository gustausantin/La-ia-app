// =============================================
// LÓGICA HÍBRIDA ROBUSTA CON MARCADOR DE CONVERSACIÓN
// =============================================
// REGLA DE ORO: Si hay conversación ACTIVA → SIEMPRE LLM
// Solo evalúa respuestas fijas en NUEVAS conversaciones
// =============================================

const context = $input.first().json;

const intent = context.classification?.intent || 'otro';
const sentiment = context.classification?.sentiment || 'neutral';
const userMessage = context.user_message || '';
const restaurantName = context.restaurant_context?.name || 'nuestro restaurante';
const customerName = context.customer_name || '';
const conversationId = context.conversation_id;

console.log('🔀 Evaluando lógica híbrida ROBUSTA:', { 
  intent, 
  sentiment, 
  conversation_id: conversationId 
});

// =============================================
// PASO 1: VERIFICAR SI HAY CONVERSACIÓN ACTIVA
// =============================================

let isActiveConversation = false;
let timeSinceLastMessage = Infinity;

try {
  // Consultar estado de la conversación
  const { data: conversation, error } = await $supabase
    .from('agent_conversations')
    .select('last_message_at, status, created_at')
    .eq('id', conversationId)
    .single();
  
  if (error) {
    console.error('❌ Error consultando conversación:', error);
  } else if (conversation) {
    const lastMessageTime = new Date(conversation.last_message_at || conversation.created_at);
    const now = new Date();
    timeSinceLastMessage = (now - lastMessageTime) / 1000 / 60; // minutos
    
    // Conversación ACTIVA si:
    // - Estado = 'active'
    // - Último mensaje hace menos de 15 minutos
    isActiveConversation = 
      conversation.status === 'active' && 
      timeSinceLastMessage < 15;
    
    console.log('📊 Estado conversación:', {
      status: conversation.status,
      last_message: conversation.last_message_at,
      minutes_ago: timeSinceLastMessage.toFixed(1),
      is_active: isActiveConversation
    });
  }
} catch (e) {
  console.error('❌ Excepción consultando conversación:', e);
}

// =============================================
// PASO 2: SI HAY CONVERSACIÓN ACTIVA → LLM SIEMPRE
// =============================================

if (isActiveConversation) {
  console.log('✅ Conversación ACTIVA detectada → LLM mantiene el hilo');
  
  return {
    ...context,
    use_fixed_response: false,
    use_llm: true,
    should_escalate: false,
    _conversation_active: true,
    _minutes_since_last: timeSinceLastMessage.toFixed(1)
  };
}

// =============================================
// PASO 3: CONVERSACIÓN NUEVA O INACTIVA
// → Evaluar respuestas fijas SOLO para casos críticos
// =============================================

console.log('🆕 Conversación NUEVA o INACTIVA → evaluando respuestas fijas');

// 3.1 QUEJA GRAVE → Escalar inmediatamente
if (intent === 'complaint' || intent === 'queja') {
  console.log('😡 Queja detectada - escalando');
  
  return {
    ...context,
    use_fixed_response: true,
    use_llm: false,
    fixed_message: `Lamentamos muchísimo las molestias, ${customerName}. El encargado de ${restaurantName} ha sido notificado y te contactará en breve para resolver esta situación.`,
    action: "escalate",
    should_escalate: true,
    escalate_reason: "queja_grave",
    escalate_urgency: "high",
    _conversation_active: false
  };
}

// 3.2 CLIENTE PIDE HABLAR CON HUMANO → Escalar
const msgLower = userMessage.toLowerCase();
const humanKeywords = [
  'hablar con',
  'hablar con alguien',
  'encargado',
  'gerente',
  'jefe',
  'persona real',
  'persona de verdad',
  'humano',
  'operador',
  'responsable'
];

if (humanKeywords.some(keyword => msgLower.includes(keyword))) {
  console.log('👤 Cliente pide humano - escalando');
  
  return {
    ...context,
    use_fixed_response: true,
    use_llm: false,
    fixed_message: "Por supuesto, te paso con el encargado. Un momento, por favor.",
    action: "escalate",
    should_escalate: true,
    escalate_reason: "cliente_solicita",
    escalate_urgency: "medium",
    _conversation_active: false
  };
}

// 3.3 FEEDBACK POSITIVO (solo si es claramente feedback DESPUÉS de visita)
if (intent === 'feedback' && sentiment === 'positive') {
  // Verificar que no sea durante una reserva activa
  const feedbackKeywords = ['estuvo', 'fue', 'experiencia', 'volveremos', 'nos encantó', 'excelente'];
  const isFeedback = feedbackKeywords.some(kw => msgLower.includes(kw));
  
  if (isFeedback) {
    console.log('😊 Feedback positivo post-visita');
    
    return {
      ...context,
      use_fixed_response: true,
      use_llm: false,
      fixed_message: `¡Muchas gracias por tu opinión, ${customerName}! Nos alegra mucho que hayas disfrutado tu visita en ${restaurantName} 😊`,
      action: "close",
      should_escalate: false,
      _conversation_active: false
    };
  }
}

// 3.4 FEEDBACK NEGATIVO (solo si es claramente feedback DESPUÉS de visita)
if (intent === 'feedback' && sentiment === 'negative') {
  const feedbackKeywords = ['estuvo', 'fue', 'experiencia', 'decepcionado', 'mala'];
  const isFeedback = feedbackKeywords.some(kw => msgLower.includes(kw));
  
  if (isFeedback) {
    console.log('😔 Feedback negativo post-visita');
    
    return {
      ...context,
      use_fixed_response: true,
      use_llm: false,
      fixed_message: `Lamentamos que tu experiencia en ${restaurantName} no haya sido la esperada. Hemos tomado nota de tus comentarios. Gracias por hacérnoslo saber.`,
      action: "close",
      should_escalate: false,
      log_negative_feedback: true,
      _conversation_active: false
    };
  }
}

// =============================================
// PASO 4: TODO LO DEMÁS → LLM
// =============================================
// Esto incluye:
// - Reservas, modificaciones, cancelaciones
// - Consultas (menú, horarios, etc.)
// - Saludos, confirmaciones, agradecimientos
// - Cualquier conversación normal

console.log('🤖 Usando LLM para manejar conversación');

return {
  ...context,
  use_fixed_response: false,
  use_llm: true,
  should_escalate: false,
  _conversation_active: false
};


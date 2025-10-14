// =============================================
// LÓGICA HÍBRIDA SIMPLIFICADA
// Va DESPUÉS de "🔗 Fusionar Contexto Enriquecido"
// =============================================

// Recibimos el contexto ya fusionado y limpio
const context = $input.first().json;

// Extraer datos necesarios (ya vienen normalizados)
const intent = context.classification?.intent || 'otro';
const sentiment = context.classification?.sentiment || 'neutral';
const userMessage = context.user_message || '';
const restaurantName = context.restaurant_context?.name || 'nuestro restaurante';
const customerName = context.customer_name || '';

console.log('🔀 Evaluando lógica híbrida:', { 
  intent, 
  sentiment, 
  restaurantName,
  customer: customerName
});

// =============================================
// FUNCIÓN: getRespuestaFija
// =============================================
function getRespuestaFija(intent, sentiment, userMessage, restaurantName) {
  
  // 1. FEEDBACK POSITIVO
  if (intent === 'feedback' && sentiment === 'positive') {
    return {
      hasFixedResponse: true,
      message: `¡Muchas gracias por tu opinión, ${customerName}! Nos alegra mucho que hayas disfrutado tu visita en ${restaurantName} 😊`,
      action: "close",
      shouldEscalate: false
    };
  }
  
  // 2. FEEDBACK NEGATIVO
  if (intent === 'feedback' && sentiment === 'negative') {
    return {
      hasFixedResponse: true,
      message: `Lamentamos que tu experiencia en ${restaurantName} no haya sido la esperada. Hemos tomado nota de tus comentarios. Gracias por hacérnoslo saber.`,
      action: "close",
      shouldEscalate: false,
      logNegativeFeedback: true
    };
  }
  
  // 3. QUEJA GRAVE
  if (intent === 'complaint' || intent === 'queja') {
    return {
      hasFixedResponse: true,
      message: `Lamentamos muchísimo las molestias, ${customerName}. El encargado de ${restaurantName} ha sido notificado y te contactará en breve para resolver esta situación.`,
      action: "escalate",
      shouldEscalate: true,
      escalateReason: "queja_grave",
      urgency: "high"
    };
  }
  
  // 4. CLIENTE PIDE HABLAR CON HUMANO (detección por palabras clave)
  const msgLower = userMessage.toLowerCase();
  const humanKeywords = [
    'hablar con',
    'hablar con alguien',
    'persona real',
    'persona de verdad',
    'encargado',
    'gerente',
    'jefe',
    'humano',
    'operador',
    'responsable',
    'alguien de',
    'pasar con'
  ];
  
  if (humanKeywords.some(keyword => msgLower.includes(keyword))) {
    return {
      hasFixedResponse: true,
      message: "Por supuesto, te paso con el encargado. Un momento, por favor.",
      action: "escalate",
      shouldEscalate: true,
      escalateReason: "cliente_solicita",
      urgency: "medium"
    };
  }
  
  // 5. SALUDO SIMPLE
  if (intent === 'greeting' || intent === 'saludo') {
    return {
      hasFixedResponse: true,
      message: `¡Hola ${customerName}! Soy la asistente virtual de ${restaurantName}. ¿En qué puedo ayudarte? Puedo ayudarte con reservas, modificaciones o consultas.`,
      action: "wait",
      shouldEscalate: false
    };
  }
  
  // 6. AGRADECIMIENTO
  if (intent === 'thanks' || intent === 'gracias' || intent === 'agradecimiento') {
    return {
      hasFixedResponse: true,
      message: `¡Un placer, ${customerName}! Que tengas un excelente día 😊`,
      action: "close",
      shouldEscalate: false
    };
  }
  
  // 7. FUERA DE ALCANCE
  if (intent === 'other' || intent === 'otro') {
    return {
      hasFixedResponse: true,
      message: "Lo siento, mi función es ayudarte con reservas y consultas sobre el restaurante. ¿Hay algo relacionado con esto en lo que pueda ayudarte?",
      action: "wait",
      shouldEscalate: false
    };
  }
  
  // 8. CASOS QUE VAN AL LLM (reservas, modificaciones, cancelaciones, consultas)
  const conversationalIntents = [
    'reservation', 'reservar',
    'modification', 'modificar', 'modificación',
    'cancellation', 'cancelar', 'cancelación',
    'inquiry', 'consultar', 'consulta', 'información'
  ];
  
  if (conversationalIntents.includes(intent)) {
    return {
      hasFixedResponse: false,
      useLLM: true
    };
  }
  
  // 9. ERROR / NO RECONOCIDO → Escalar por seguridad
  return {
    hasFixedResponse: true,
    message: "Disculpa, estoy teniendo dificultades para procesar tu solicitud. Te paso con el encargado para ayudarte mejor.",
    action: "escalate",
    shouldEscalate: true,
    escalateReason: "error_sistema",
    urgency: "medium"
  };
}

// =============================================
// EVALUAR RESPUESTA
// =============================================
const respuesta = getRespuestaFija(intent, sentiment, userMessage, restaurantName);

console.log('📋 Resultado evaluación:', {
  hasFixedResponse: respuesta.hasFixedResponse,
  shouldEscalate: respuesta.shouldEscalate,
  action: respuesta.action
});

// =============================================
// PREPARAR OUTPUT
// =============================================
if (respuesta.hasFixedResponse) {
  // HAY RESPUESTA FIJA - No usar LLM
  console.log('✅ Usando respuesta fija');
  
  return {
    ...context, // Mantener TODO el contexto original
    use_fixed_response: true,
    use_llm: false,
    fixed_message: respuesta.message,
    action: respuesta.action,
    should_escalate: respuesta.shouldEscalate || false,
    escalate_reason: respuesta.escalateReason || null,
    escalate_urgency: respuesta.urgency || 'medium',
    log_negative_feedback: respuesta.logNegativeFeedback || false
  };
  
} else {
  // NO HAY RESPUESTA FIJA - Usar LLM
  console.log('🤖 Usando LLM conversacional');
  
  return {
    ...context, // Pasar TODO el contexto al LLM
    use_fixed_response: false,
    use_llm: true,
    should_escalate: false
  };
}


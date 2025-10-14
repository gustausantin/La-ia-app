// =========================================
// RESPUESTAS FIJAS CONTROLADAS
// Para usar en Workflow 3 (lógica híbrida)
// =========================================

const RESPUESTAS_FIJAS = {
  
  // ========================================
  // 1. FEEDBACK POSITIVO
  // ========================================
  feedback_positive: {
    message: "¡Muchas gracias por tu opinión! Nos alegra mucho que hayas disfrutado tu visita 😊",
    action: "close", // Cierra conversación, no pregunta más
    log: true // Registra en BD
  },
  
  // ========================================
  // 2. FEEDBACK NEGATIVO
  // ========================================
  feedback_negative: {
    message: "Lamentamos que tu experiencia no haya sido la esperada. Hemos tomado nota de tus comentarios. Gracias por hacérnoslo saber.",
    action: "close",
    log: true,
    alert: false // No escala automáticamente, solo registra
  },
  
  // ========================================
  // 3. QUEJA GRAVE
  // ========================================
  complaint: {
    message: "Lamentamos muchísimo las molestias. El encargado ha sido notificado y te contactará en breve para resolver esta situación.",
    action: "escalate", // Escala automáticamente
    escalate_reason: "queja_grave",
    urgency: "high",
    log: true
  },
  
  // ========================================
  // 4. CLIENTE SOLICITA HABLAR CON HUMANO
  // ========================================
  escalate_requested: {
    message: "Por supuesto, te paso con el encargado. Un momento, por favor.",
    action: "escalate",
    escalate_reason: "cliente_solicita",
    urgency: "medium",
    log: true
  },
  
  // ========================================
  // 5. SALUDO SIMPLE (sin intención clara)
  // ========================================
  greeting: {
    message: "¡Hola! Soy la asistente virtual de [NOMBRE_RESTAURANTE]. ¿En qué puedo ayudarte? Puedo ayudarte con reservas, modificaciones o consultas.",
    action: "wait", // Espera siguiente mensaje
    log: false
  },
  
  // ========================================
  // 6. AGRADECIMIENTO DEL CLIENTE
  // ========================================
  thanks: {
    message: "¡Un placer! Que tengas un excelente día 😊",
    action: "close",
    log: false
  },
  
  // ========================================
  // 7. MENSAJE FUERA DE ALCANCE
  // ========================================
  out_of_scope: {
    message: "Lo siento, mi función es ayudarte con reservas y consultas sobre el restaurante. ¿Hay algo relacionado con esto en lo que pueda ayudarte?",
    action: "wait",
    log: false
  },
  
  // ========================================
  // 8. ERROR O SITUACIÓN NO CONTROLADA
  // ========================================
  error_fallback: {
    message: "Disculpa, estoy teniendo dificultades para procesar tu solicitud. Te paso con el encargado para ayudarte mejor.",
    action: "escalate",
    escalate_reason: "error_sistema",
    urgency: "medium",
    log: true
  }
};

// =========================================
// FUNCIÓN PARA OBTENER RESPUESTA
// =========================================
function getRespuesta(intent, sentiment, context) {
  const restaurantName = context.restaurant_name || 'nuestro restaurante';
  
  // FEEDBACK POSITIVO
  if (intent === 'feedback' && sentiment === 'positive') {
    return RESPUESTAS_FIJAS.feedback_positive;
  }
  
  // FEEDBACK NEGATIVO
  if (intent === 'feedback' && sentiment === 'negative') {
    return RESPUESTAS_FIJAS.feedback_negative;
  }
  
  // QUEJA
  if (intent === 'complaint' || intent === 'queja') {
    return RESPUESTAS_FIJAS.complaint;
  }
  
  // CLIENTE PIDE HABLAR CON HUMANO
  // (detectar palabras clave: "hablar con alguien", "persona real", "encargado", etc.)
  const message = context.user_message?.toLowerCase() || '';
  if (message.includes('hablar con') || 
      message.includes('persona') || 
      message.includes('encargado') ||
      message.includes('humano') ||
      message.includes('gerente')) {
    return RESPUESTAS_FIJAS.escalate_requested;
  }
  
  // SALUDO
  if (intent === 'greeting' || intent === 'saludo') {
    const resp = {...RESPUESTAS_FIJAS.greeting};
    resp.message = resp.message.replace('[NOMBRE_RESTAURANTE]', restaurantName);
    return resp;
  }
  
  // AGRADECIMIENTO
  if (intent === 'thanks' || intent === 'gracias') {
    return RESPUESTAS_FIJAS.thanks;
  }
  
  // FUERA DE ALCANCE
  if (intent === 'other' || intent === 'otro') {
    return RESPUESTAS_FIJAS.out_of_scope;
  }
  
  // CASOS QUE VAN AL LLM (no devuelven respuesta fija)
  if (intent === 'reservation' || 
      intent === 'reservar' ||
      intent === 'modification' || 
      intent === 'modificar' ||
      intent === 'cancellation' || 
      intent === 'cancelar' ||
      intent === 'inquiry' || 
      intent === 'consultar') {
    return null; // null = ir al LLM conversacional
  }
  
  // ERROR / NO RECONOCIDO
  return RESPUESTAS_FIJAS.error_fallback;
}

// =========================================
// EXPORTAR PARA USO EN N8N
// =========================================
// Uso en Code Node de Workflow 3:
/*
const respuesta = getRespuesta(intent, sentiment, {
  restaurant_name: 'La Taverna',
  user_message: 'Quiero hablar con alguien'
});

if (respuesta) {
  // Hay respuesta fija, no usar LLM
  if (respuesta.action === 'escalate') {
    // Llamar herramienta escalate_to_human
  }
  return { final_message: respuesta.message };
} else {
  // No hay respuesta fija, ir al LLM
  → Continuar con Super Agent
}
*/


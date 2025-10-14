// ✅ CÓDIGO CORREGIDO PARA "📤 Procesar Respuesta"
// Copia este código en el nodo "📤 Procesar Respuesta"

const agentResponse = $input.item.json;
const contextData = $('🔗 Fusionar Contexto Enriquecido').item.json;

// Extraer respuesta del agente
const finalMessage = agentResponse.output || agentResponse.text || 'Lo siento, no pude procesar tu solicitud. ¿Podrías reformular tu mensaje?';

console.log('📤 Respuesta del Super Agent:', finalMessage.substring(0, 150));

// ✅ OBTENER NÚMEROS DE TELÉFONO CORRECTAMENTE
// Desde el contexto optimizado
const restaurantPhone = contextData.restaurant_context?.phone || '';
const customerPhone = contextData.customer_phone || '';

console.log('📞 Teléfonos detectados:', {
  from: restaurantPhone,
  to: customerPhone
});

// Validar que los teléfonos existan
if (!restaurantPhone || !customerPhone) {
  throw new Error(`❌ Faltan números de teléfono. From: ${restaurantPhone}, To: ${customerPhone}`);
}

return {
  conversation_id: contextData.conversation_id,
  customer_id: contextData.customer_id,
  customer_phone: customerPhone,
  customer_name: contextData.customer_name,
  restaurant_id: contextData.restaurant_id,
  channel: contextData.channel,
  agent_response: finalMessage,
  classification: contextData.classification,
  timestamp: new Date().toISOString(),
  
  // ✅ Para envío de WhatsApp (campos corregidos)
  whatsapp_from: restaurantPhone,
  whatsapp_to: customerPhone
};



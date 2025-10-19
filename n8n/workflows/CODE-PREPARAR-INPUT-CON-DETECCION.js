// ═══════════════════════════════════════════════════════════════════
// NODO: 📋 Preparar Input
// WORKFLOW: Super Agente
// POSICIÓN: Después de "▶️ Start", antes de "If"
// ═══════════════════════════════════════════════════════════════════

const inputData = $input.first().json;

console.log('📥 Input recibido del Gateway:', {
  conversation_id: inputData.conversation_id,
  conversation_active: inputData.conversation_active,
  user_message: inputData.user_message
});

// ✅ Pasar directamente el flag del Gateway
return {
  ...inputData,
  conversation_active: inputData.conversation_active || false,
  requires_classification: !inputData.conversation_active
};


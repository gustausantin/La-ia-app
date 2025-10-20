# 🎤 WhatsApp Buffer con Soporte de AUDIO (Whisper)

## 📋 DESCRIPCIÓN

Workflow mejorado que soporta **mensajes de TEXTO y AUDIO** en WhatsApp.

- **TEXTO**: Funciona como siempre
- **AUDIO**: Descarga el audio, lo transcribe con Whisper y lo procesa como texto

---

## 🎯 NUEVOS NODOS AÑADIDOS

1. **❓ ¿Es Audio?** → IF que detecta si viene audio o texto
2. **📥 Descargar Audio** → Descarga el archivo de audio desde Twilio
3. **🔊 Transcribir (Whisper)** → Envía el audio a OpenAI Whisper para transcripción
4. **📄 Formatear Transcripción** → Convierte la transcripción en texto procesable

---

## ⚙️ CONFIGURACIÓN PASO A PASO

### **1. CREDENCIALES NECESARIAS**

#### **A. OpenAI API** (para Whisper)
```
Nombre: OpenAI API
Tipo: OpenAI
API Key: sk-proj-... (tu API key de OpenAI, la misma que usas para GPT-4)
```

**Cómo configurarlo en N8N:**
1. Ve a **Credentials** → **Add Credential**
2. Busca **OpenAI**
3. Pega tu API Key
4. Guarda como "OpenAI API"

---

#### **B. Twilio Basic Auth** (para descargar audio)
```
Nombre: Twilio Basic Auth
Tipo: HTTP Basic Auth
Username: AC*********************************** (tu ACCOUNT_SID de Twilio)
Password: [tu AUTH_TOKEN de Twilio]
```

**Dónde encontrar estas credenciales:**
1. Ve a tu [Twilio Console](https://console.twilio.com/)
2. En el Dashboard verás:
   - **Account SID** → Este es el username
   - **Auth Token** → Este es el password (click en "Show" para verlo)

**Cómo configurarlo en N8N:**
1. Ve a **Credentials** → **Add Credential**
2. Busca **HTTP Basic Auth**
3. Username: Tu Account SID
4. Password: Tu Auth Token
5. Guarda como "Twilio Basic Auth"

---

### **2. IMPORTAR EL WORKFLOW**

1. En N8N, ve a **Workflows** → **Import from File**
2. Selecciona el archivo `1-whatsapp-buffer-CON-AUDIO-WHISPER.json`
3. Click en **Import**

---

### **3. CONFIGURAR LOS NODOS**

#### **Nodo: "📥 Descargar Audio"**
- **Credentials**: Selecciona "Twilio Basic Auth" (la que creaste en el paso 1B)

#### **Nodo: "🔊 Transcribir (Whisper)"**
- **Credentials**: Selecciona "OpenAI API" (la que creaste en el paso 1A)

**¡LISTO!** Los demás nodos ya están configurados.

---

## 🔄 FLUJO VISUAL

```
📱 Webhook WhatsApp
    ↓
📝 Normalizar (detecta: audio vs texto)
    ↓
❓ ¿Es Audio?
    ├─ SÍ (Audio) → 📥 Descargar → 🔊 Whisper → 📄 Formatear ─┐
    └─ NO (Texto) ─────────────────────────────────────────────┘
                                                                ↓
                                                  🔍 Get Restaurants
                                                                ↓
                                                  ✅ Find Restaurant
                                                                ↓
                                                  🔄 UPSERT Buffer
                                                                ↓
                                                  (resto del flujo igual...)
```

---

## 🎤 CÓMO PROBAR

### **Enviar un AUDIO de prueba:**

1. Activa el workflow en N8N
2. Desde WhatsApp, envía un **audio de voz** al número de tu restaurante
3. Ve a los logs del workflow en N8N
4. Deberías ver:
   ```
   📥 Webhook recibido
   ✅ Datos procesados: { messageType: 'audio', mediaUrl: '...' }
   ✅ Audio transcrito: "Hola, quiero hacer una reserva para mañana a las 8"
   ```

### **Enviar un TEXTO (debe seguir funcionando):**

1. Desde WhatsApp, envía un **mensaje de texto** normal
2. Debe procesarse como siempre (sin pasar por Whisper)

---

## 💰 COSTE DE WHISPER

| Duración del Audio | Coste por Audio |
|--------------------|-----------------|
| 30 segundos        | $0.003          |
| 1 minuto           | $0.006          |
| 2 minutos          | $0.012          |

**Ejemplo mensual:**
- 100 audios/día de 1 minuto = $0.60/día = **$18/mes**

**MUY ECONÓMICO** para el valor que aporta.

---

## 🐛 TROUBLESHOOTING

### **Error: "Cannot download audio"**
- **Causa**: Credenciales de Twilio incorrectas
- **Solución**: Verifica que el Account SID y Auth Token sean correctos

### **Error: "Whisper API failed"**
- **Causa**: API Key de OpenAI incorrecta o sin saldo
- **Solución**: Verifica tu API Key en OpenAI y que tengas créditos

### **El audio no se transcribe correctamente**
- **Causa**: Audio con mucho ruido o idioma incorrecto
- **Solución**: Whisper es robusto, pero si hay problema, verifica:
  - Que el parámetro `language` esté en `es` (español)
  - Que el audio no esté corrupto

---

## ✨ BENEFICIOS

✅ **Mayor accesibilidad** → Clientes mayores o con prisa  
✅ **Más rápido** → Hablar es más rápido que escribir  
✅ **Natural** → Conversación más humana  
✅ **Diferenciador** → Pocos restaurantes lo tienen  
✅ **Conversión** → Menos fricción = más reservas  

---

## 📝 NOTAS TÉCNICAS

- **Whisper soporta**: Hasta 25MB de audio (~3 horas)
- **Formato aceptado**: audio/ogg, audio/mp3, audio/wav, etc.
- **Idioma**: Configurado en español (`language: es`)
- **Latencia**: ~3-5 segundos adicionales para transcribir

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Importar el workflow
2. ✅ Configurar credenciales (OpenAI + Twilio)
3. ✅ Activar el workflow
4. 🎤 **Enviar un audio de prueba**
5. 🎉 **¡Disfrutar de la magia!**

---

**¿Dudas o problemas?** Revisa los logs de N8N para ver qué está pasando en cada paso.


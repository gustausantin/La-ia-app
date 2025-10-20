# 📚 WORKFLOW 05: RAG KNOWLEDGE PROCESSOR

## 🎯 **PROPÓSITO:**

Procesar documentos (PDF, DOCX, DOC, TXT) y convertirlos en vectores para búsqueda semántica.

Permite al Agente IA responder preguntas sobre:
- 🍽️ **Menú/Carta** del restaurante
- 🏢 **Servicios** (Wi-Fi, parking, admite perros, etc.)
- ℹ️ **Información adicional** (eventos, promociones, historia)

---

## 🔄 **FLUJO DEL WORKFLOW:**

```
Frontend Upload
      ↓
Supabase Storage
      ↓
[Webhook Trigger] ← Frontend llama después de upload
      ↓
[Validar Input] ← Verificar restaurant_id, file_path, category
      ↓
[Descargar de Supabase Storage] ← GET archivo
      ↓
[Switch por Tipo] ← PDF / DOCX / DOC / TXT
      ↓
[Extract Text] ← Extraer texto del documento
      ↓
[Supabase Vector Store] ← Generar embeddings y guardar
      ├── Embeddings OpenAI (text-embedding-3-small)
      ├── Text Splitter (2000 chars, 200 overlap)
      └── Data Loader (+ metadata)
      ↓
[Marcar como Procesado] ← Actualizar estado en BD
      ↓
[Respuesta OK] ← 200 success
```

---

## 📥 **INPUT ESPERADO (Webhook POST):**

```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "file_path": "d6b63130.../menu/carta-primavera.pdf",
  "file_name": "Carta Primavera 2025.pdf",
  "file_type": "application/pdf",
  "category": "menu",
  "file_id": "uuid-del-archivo",
  "uploaded_at": "2025-10-20T14:00:00Z"
}
```

### **Campos obligatorios:**
- `restaurant_id` (UUID)
- `file_path` (string) - Path completo en Supabase Storage
- `file_type` (string) - MIME type
- `category` (enum) - `menu`, `services`, `other`

### **Campos opcionales:**
- `file_name` (string) - Default: "documento.pdf"
- `file_id` (UUID) - Para actualizar estado en `restaurant_knowledge_files`
- `uploaded_at` (ISO timestamp)

---

## 📤 **OUTPUT:**

### **Success (200):**
```json
{
  "success": true,
  "message": "Documento procesado correctamente",
  "file_name": "Carta Primavera 2025.pdf",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1"
}
```

### **Error (500):**
```json
{
  "success": false,
  "error": "Error al extraer texto del PDF",
  "file_name": "Carta Primavera 2025.pdf"
}
```

---

## 🗂️ **FORMATOS SOPORTADOS:**

| Formato | MIME Type | Uso típico |
|---------|-----------|------------|
| PDF | `application/pdf` | Menús, cartas |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | Políticas, info |
| DOC | `application/msword` | Legacy docs |
| TXT | `text/plain` | Info simple |

---

## 💾 **METADATA GUARDADA EN VECTOR STORE:**

```javascript
{
  restaurant_id: "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",  // ✅ Multi-tenant
  category: "menu",
  file_name: "Carta Primavera 2025.pdf",
  file_type: "application/pdf",
  file_id: "uuid",
  uploaded_at: "2025-10-20T14:00:00Z",
  processed_at: "2025-10-20T14:02:15Z"
}
```

---

## 🔧 **CONFIGURACIÓN REQUERIDA:**

### **1. Supabase Storage:**

Crear bucket `restaurant-knowledge`:

```sql
-- En Supabase Dashboard → Storage
CREATE BUCKET restaurant-knowledge PUBLIC;

-- RLS Policy (multi-tenant)
CREATE POLICY "Users can upload to their restaurant folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'restaurant-knowledge'
  AND (storage.foldername(name))[1] = auth.jwt() ->> 'restaurant_id'
);
```

### **2. Supabase Vector Table:**

Ejecutar migración (ya creada):
```bash
# Archivo: supabase/migrations/20251020_001_knowledge_base.sql
```

### **3. Webhook URL:**

```
https://tu-n8n.app.n8n.cloud/webhook/process-knowledge
```

---

## 🧪 **TESTING:**

### **Test con curl:**

```bash
curl -X POST https://tu-n8n.app.n8n.cloud/webhook/process-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
    "file_path": "d6b63130.../menu/test.pdf",
    "file_name": "Test Menu.pdf",
    "file_type": "application/pdf",
    "category": "menu"
  }'
```

### **Verificar en Supabase:**

```sql
-- Ver vectores generados
SELECT 
  id,
  metadata->>'restaurant_id' as restaurant_id,
  metadata->>'file_name' as file_name,
  metadata->>'category' as category,
  substring(content, 1, 100) as preview
FROM restaurant_knowledge_vectors
WHERE metadata->>'restaurant_id' = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔗 **INTEGRACIÓN CON SUPER AGENT:**

El Workflow 3 (Super Agent) consultará estos vectores:

```javascript
// Nuevo nodo en Super Agent (antes del LLM)
const { data: knowledge } = await supabase.rpc('match_restaurant_knowledge', {
  query_embedding: await getEmbedding(userMessage),
  match_threshold: 0.7,
  match_count: 3,
  filter: { restaurant_id: restaurantId }
});

// Añadir al contexto del LLM
if (knowledge.length > 0) {
  context += '\n\n📚 INFORMACIÓN DEL RESTAURANTE:\n' + 
    knowledge.map(k => k.content).join('\n\n');
}
```

---

## 📊 **MÉTRICAS Y COSTES:**

### **Embeddings (OpenAI text-embedding-3-small):**
- **Coste**: $0.00002 / 1K tokens
- **Documento típico**: 5,000 tokens = $0.0001
- **100 documentos/mes**: $0.01

### **Storage (Supabase):**
- **Coste**: $0.021 / GB
- **100 PDFs × 500KB**: 50MB = $0.001/mes

**COSTE TOTAL: ~$0.011/mes para 100 documentos** 🎉

---

## ⚠️ **LIMITACIONES Y MEJORAS FUTURAS:**

### **Limitaciones actuales:**
- Solo texto (no OCR para imágenes de menús)
- No detecta idioma (siempre español)
- No valida calidad del texto extraído

### **Mejoras futuras (Fase 2):**
- ✅ OCR para imágenes (Tesseract / AWS Textract)
- ✅ Detección automática de idioma
- ✅ Validación de contenido extraído
- ✅ Reprocessing automático si falla

---

## 🚀 **ESTADO:**

- ✅ Workflow creado y documentado
- ⏳ Pendiente: Tabla Supabase
- ⏳ Pendiente: Frontend upload
- ⏳ Pendiente: Integración con Super Agent

---

**Creado**: 2025-10-20  
**Última actualización**: 2025-10-20  
**Versión**: 1.0


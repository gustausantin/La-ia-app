# 📚 WORKFLOW 05: RAG Knowledge Processor V2

**Versión:** 2.0 (Optimizada)  
**Fecha:** 20 Octubre 2025  
**Estado:** ✅ Listo para producción

---

## 🎯 **OBJETIVO**

Procesar documentos del restaurante (menú, servicios, información) subidos por el usuario y convertirlos en vectores para búsqueda semántica (RAG).

---

## 🏗️ **ARQUITECTURA**

### **Flujo Completo:**

```
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND (BaseConocimientoContent.jsx)                          │
│  1. Usuario sube archivo                                         │
│  2. Upload a Supabase Storage ✅                                 │
│  3. Crear registro en restaurant_knowledge_files (processing)    │
│  4. 🚀 POST webhook N8N                                          │
└──────────────────────────────────────────────────────────────────┘
                            ⬇️
┌──────────────────────────────────────────────────────────────────┐
│  N8N WORKFLOW (este archivo)                                     │
│                                                                  │
│  📥 Webhook Trigger                                              │
│       ⬇️                                                         │
│  🔍 Validar Input (restaurant_id, file_path, category, etc.)   │
│       ⬇️                                                         │
│  📥 Descargar archivo de Supabase Storage                       │
│       ⬇️                                                         │
│  🔀 Switch por tipo (PDF/DOCX/DOC/TXT)                         │
│       ⬇️                                                         │
│  📄 Extract Text (según tipo)                                   │
│       ⬇️                                                         │
│  ✂️ Text Splitter (chunks 2000 chars, overlap 200)            │
│       ⬇️                                                         │
│  🧠 OpenAI Embeddings (text-embedding-3-small)                 │
│       ⬇️                                                         │
│  💾 Supabase Vector Store → restaurant_knowledge_vectors        │
│       ⬇️                                                         │
│  ✅ Actualizar restaurant_knowledge_files (status: completed)   │
│       ⬇️                                                         │
│  📤 Respuesta OK al frontend                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📥 **INPUT (desde Frontend)**

El frontend hace un **POST** al webhook con este JSON:

```json
{
  "restaurant_id": "uuid",
  "file_path": "{restaurant_id}/menu/carta.pdf",
  "file_name": "Carta Primavera 2025.pdf",
  "file_type": "application/pdf",
  "category": "menu",
  "file_id": "uuid",
  "uploaded_at": "2025-10-20T14:00:00Z"
}
```

### **Campos obligatorios:**
- `restaurant_id` (UUID)
- `file_path` (path en Supabase Storage)
- `file_name` (nombre original del archivo)
- `file_type` (MIME type: application/pdf, etc.)
- `category` (`menu` | `services` | `other`)

### **Campos opcionales:**
- `file_id` (UUID del registro en `restaurant_knowledge_files`)
- `uploaded_at` (timestamp ISO)

---

## 📤 **OUTPUT (al Frontend)**

### **✅ Si todo va bien (200):**
```json
{
  "success": true,
  "message": "Documento procesado correctamente",
  "file_name": "Carta Primavera 2025.pdf",
  "restaurant_id": "uuid",
  "file_id": "uuid"
}
```

### **❌ Si hay error (500):**
```json
{
  "success": false,
  "error": "Descripción del error",
  "file_name": "Carta Primavera 2025.pdf",
  "file_id": "uuid"
}
```

---

## 🔧 **CONFIGURACIÓN NECESARIA**

### **1. Credenciales en N8N:**

#### **a) Supabase API (`supabaseApi`)**
- **URL del proyecto:** `https://ktsqwvhqamedpmzkzjaz.supabase.co`
- **Service Role Key:** (desde Supabase → Settings → API)
- **Usar en:** `💾 Supabase Vector Store`, `✅ Marcar como Procesado`, `❌ Error Handler`

#### **b) Supabase Storage Auth (`httpHeaderAuth`)**
- **Header:** `Authorization`
- **Value:** `Bearer {SUPABASE_SERVICE_ROLE_KEY}`
- **Usar en:** `📥 Descargar de Supabase Storage`

#### **c) OpenAI API (`openAiApi`)**
- **API Key:** (desde OpenAI Dashboard)
- **Usar en:** `🧠 Embeddings OpenAI`

---

### **2. Configuración del Vector Store:**

En el nodo `💾 Supabase Vector Store`:

- **Mode:** `insert` (insertar vectores)
- **Table Name:** `restaurant_knowledge_vectors`
- **Query Name:** `match_restaurant_knowledge`
- **Embedding Model:** `text-embedding-3-small` (1536 dims)

---

### **3. Text Splitter:**

- **Chunk Size:** `2000` caracteres
- **Chunk Overlap:** `200` caracteres
- **Estrategia:** Recursive Character Text Splitter

**¿Por qué estos valores?**
- 2000 chars = ~500 tokens = contexto suficiente sin perder coherencia
- 200 overlap = evita cortar frases importantes entre chunks

---

## 🗄️ **TABLAS DE SUPABASE**

### **1. `restaurant_knowledge_files`**
Tracking de archivos subidos.

```sql
CREATE TABLE restaurant_knowledge_files (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('menu', 'services', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

**Estados:**
- `processing` → Archivo subido, esperando N8N
- `completed` → Vectorizado correctamente ✅
- `failed` → Error en el procesamiento ❌

---

### **2. `restaurant_knowledge_vectors`**
Vectores para búsqueda semántica.

```sql
CREATE TABLE restaurant_knowledge_vectors (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Metadata (ejemplo):**
```json
{
  "restaurant_id": "uuid",
  "category": "menu",
  "file_name": "Carta Primavera 2025.pdf",
  "file_type": "application/pdf",
  "file_id": "uuid",
  "uploaded_at": "2025-10-20T14:00:00Z",
  "processed_at": "2025-10-20T14:02:15Z"
}
```

---

### **3. Función `match_restaurant_knowledge`**

Búsqueda semántica con filtros:

```sql
SELECT * FROM match_restaurant_knowledge(
  query_embedding := '[vector de 1536 dims]',
  match_threshold := 0.7,
  match_count := 3,
  filter_restaurant_id := 'uuid-del-restaurante',
  filter_category := 'menu'
);
```

**Parámetros:**
- `query_embedding` → Vector de la pregunta (generado por OpenAI)
- `match_threshold` → Similaridad mínima (0-1, default: 0.7)
- `match_count` → Número de resultados (default: 3)
- `filter_restaurant_id` → **Obligatorio** (multi-tenant)
- `filter_category` → Opcional (`menu`, `services`, `other`)

**Retorna:**
```
id | content | metadata | similarity
```

---

## 🧪 **TESTING**

### **1. Test Manual (Postman/cURL):**

```bash
curl -X POST https://gustausantin.app.n8n.cloud/webhook/process-knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
    "file_path": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1/menu/carta.pdf",
    "file_name": "Carta Primavera 2025.pdf",
    "file_type": "application/pdf",
    "category": "menu",
    "file_id": "abc123",
    "uploaded_at": "2025-10-20T14:00:00Z"
  }'
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Documento procesado correctamente",
  "file_name": "Carta Primavera 2025.pdf",
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "file_id": "abc123"
}
```

---

### **2. Verificar en Supabase:**

**a) Comprobar que el estado cambió a `completed`:**
```sql
SELECT id, file_name, status, processed_at, error_message
FROM restaurant_knowledge_files
WHERE id = 'abc123';
```

**b) Ver vectores generados:**
```sql
SELECT id, content, metadata->>'file_name' as file_name
FROM restaurant_knowledge_vectors
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
ORDER BY created_at DESC
LIMIT 5;
```

**c) Contar chunks generados:**
```sql
SELECT 
  metadata->>'file_name' as file_name,
  COUNT(*) as chunks
FROM restaurant_knowledge_vectors
WHERE restaurant_id = 'd6b63130-1ebf-4284-98fc-a3b31a85d9d1'
GROUP BY metadata->>'file_name';
```

---

## 💰 **COSTOS**

### **OpenAI Embeddings:**
- **Modelo:** `text-embedding-3-small`
- **Costo:** $0.00002 por 1K tokens
- **Ejemplo:** 
  - Menú de 5 páginas = ~2,500 palabras = ~3,300 tokens
  - Costo: $0.000066 (menos de 1 centavo) ✅

### **N8N:**
- **Free tier:** 5,000 ejecuciones/mes
- **Costo adicional:** €1 por 1,000 ejecuciones extra
- **Ejemplo:** 100 archivos/mes = 100 ejecuciones = €0 ✅

### **Supabase:**
- **Storage:** 1GB gratis/mes
- **Database:** Incluido en plan gratuito
- **Vector search:** Sin costo adicional ✅

**💡 Total estimado para 100 archivos/mes: < $0.50** 🎉

---

## 🚨 **MANEJO DE ERRORES**

### **Errores comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| `restaurant_id es obligatorio` | Falta el campo en el POST | Verificar payload del frontend |
| `Tipo de archivo no soportado` | MIME type no válido | Solo PDF, DOCX, DOC, TXT |
| `Error al descargar de Storage` | Archivo no existe o permisos | Verificar `file_path` y RLS en Storage |
| `Error al extraer texto` | Archivo corrupto | Validar archivo antes de subir |
| `Error al vectorizar` | API de OpenAI caída | Reintentar en 1 minuto |

### **Todos los errores:**
1. Se capturan en el nodo `❌ Error Handler`
2. Se guarda `status: 'failed'` en `restaurant_knowledge_files`
3. Se incluye `error_message` para debugging
4. Se responde con código `500` al frontend

---

## 📊 **LOGS Y MONITOREO**

### **Logs importantes:**

```javascript
console.log('📥 Input recibido desde frontend:', data);
console.log('✅ Validación correcta');
console.log('✅ Archivo procesado correctamente');
console.log('✅ Estado actualizado en BD: completed');
console.error('❌ Error al procesar archivo:', error);
```

### **Métricas a monitorear:**

1. **Tiempo de procesamiento:** Debe ser < 60 segundos
2. **Tasa de éxito:** Debe ser > 95%
3. **Chunks generados por archivo:** 5-50 (depende del tamaño)
4. **Archivos en `processing` > 5 min:** Indica problemas

---

## 🔄 **INTEGRACIÓN CON SUPER AGENT**

Una vez los documentos están vectorizados, el Super Agent (Workflow 3) puede usarlos:

```javascript
// En el Super Agent, agregar nodo:
// "🔍 Buscar en Base de Conocimiento"

const query = "¿Cuál es el precio del menú del día?";

// 1. Vectorizar la pregunta
const queryEmbedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: query
});

// 2. Buscar en Supabase
const { data } = await supabase.rpc('match_restaurant_knowledge', {
  query_embedding: queryEmbedding.data[0].embedding,
  match_threshold: 0.7,
  match_count: 3,
  filter_restaurant_id: restaurantId,
  filter_category: 'menu'
});

// 3. Usar los resultados en el prompt del LLM
const context = data.map(d => d.content).join('\n\n');
const prompt = `Basándote en esta información del restaurante:\n\n${context}\n\nResponde: ${query}`;
```

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [ ] Crear las tablas en Supabase (`20251020_001_knowledge_base_system.sql`)
- [ ] Crear el bucket de Storage (`20251020_002_knowledge_storage_bucket.sql`)
- [ ] Configurar credenciales en N8N (Supabase + OpenAI)
- [ ] Importar el workflow `05-rag-knowledge-processor-FINAL-V2.json`
- [ ] Activar el workflow
- [ ] Obtener la URL del webhook
- [ ] Actualizar la URL en `BaseConocimientoContent.jsx`
- [ ] Hacer test manual con Postman
- [ ] Verificar vectores en Supabase
- [ ] Probar desde el frontend
- [ ] Monitorear logs por 24h

---

## 📝 **NOTAS IMPORTANTES**

1. **Multi-tenant:** Todos los vectores incluyen `restaurant_id` en metadata
2. **RLS:** Las tablas tienen Row Level Security habilitada
3. **Cleanup automático:** Si se borra un archivo de `restaurant_knowledge_files`, sus vectores se borran también (trigger)
4. **Reprocessing:** Si un archivo falla, se puede reprocesar llamando al webhook de nuevo
5. **Escalabilidad:** El sistema soporta hasta 10,000 vectores por restaurante sin problemas de performance

---

## 🆘 **SOPORTE**

Si algo falla, revisar en orden:

1. **Logs de N8N** → Ver qué nodo falló
2. **Tabla `restaurant_knowledge_files`** → Ver `error_message`
3. **Supabase Storage** → Verificar que el archivo existe
4. **Credenciales de N8N** → Verificar que están activas
5. **OpenAI Dashboard** → Ver si hay problemas con la API

---

**✅ Workflow listo para producción** 🚀


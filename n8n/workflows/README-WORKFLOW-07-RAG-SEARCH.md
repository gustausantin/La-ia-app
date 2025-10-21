# 🔍 WORKFLOW 07: RAG Search Tool

## 📋 DESCRIPCIÓN

Workflow dedicado a buscar información en la base de conocimiento del restaurante (menú, servicios, info general) usando búsqueda semántica con vectores.

Este workflow es **llamado como herramienta** por el Super Agent (Workflow 3) cuando el cliente pregunta sobre el menú, servicios, políticas, etc.

---

## 🎯 OBJETIVO

Proporcionar al Super Agent una forma simple y eficiente de consultar la base de conocimiento del restaurante sin complejidad de vectores en su propio workflow.

---

## 📥 INPUT (Desde Super Agent)

```json
{
  "restaurant_id": "uuid",
  "query": "¿Qué vinos tenéis?",
  "category": "menu" // OPCIONAL: "menu", "services", "other", o null para buscar en todas
}
```

---

## 📤 OUTPUT (Hacia Super Agent)

### ✅ Si encuentra información:

```json
{
  "success": true,
  "found": true,
  "answer": "Información encontrada:\n\nTenemos una selección de vinos...\n\n---\nFuentes: Carta_Vinos_2025.pdf",
  "content": "Contenido raw...",
  "sources": [
    {
      "index": 1,
      "file_name": "Carta_Vinos_2025.pdf",
      "category": "menu",
      "similarity": 0.89
    }
  ],
  "total_results": 3,
  "query": "¿Qué vinos tenéis?"
}
```

### ❌ Si NO encuentra información:

```json
{
  "success": false,
  "found": false,
  "answer": "Lo siento, no tengo información específica sobre eso en nuestra base de conocimiento. ¿Puedo ayudarte con algo más?"
}
```

---

## 🔄 FLUJO DEL WORKFLOW

```
1️⃣ Execute Workflow Trigger
   ↓
2️⃣ 🔍 Validar Input
   - Verificar restaurant_id y query
   - Extraer category (opcional)
   ↓
3️⃣ 🔎 Buscar en Vector Store (Supabase)
   - Convertir query a vector (OpenAI Embeddings)
   - Buscar con match_restaurant_knowledge()
   - Filtrar por restaurant_id + category
   - Top 5 resultados
   ↓
4️⃣ 📊 Formatear Resultados
   - Extraer pageContent de cada resultado
   - Combinar contenido
   - Listar fuentes
   ↓
5️⃣ ✅ Preparar Respuesta
   - Construir answer estructurado
   - Return al Super Agent
```

---

## ⚙️ CONFIGURACIÓN

### 1️⃣ **Credenciales OpenAI**
- Nodo: `Embeddings OpenAI`
- Model: `text-embedding-3-small`
- Credential: Tu OpenAI API key

### 2️⃣ **Credenciales Supabase**
- Nodo: `🔎 Buscar en Vector Store`
- Table: `restaurant_knowledge_vectors`
- Query Name: `match_restaurant_knowledge`
- Credential: Tu Supabase API key

### 3️⃣ **Metadata Filters**
- `filter_restaurant_id`: `{{ $('🔍 Validar Input').item.json.restaurant_id }}`
- `filter_category`: `{{ $('🔍 Validar Input').item.json.category }}`

### 4️⃣ **Top K**
- Número de resultados: **5** (ajustable según necesidad)

---

## 🔗 INTEGRACIÓN CON SUPER AGENT (Workflow 3)

En el Workflow 3, el tool `consultar_informacion_restaurante` debe configurarse así:

### **Antes (❌ Incorrecto - Vector Store directo):**
```
Tool: consultar_informacion_restaurante
  ↓
Supabase Vector Store (con embeddings complejos)
```

### **Ahora (✅ Correcto - Execute Workflow):**
```
Tool: consultar_informacion_restaurante
  ↓
Execute Workflow: "07 - RAG Search Tool"
  Input:
    - restaurant_id: {{ $json.restaurant_id }}
    - query: {{ $json.query }}
    - category: {{ $json.info_type || null }}
```

---

## 🧪 PRUEBAS

### Test 1: Buscar en menú
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "query": "¿Qué tenéis de primeros?",
  "category": "menu"
}
```

### Test 2: Buscar en servicios
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "query": "¿Tenéis parking?",
  "category": "services"
}
```

### Test 3: Buscar en todo
```json
{
  "restaurant_id": "d6b63130-1ebf-4284-98fc-a3b31a85d9d1",
  "query": "¿Hacéis eventos?",
  "category": null
}
```

---

## 🐛 TROUBLESHOOTING

### Error: "restaurant_id es obligatorio"
- Verifica que el Super Agent pasa `restaurant_id` correctamente

### Error: "No se encontró información"
- Verifica que hay documentos procesados en `restaurant_knowledge_vectors`
- Verifica que el `restaurant_id` coincide
- Ajusta el `match_threshold` en la función SQL si es necesario

### Error: "Could not find function match_restaurant_knowledge"
- Ejecuta la migración `20251020_001_knowledge_base_system.sql`
- Verifica que la función existe en Supabase

---

## 📊 VENTAJAS DE ESTE ENFOQUE

✅ **Separación clara**: RAG en su propio workflow  
✅ **Fácil de debuggear**: Puedes probar el RAG independientemente  
✅ **Reutilizable**: Otros workflows pueden usar esta búsqueda  
✅ **Sin complejidad** en el Super Agent  
✅ **Mejor manejo de errores**  

---

## 🚀 PRÓXIMOS PASOS

1. Importar este workflow en N8N
2. Configurar credenciales (OpenAI + Supabase)
3. Modificar el Super Agent para usar `Execute Workflow` en lugar de `Supabase Vector Store`
4. Probar con preguntas reales del cliente

---

**Creado**: 2025-10-21  
**Versión**: 1.0  
**Autor**: La-IA Team


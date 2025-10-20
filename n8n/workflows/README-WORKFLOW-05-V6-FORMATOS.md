# 📚 Workflow 05 - RAG Knowledge Processor V6 - Formatos Aceptados

## 📄 **FORMATOS SOPORTADOS**

### ✅ Formatos Aceptados (SIN Word)

| Formato | MIME Type | Extensión | Uso Típico |
|---------|-----------|-----------|------------|
| **PDF** | `application/pdf` | `.pdf` | Menús, políticas, documentos generales |
| **TXT** | `text/plain` | `.txt` | Información simple, listas, textos |
| **HTML** | `text/html` | `.html` | Páginas web, contenido formateado |
| **Excel (XLSX)** | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` | Hojas de cálculo modernas |
| **Excel (XLS)** | `application/vnd.ms-excel` | `.xls` | Hojas de cálculo legacy (Excel 97-2003) |
| **Google Docs** | `application/vnd.google-apps.document` | `.gdoc` | Documentos de Google Drive |
| **Google Sheets** | `application/vnd.google-apps.spreadsheet` | `.gsheet` | Hojas de cálculo de Google Drive |

### ❌ Formatos NO Soportados

- ~~Microsoft Word (`.docx`, `.doc`)~~ → **Eliminado por solicitud del usuario**

---

## 🔄 **CAMBIOS IMPLEMENTADOS**

### 1️⃣ **Frontend (`src/pages/Configuracion.jsx`)**
- ✅ Actualizada la sección informativa para mostrar los formatos correctos
- ✅ Eliminadas las referencias a Word (DOCX/DOC)
- ✅ Agregados badges para: PDF, TXT, HTML, XLSX, XLS, Google Docs, Google Sheets

### 2️⃣ **Componente (`src/components/BaseConocimientoContent.jsx`)**
- ✅ Actualizado el objeto `ACCEPTED_TYPES` con los 7 formatos soportados
- ✅ Actualizado el mensaje de error de validación
- ✅ El `accept` del input de archivo se actualiza dinámicamente

### 3️⃣ **Workflow N8N (`05-rag-knowledge-processor-FINAL-V6-TU-WORKFLOW-CORREGIDO.json`)**
- ✅ Nodo `🔍 Validar Input`: Lista `acceptedTypes` actualizada con los 7 MIME types
- ✅ Nodo `Switch`: Corregido para usar `file_type` en lugar de `doc_type`
- ✅ Mantiene todas las ramas: PDF, TXT, HTML, Excel (XLSX), Excel (XLS), Google Docs, Google Sheets

---

## 🎯 **FLUJO DE PROCESAMIENTO POR TIPO**

```
┌─────────────────────┐
│  📥 Webhook Trigger │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 🔍 Validar Input    │  ← Valida MIME type contra acceptedTypes
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 📥 Descargar Storage│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   🔀 Switch         │  ← Lee file_type y enruta
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────┬──────────┬──────────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼          ▼          ▼          ▼
  PDF           TXT        HTML      XLSX       XLS      G.Docs   G.Sheets
    │             │          │          │          │          │          │
    └─────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                                      │
                                      ▼
                         ┌─────────────────────┐
                         │ 💾 Vector Store     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ ✅ Actualizar BD    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ ✅ Respuesta OK     │
                         └─────────────────────┘
```

---

## 📋 **LÍMITES Y RESTRICCIONES**

| Categoría | Archivos Max | Tamaño Max |
|-----------|--------------|------------|
| **Menú** | 2 archivos | 5 MB c/u |
| **Servicios** | 1 archivo | 5 MB |
| **Otros** | 1 archivo | 5 MB |

**Total:** 4 archivos máximo por restaurante

---

## 🧪 **TESTING**

### Casos de Prueba

1. ✅ Subir un PDF → Debe procesarse correctamente
2. ✅ Subir un TXT → Debe procesarse correctamente
3. ✅ Subir un HTML → Debe procesarse correctamente
4. ✅ Subir un XLSX → Debe procesarse correctamente
5. ✅ Subir un XLS → Debe procesarse correctamente
6. ✅ Subir un archivo de Google Docs → Debe procesarse correctamente
7. ✅ Subir un archivo de Google Sheets → Debe procesarse correctamente
8. ❌ Intentar subir un DOCX → Debe mostrar error "Formato no soportado"
9. ❌ Intentar subir un archivo de 6MB → Debe mostrar error "Archivo demasiado grande"
10. ❌ Intentar subir 3 archivos en categoría "Menú" → Debe mostrar error "Máximo 2 archivos"

---

## 🚀 **PRÓXIMOS PASOS**

1. **Importar el workflow V6 en N8N**
   - Archivo: `05-rag-knowledge-processor-FINAL-V6-TU-WORKFLOW-CORREGIDO.json`
   - Verificar que las credenciales estén configuradas

2. **Probar con archivos reales**
   - Subir 1 PDF de menú
   - Subir 1 TXT de información adicional
   - Verificar que el agente pueda responder preguntas sobre el contenido

3. **Monitorear logs**
   - Verificar que no haya errores en la consola del frontend
   - Verificar que el workflow N8N procese correctamente cada tipo

---

## 📊 **ESTADO ACTUAL**

| Component | Estado | Archivo |
|-----------|--------|---------|
| **Frontend - Configuración** | ✅ Actualizado | `src/pages/Configuracion.jsx` |
| **Frontend - Componente** | ✅ Actualizado | `src/components/BaseConocimientoContent.jsx` |
| **Workflow N8N** | ✅ Actualizado | `05-rag-knowledge-processor-FINAL-V6-TU-WORKFLOW-CORREGIDO.json` |
| **Documentación** | ✅ Creada | Este archivo |

---

**Fecha:** 20 de octubre de 2025  
**Versión:** V6 TU WORKFLOW CORREGIDO  
**Cambio principal:** Eliminado soporte para Word, agregados HTML, Excel y Google Docs/Sheets


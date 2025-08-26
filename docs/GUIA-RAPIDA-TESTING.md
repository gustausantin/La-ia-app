# ⚡ GUÍA RÁPIDA - Testing La-IA App
**Referencia rápida para uso diario**

## 🚀 COMANDOS ESENCIALES

### 📱 **USO DIARIO (RECOMENDADO)**
```bash
# Vigilancia automática mientras programas
npm run test:watch
```

### ⚡ **VERIFICACIÓN RÁPIDA**
```bash
# Ejecutar todos los tests una vez
npm test
```

### 🎨 **INTERFAZ VISUAL**
```bash
# Ver tests en el navegador
npm run test:ui
```

### 📊 **ANÁLISIS SEMANAL**
```bash
# Reporte de cobertura
npm run test:coverage
```

---

## 🎯 SETUP DIARIO RECOMENDADO

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run test:watch
```

**¡Listo! Programas tranquilo con protección automática** ✅

---

## 📺 INTERPRETAR RESULTADOS

### ✅ **TODO BIEN**
```bash
✅ PASS  Tests passing (94)
🎉 All tests successful!
```

### ❌ **HAY PROBLEMAS**
```bash
❌ FAIL  Login button not working
   Line 42: Expected button enabled
🚨 Fix needed!
```

---

## 🚨 PROBLEMAS COMUNES

### **Tests no se ejecutan automáticamente**
```bash
# Reiniciar watch mode:
Ctrl+C
npm run test:watch
```

### **Tests muy lentos**
```bash
# Verificar si hay loops infinitos en código
# Revisar mocks excesivamente complejos
```

### **Error de dependencias**
```bash
npm install
```

---

## 🎯 INDICADORES DE ÉXITO

✅ **BUENO:** 85%+ tests pasando  
✅ **BUENO:** Cobertura > 80%  
✅ **BUENO:** Tests en < 30s  

❌ **MALO:** < 70% tests pasando  
❌ **MALO:** Tests > 2 minutos  
❌ **MALO:** Bugs en producción  

---

## 💡 TIPS RÁPIDOS

🎯 **Deja `npm run test:watch` corriendo siempre**  
⚡ **Lee los errores completos - te dicen exactamente qué arreglar**  
📊 **Ejecuta `npm run test:coverage` una vez por semana**  
🚀 **Si cambias código intencionalmente, actualiza los tests**  

---

**🔗 Manual completo:** `docs/MANUAL-TESTING-COMPLETO.md`

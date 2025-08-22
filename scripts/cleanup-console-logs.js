#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos a procesar (excluyendo logger.js y algunos archivos específicos)
const filesToProcess = [
  'src/components/Layout.jsx',
  'src/components/NotificationCenter.jsx', 
  'src/pages/Configuracion.jsx',
  'src/components/ErrorBoundary.jsx',
  'src/index.jsx',
  'src/lib/supabase.js',
  'src/api/register.js',
  'src/lib/restaurantService.js',
  'src/pages/Calendario.jsx',
  'src/pages/Analytics.jsx',
  'src/pages/Clientes.jsx',
  'src/pages/Comunicacion.jsx',
  'src/pages/Confirm.jsx',
  'src/pages/Login.jsx',
  'src/pages/Mesas.jsx',
  'src/pages/Register.jsx',
  'src/pages/Reservas.jsx'
];

// Patrones de reemplazo
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'log.info('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'log.warn('
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'log.error('
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'log.info('
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'log.debug('
  }
];

// Función para procesar un archivo
function processFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    
    // Verificar si ya tiene el import del logger
    const hasLoggerImport = content.includes("import { log } from") || 
                           content.includes("import log from");
    
    // Aplicar reemplazos
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        hasChanges = true;
      }
    });
    
    // Agregar import del logger si es necesario
    if (hasChanges && !hasLoggerImport) {
      // Buscar la línea de imports de React
      const reactImportRegex = /^import React[^;]*;$/m;
      const match = content.match(reactImportRegex);
      
      if (match) {
        const loggerImport = "import { log } from '../utils/logger.js';";
        content = content.replace(match[0], match[0] + '\n' + loggerImport);
      } else {
        // Si no encuentra import de React, agregar al inicio
        content = "import { log } from '../utils/logger.js';\n" + content;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Procesado: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️ Sin cambios: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Procesar todos los archivos
function main() {
  console.log('🧹 Iniciando limpieza de console.log...\n');
  
  let processedFiles = 0;
  let totalFiles = 0;
  
  filesToProcess.forEach(filePath => {
    totalFiles++;
    if (processFile(filePath)) {
      processedFiles++;
    }
  });
  
  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${processedFiles}/${totalFiles}`);
  console.log(`   ✅ Limpieza completada`);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processFile, replacements };

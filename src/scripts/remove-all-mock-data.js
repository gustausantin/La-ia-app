#!/usr/bin/env node

/**
 * 🧹 SCRIPT PARA ELIMINAR TODOS LOS DATOS MOCK DEL CÓDIGO
 * 
 * Este script busca y reemplaza todos los datos hardcodeados/mock
 * en las páginas para que la aplicación esté completamente limpia.
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

// Lista de archivos a procesar
const filesToClean = [
    'Dashboard.jsx',
    'Clientes.jsx', 
    'Comunicacion.jsx',
    'Mesas.jsx',
    'Reservas.jsx',
    'Analytics.jsx',
    'Calendario.jsx'
];

console.log('🧹 Iniciando limpieza de datos mock...\n');

filesToClean.forEach(filename => {
    const filepath = path.join(pagesDir, filename);
    
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  Archivo no encontrado: ${filename}`);
        return;
    }
    
    console.log(`📄 Procesando: ${filename}`);
    
    let content = fs.readFileSync(filepath, 'utf8');
    let changes = 0;
    
    // Patrones a buscar y reemplazar
    const patterns = [
        // Eliminar arrays mock de clientes
        {
            search: /const mockCustomers = \[[\s\S]*?\];/g,
            replace: '// Datos mock eliminados - usando datos reales de Supabase',
            description: 'Arrays mock de clientes'
        },
        
        // Eliminar arrays mock de conversaciones
        {
            search: /const mockConversations = \[[\s\S]*?\];/g,
            replace: '// Datos mock eliminados - usando datos reales de Supabase',
            description: 'Arrays mock de conversaciones'
        },
        
        // Eliminar setCustomers(mockCustomers)
        {
            search: /setCustomers\(mockCustomers\);/g,
            replace: 'setCustomers([]);',
            description: 'setCustomers mock'
        },
        
        // Eliminar setConversations(mockConversations)
        {
            search: /setConversations\(mockConversations\);/g,
            replace: 'setConversations([]);',
            description: 'setConversations mock'
        },
        
        // Eliminar calculateStats(mockCustomers)
        {
            search: /calculateStats\(mockCustomers\);/g,
            replace: 'calculateStats([]);',
            description: 'calculateStats mock'
        },
        
        // Eliminar eventos de ejemplo en Calendario
        {
            search: /const sampleEvents = \[[\s\S]*?\];/g,
            replace: 'const sampleEvents = []; // Sin eventos de ejemplo',
            description: 'Eventos de ejemplo en Calendario'
        },
        
        // Eliminar datos de ocupación simulados
        {
            search: /\/\/ Generar datos de ocupación simulados[\s\S]*?setOccupancyData\(occupancySimData\);/g,
            replace: '// Sin datos de ocupación simulados\n            setOccupancyData({});',
            description: 'Datos de ocupación simulados'
        },
        
        // Eliminar comentarios TODO con datos mock
        {
            search: /\/\/ TODO: En producción, cargar datos reales desde Supabase[\s\S]*?\/\/ Simulando datos[\s\S]*?await new Promise.*?;/g,
            replace: '// Cargar datos reales desde Supabase',
            description: 'Comentarios TODO con simulaciones'
        }
    ];
    
    patterns.forEach(pattern => {
        const matches = content.match(pattern.search);
        if (matches) {
            content = content.replace(pattern.search, pattern.replace);
            changes += matches.length;
            console.log(`   ✅ ${pattern.description}: ${matches.length} cambios`);
        }
    });
    
    if (changes > 0) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`   💾 Guardado con ${changes} cambios\n`);
    } else {
        console.log(`   ℹ️  Sin cambios necesarios\n`);
    }
});

console.log('✅ Limpieza completada!\n');
console.log('📋 Próximos pasos:');
console.log('1. Revisar los archivos modificados');
console.log('2. Hacer git add . && git commit');
console.log('3. Probar la aplicación sin datos mock');

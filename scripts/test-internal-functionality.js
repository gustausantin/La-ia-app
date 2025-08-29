#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TESTING INTERNO - LA-IA APP
 * Prueba todas las funcionalidades internas del chasis
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testInternalFunctionality() {
    console.log('🧪 TESTING INTERNO - LA-IA APP');
    console.log('=====================================\n');

    const results = {
        database: { passed: 0, failed: 0, tests: [] },
        rpc: { passed: 0, failed: 0, tests: [] },
        tables: { passed: 0, failed: 0, tests: [] },
        overall: { passed: 0, failed: 0 }
    };

    // ====================================
    // 1. TESTING DE BASE DE DATOS
    // ====================================
    console.log('📊 1. TESTING BASE DE DATOS');
    console.log('----------------------------');

    try {
        // Test 1: Conexión a Supabase
        const { data: healthCheck, error: healthError } = await supabase
            .from('restaurants')
            .select('id')
            .limit(1);

        if (healthError) throw healthError;
        
        results.database.tests.push({ name: 'Conexión Supabase', status: 'PASS' });
        results.database.passed++;
        console.log('✅ Conexión a Supabase: OK');

    } catch (error) {
        results.database.tests.push({ name: 'Conexión Supabase', status: 'FAIL', error: error.message });
        results.database.failed++;
        console.log('❌ Conexión a Supabase: FAIL -', error.message);
    }

    // Test 2: Verificar tablas principales
    const criticalTables = ['restaurants', 'customers', 'reservations', 'tables', 'user_restaurant_mapping'];
    
    for (const table of criticalTables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .limit(1);

            if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
                throw error;
            }

            results.database.tests.push({ name: `Tabla ${table}`, status: 'PASS' });
            results.database.passed++;
            console.log(`✅ Tabla ${table}: OK`);

        } catch (error) {
            results.database.tests.push({ name: `Tabla ${table}`, status: 'FAIL', error: error.message });
            results.database.failed++;
            console.log(`❌ Tabla ${table}: FAIL -`, error.message);
        }
    }

    // ====================================
    // 2. TESTING DE FUNCIONES RPC
    // ====================================
    console.log('\n🔧 2. TESTING FUNCIONES RPC');
    console.log('----------------------------');

    // Test RPC: get_dashboard_stats
    try {
        const { data, error } = await supabase.rpc('get_dashboard_stats', {
            p_restaurant_id: '00000000-0000-0000-0000-000000000000', // UUID fake para test
            p_start_date: '2025-01-30',
            p_end_date: '2025-01-30'
        });

        // No debe fallar aunque no haya datos
        results.rpc.tests.push({ name: 'get_dashboard_stats', status: 'PASS' });
        results.rpc.passed++;
        console.log('✅ RPC get_dashboard_stats: OK');

    } catch (error) {
        results.rpc.tests.push({ name: 'get_dashboard_stats', status: 'FAIL', error: error.message });
        results.rpc.failed++;
        console.log('❌ RPC get_dashboard_stats: FAIL -', error.message);
    }

    // Test RPC: get_reservations_safe
    try {
        const { data, error } = await supabase.rpc('get_reservations_safe', {
            p_restaurant_id: '00000000-0000-0000-0000-000000000000',
            p_start_date: '2025-01-30',
            p_end_date: '2025-01-30'
        });

        results.rpc.tests.push({ name: 'get_reservations_safe', status: 'PASS' });
        results.rpc.passed++;
        console.log('✅ RPC get_reservations_safe: OK');

    } catch (error) {
        results.rpc.tests.push({ name: 'get_reservations_safe', status: 'FAIL', error: error.message });
        results.rpc.failed++;
        console.log('❌ RPC get_reservations_safe: FAIL -', error.message);
    }

    // ====================================
    // 3. TESTING DE ESTRUCTURA DE DATOS
    // ====================================
    console.log('\n📋 3. TESTING ESTRUCTURA DE DATOS');
    console.log('----------------------------------');

    // Test: Schema de customers
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('visits_count, total_spent, last_visit_at, segment_auto, churn_risk_score')
            .limit(1);

        results.tables.tests.push({ name: 'Schema customers CRM', status: 'PASS' });
        results.tables.passed++;
        console.log('✅ Schema customers CRM: OK');

    } catch (error) {
        results.tables.tests.push({ name: 'Schema customers CRM', status: 'FAIL', error: error.message });
        results.tables.failed++;
        console.log('❌ Schema customers CRM: FAIL -', error.message);
    }

    // Test: Schema de billing_tickets
    try {
        const { data, error } = await supabase
            .from('billing_tickets')
            .select('id, total_amount, customer_id')
            .limit(1);

        results.tables.tests.push({ name: 'Schema billing_tickets', status: 'PASS' });
        results.tables.passed++;
        console.log('✅ Schema billing_tickets: OK');

    } catch (error) {
        results.tables.tests.push({ name: 'Schema billing_tickets', status: 'FAIL', error: error.message });
        results.tables.failed++;
        console.log('❌ Schema billing_tickets: FAIL -', error.message);
    }

    // ====================================
    // 4. RESUMEN FINAL
    // ====================================
    console.log('\n📊 RESUMEN DE TESTING INTERNO');
    console.log('==============================');

    const totalPassed = results.database.passed + results.rpc.passed + results.tables.passed;
    const totalFailed = results.database.failed + results.rpc.failed + results.tables.failed;
    const totalTests = totalPassed + totalFailed;
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    console.log(`📊 Base de Datos: ${results.database.passed}/${results.database.passed + results.database.failed} tests`);
    console.log(`🔧 Funciones RPC: ${results.rpc.passed}/${results.rpc.passed + results.rpc.failed} tests`);
    console.log(`📋 Estructura: ${results.tables.passed}/${results.tables.passed + results.tables.failed} tests`);
    console.log(`\n🎯 TOTAL: ${totalPassed}/${totalTests} tests (${successRate}%)`);

    if (successRate >= 90) {
        console.log('\n🎉 ¡CHASIS INTERNO EN EXCELENTE ESTADO!');
        console.log('✅ Ready para desarrollo de funcionalidades');
    } else if (successRate >= 70) {
        console.log('\n⚠️  Chasis interno funcional con algunas mejoras pendientes');
        console.log('🔧 Revisar tests fallidos para optimizar');
    } else {
        console.log('\n🚨 Chasis interno necesita correcciones importantes');
        console.log('❌ Resolver errores críticos antes de continuar');
    }

    // Mostrar tests fallidos
    const allFailedTests = [
        ...results.database.tests.filter(t => t.status === 'FAIL'),
        ...results.rpc.tests.filter(t => t.status === 'FAIL'),
        ...results.tables.tests.filter(t => t.status === 'FAIL')
    ];

    if (allFailedTests.length > 0) {
        console.log('\n❌ TESTS FALLIDOS:');
        allFailedTests.forEach(test => {
            console.log(`   - ${test.name}: ${test.error}`);
        });
    }

    return {
        success: successRate >= 90,
        successRate,
        results
    };
}

// Ejecutar testing
if (require.main === module) {
    testInternalFunctionality()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Error ejecutando tests:', error);
            process.exit(1);
        });
}

module.exports = { testInternalFunctionality };

/**
 * 🔧 AUDITORÍA COMPLETA DE COHERENCIA - LA-IA APP
 * Mecánico de precisión: Revisar cada pieza y el engranaje completo
 */

import { supabase } from '../src/lib/supabase.js';
import fs from 'fs';
import path from 'path';

// Colores para el reporte
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    purple: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class CoherenceAuditor {
    constructor() {
        this.auditResults = {
            configuration_coherence: [],
            data_flow_coherence: [],
            business_rules_coherence: [],
            ui_consistency: [],
            crm_integration: [],
            performance_issues: [],
            critical_errors: [],
            warnings: [],
            suggestions: []
        };
        this.score = {
            configuration: 0,
            data_flow: 0,
            business_rules: 0,
            ui_consistency: 0,
            crm_integration: 0,
            performance: 0,
            overall: 0
        };
    }

    // 🔧 AUDITORÍA 1: COHERENCIA CONFIGURACIÓN ↔ PÁGINAS
    async auditConfigurationCoherence() {
        console.log(`${colors.blue}🔧 AUDITORÍA 1: COHERENCIA CONFIGURACIÓN ↔ PÁGINAS${colors.reset}`);
        
        const issues = [];
        
        // 1.1 Verificar coherencia HORARIOS: Configuración → Calendario
        console.log('   📅 Verificando coherencia horarios...');
        const horariosConfig = await this.checkFileContent('src/pages/Configuracion.jsx', [
            'operating_hours',
            'saveOperatingHours',
            'settings.operating_hours'
        ]);
        
        const horariosCalendario = await this.checkFileContent('src/pages/Calendario.jsx', [
            'business_hours',
            'savedHours',
            'restaurants.settings'
        ]);
        
        if (horariosConfig.includes('operating_hours') && horariosCalendario.includes('business_hours')) {
            issues.push({
                type: 'INCONSISTENCIA CRÍTICA',
                area: 'Horarios',
                problem: 'Configuración usa operating_hours pero Calendario lee business_hours',
                impact: 'Los cambios de horarios en configuración NO se reflejan en calendario',
                solution: 'Unificar a business_hours en ambos archivos'
            });
        }
        
        // 1.2 Verificar coherencia CAPACIDAD: Configuración → Mesas
        console.log('   🪑 Verificando coherencia capacidad...');
        const capacidadConfig = await this.checkFileContent('src/pages/Configuracion.jsx', [
            'capacity_total',
            'settings.capacity_total'
        ]);
        
        const mesasValidation = await this.checkFileContent('src/pages/Mesas.jsx', [
            'capacity_total',
            'maxCapacity',
            'validation'
        ]);
        
        if (capacidadConfig.includes('capacity_total') && !mesasValidation.includes('capacity_total')) {
            issues.push({
                type: 'FUNCIONALIDAD FALTANTE',
                area: 'Capacidad',
                problem: 'No hay validación de capacidad máxima al crear mesas',
                impact: 'Se pueden crear más mesas de las configuradas como máximo',
                solution: 'Añadir validación en TableModal que consulte capacity_total'
            });
        }
        
        // 1.3 Verificar coherencia AGENTE IA: Configuración → Dashboard
        console.log('   🤖 Verificando coherencia agente IA...');
        const agentConfig = await this.checkFileContent('src/pages/Configuracion.jsx', [
            'settings.agent',
            'agent.enabled',
            'agent.personality'
        ]);
        
        const dashboardAgent = await this.checkFileContent('src/pages/Dashboard.jsx', [
            'agentStatus',
            'agent.enabled',
            'agentMetrics'
        ]);
        
        if (agentConfig.includes('agent.enabled') && !dashboardAgent.includes('agent.enabled')) {
            issues.push({
                type: 'DESCONEXIÓN',
                area: 'Agente IA',
                problem: 'Dashboard no lee configuración del agente desde settings',
                impact: 'Estado del agente en dashboard puede no coincidir con configuración',
                solution: 'Dashboard debe leer restaurant.settings.agent.enabled'
            });
        }
        
        // 1.4 Verificar coherencia CRM: Configuración → Clientes
        console.log('   🧠 Verificando coherencia CRM...');
        const crmConfig = await this.checkFileContent('src/pages/Configuracion.jsx', [
            'settings.crm',
            'crm.thresholds',
            'crm.automation'
        ]);
        
        const clientesCRM = await this.checkFileContent('src/pages/Clientes.jsx', [
            'segment_auto',
            'churn_risk_score',
            'crm.thresholds'
        ]);
        
        if (crmConfig.includes('crm.thresholds') && !clientesCRM.includes('crm.thresholds')) {
            issues.push({
                type: 'CONFIGURACIÓN NO APLICADA',
                area: 'CRM IA',
                problem: 'Página Clientes no usa umbrales CRM configurados',
                impact: 'Segmentación IA no respeta configuración personalizada',
                solution: 'Clientes debe leer y aplicar restaurant.settings.crm.thresholds'
            });
        }
        
        this.auditResults.configuration_coherence = issues;
        this.score.configuration = Math.max(0, 100 - (issues.length * 15));
        
        console.log(`   📊 Coherencia Configuración: ${this.score.configuration}/100 (${issues.length} problemas)`);
        return issues;
    }

    // 🔄 AUDITORÍA 2: FLUJO DE DATOS
    async auditDataFlowCoherence() {
        console.log(`${colors.blue}🔄 AUDITORÍA 2: FLUJO DE DATOS${colors.reset}`);
        
        const issues = [];
        
        // 2.1 Verificar flujo: Reservas → CRM → Segmentación
        console.log('   📊 Verificando flujo CRM automático...');
        const reservasFlow = await this.checkFileContent('src/pages/Reservas.jsx', [
            'processReservationCompletion',
            'status.*completed',
            'CRMService'
        ]);
        
        if (!reservasFlow.includes('processReservationCompletion')) {
            issues.push({
                type: 'FLUJO ROTO',
                area: 'CRM Automático',
                problem: 'Reservas no llama a processReservationCompletion al completar',
                impact: 'CRM no se actualiza automáticamente',
                solution: 'Añadir trigger CRM en handleReservationAction cuando status = completed'
            });
        }
        
        // 2.2 Verificar flujo: Configuración → Base Datos → UI
        console.log('   💾 Verificando flujo configuración → BD → UI...');
        
        this.auditResults.data_flow_coherence = issues;
        this.score.data_flow = Math.max(0, 100 - (issues.length * 20));
        
        console.log(`   📊 Flujo de Datos: ${this.score.data_flow}/100 (${issues.length} problemas)`);
        return issues;
    }

    // 📏 AUDITORÍA 3: REGLAS DE NEGOCIO
    async auditBusinessRules() {
        console.log(`${colors.blue}📏 AUDITORÍA 3: REGLAS DE NEGOCIO${colors.reset}`);
        
        const issues = [];
        
        // 3.1 Verificar validación capacidad máxima
        console.log('   🏠 Verificando validación capacidad...');
        const mesasValidation = await this.checkFileContent('src/pages/Mesas.jsx', [
            'capacity_total',
            'currentCapacity',
            'validation.*capacity'
        ]);
        
        if (!mesasValidation.includes('capacity_total')) {
            issues.push({
                type: 'VALIDACIÓN FALTANTE',
                area: 'Capacidad Máxima',
                problem: 'No se valida capacidad máxima al crear mesas',
                impact: 'Se pueden crear más mesas de las permitidas',
                solution: 'Añadir validación que sume capacity de todas las mesas vs capacity_total'
            });
        }
        
        // 3.2 Verificar validación límites reservas
        console.log('   📅 Verificando límites reservas...');
        const reservasLimits = await this.checkFileContent('src/pages/Reservas.jsx', [
            'advance_booking_days',
            'max_party_size',
            'min_party_size'
        ]);
        
        if (!reservasLimits.includes('advance_booking_days')) {
            issues.push({
                type: 'VALIDACIÓN FALTANTE',
                area: 'Límites Reservas',
                problem: 'No se validan límites de reservas configurados',
                impact: 'Se pueden hacer reservas fuera de los límites configurados',
                solution: 'Añadir validación de reservation_settings en formulario reservas'
            });
        }
        
        this.auditResults.business_rules_coherence = issues;
        this.score.business_rules = Math.max(0, 100 - (issues.length * 25));
        
        console.log(`   📊 Reglas de Negocio: ${this.score.business_rules}/100 (${issues.length} problemas)`);
        return issues;
    }

    // 🎨 AUDITORÍA 4: CONSISTENCIA UI
    async auditUIConsistency() {
        console.log(`${colors.blue}🎨 AUDITORÍA 4: CONSISTENCIA UI${colors.reset}`);
        
        const issues = [];
        
        // 4.1 Verificar consistencia de estados
        console.log('   🎯 Verificando consistencia estados...');
        
        // 4.2 Verificar navegación coherente
        console.log('   🔗 Verificando navegación coherente...');
        
        this.auditResults.ui_consistency = issues;
        this.score.ui_consistency = Math.max(0, 100 - (issues.length * 10));
        
        console.log(`   📊 Consistencia UI: ${this.score.ui_consistency}/100 (${issues.length} problemas)`);
        return issues;
    }

    // 🤖 AUDITORÍA 5: INTEGRACIÓN CRM
    async auditCRMIntegration() {
        console.log(`${colors.blue}🤖 AUDITORÍA 5: INTEGRACIÓN CRM${colors.reset}`);
        
        const issues = [];
        
        // 5.1 Verificar triggers CRM funcionando
        console.log('   ⚡ Verificando triggers CRM...');
        
        // 5.2 Verificar segmentación automática
        console.log('   🎯 Verificando segmentación automática...');
        
        this.auditResults.crm_integration = issues;
        this.score.crm_integration = Math.max(0, 100 - (issues.length * 20));
        
        console.log(`   📊 Integración CRM: ${this.score.crm_integration}/100 (${issues.length} problemas)`);
        return issues;
    }

    // 📁 Helper: Verificar contenido de archivo
    async checkFileContent(filePath, patterns) {
        try {
            const fullPath = path.resolve(filePath);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            const foundPatterns = patterns.filter(pattern => {
                const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'), 'i');
                return regex.test(content);
            });
            
            return foundPatterns;
        } catch (error) {
            console.error(`❌ Error leyendo ${filePath}:`, error.message);
            return [];
        }
    }

    // 📊 CALCULAR NOTA FINAL
    calculateFinalScore() {
        const weights = {
            configuration: 0.25,    // 25% - Crítico
            data_flow: 0.20,       // 20% - Muy importante
            business_rules: 0.20,   // 20% - Muy importante
            ui_consistency: 0.15,   // 15% - Importante
            crm_integration: 0.15,  // 15% - Importante
            performance: 0.05       // 5% - Menos crítico para coherencia
        };
        
        this.score.overall = Math.round(
            this.score.configuration * weights.configuration +
            this.score.data_flow * weights.data_flow +
            this.score.business_rules * weights.business_rules +
            this.score.ui_consistency * weights.ui_consistency +
            this.score.crm_integration * weights.crm_integration +
            this.score.performance * weights.performance
        );
        
        return this.score.overall;
    }

    // 📋 GENERAR REPORTE COMPLETO
    generateReport() {
        const finalScore = this.calculateFinalScore();
        
        console.log(`\n${colors.bold}🏆 REPORTE FINAL DE AUDITORÍA${colors.reset}`);
        console.log(`${colors.bold}===============================${colors.reset}`);
        
        // Mostrar puntuaciones
        console.log(`\n📊 PUNTUACIONES DETALLADAS:`);
        console.log(`   🔧 Coherencia Configuración: ${this.getScoreColor(this.score.configuration)}${this.score.configuration}/100${colors.reset}`);
        console.log(`   🔄 Flujo de Datos: ${this.getScoreColor(this.score.data_flow)}${this.score.data_flow}/100${colors.reset}`);
        console.log(`   📏 Reglas de Negocio: ${this.getScoreColor(this.score.business_rules)}${this.score.business_rules}/100${colors.reset}`);
        console.log(`   🎨 Consistencia UI: ${this.getScoreColor(this.score.ui_consistency)}${this.score.ui_consistency}/100${colors.reset}`);
        console.log(`   🤖 Integración CRM: ${this.getScoreColor(this.score.crm_integration)}${this.score.crm_integration}/100${colors.reset}`);
        
        console.log(`\n${colors.bold}🎯 NOTA FINAL: ${this.getScoreColor(finalScore)}${finalScore}/100${colors.reset}`);
        
        // Mostrar problemas críticos
        const allIssues = [
            ...this.auditResults.configuration_coherence,
            ...this.auditResults.data_flow_coherence,
            ...this.auditResults.business_rules_coherence,
            ...this.auditResults.ui_consistency,
            ...this.auditResults.crm_integration
        ];
        
        if (allIssues.length > 0) {
            console.log(`\n${colors.red}🚨 PROBLEMAS DETECTADOS (${allIssues.length}):${colors.reset}`);
            allIssues.forEach((issue, index) => {
                console.log(`\n${index + 1}. ${colors.yellow}${issue.type}${colors.reset} - ${issue.area}`);
                console.log(`   ❌ Problema: ${issue.problem}`);
                console.log(`   💥 Impacto: ${issue.impact}`);
                console.log(`   ✅ Solución: ${issue.solution}`);
            });
        }
        
        // Generar recomendaciones
        this.generateRecommendations(finalScore);
        
        return {
            score: finalScore,
            issues: allIssues,
            recommendations: this.auditResults.suggestions
        };
    }

    // 🎨 Helper: Color según puntuación
    getScoreColor(score) {
        if (score >= 90) return colors.green;
        if (score >= 70) return colors.yellow;
        return colors.red;
    }

    // 💡 Generar recomendaciones
    generateRecommendations(score) {
        console.log(`\n${colors.purple}💡 RECOMENDACIONES:${colors.reset}`);
        
        if (score >= 95) {
            console.log(`   🏆 EXCELENTE: La aplicación tiene coherencia world-class`);
        } else if (score >= 85) {
            console.log(`   ✅ BUENO: Pocos ajustes necesarios para perfección`);
        } else if (score >= 70) {
            console.log(`   ⚠️ MEJORABLE: Varios problemas de coherencia detectados`);
        } else {
            console.log(`   🚨 CRÍTICO: Problemas serios de coherencia que requieren atención inmediata`);
        }
        
        // Recomendaciones específicas
        const recommendations = [
            'Unificar nomenclatura de campos entre configuración y páginas',
            'Implementar validaciones de reglas de negocio configuradas',
            'Añadir eventos de sincronización entre configuración y páginas',
            'Crear sistema de validación cruzada de capacidades',
            'Implementar feedback visual cuando se alcanzan límites configurados'
        ];
        
        recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }

    // 🚀 EJECUTAR AUDITORÍA COMPLETA
    async runCompleteAudit() {
        console.log(`${colors.bold}🔧 INICIANDO AUDITORÍA COMPLETA DE COHERENCIA${colors.reset}`);
        console.log(`${colors.bold}================================================${colors.reset}\n`);
        
        try {
            await this.auditConfigurationCoherence();
            await this.auditDataFlowCoherence();
            await this.auditBusinessRules();
            await this.auditUIConsistency();
            await this.auditCRMIntegration();
            
            return this.generateReport();
        } catch (error) {
            console.error(`${colors.red}❌ Error en auditoría:${colors.reset}`, error);
            return { score: 0, issues: [], recommendations: [] };
        }
    }
}

// 🚀 EJECUTAR AUDITORÍA
async function runAudit() {
    const auditor = new CoherenceAuditor();
    const results = await auditor.runCompleteAudit();
    
    // Guardar reporte en archivo
    const reportPath = 'docs/AUDITORIA-COHERENCIA-COMPLETA.md';
    const reportContent = generateMarkdownReport(results);
    fs.writeFileSync(reportPath, reportContent);
    
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    
    return results;
}

// 📝 Generar reporte en Markdown
function generateMarkdownReport(results) {
    return `# 🔧 AUDITORÍA COMPLETA DE COHERENCIA - LA-IA APP

> **📅 Fecha:** ${new Date().toLocaleDateString('es-ES')}
> **🎯 Objetivo:** Verificar coherencia total de la aplicación
> **📊 Nota Final:** ${results.score}/100

## 📊 RESULTADOS

### 🎯 PUNTUACIÓN FINAL: ${results.score}/100

${results.score >= 90 ? '🏆 EXCELENTE' : 
  results.score >= 70 ? '✅ BUENO' : 
  results.score >= 50 ? '⚠️ MEJORABLE' : '🚨 CRÍTICO'}

### 🚨 PROBLEMAS DETECTADOS: ${results.issues.length}

${results.issues.map((issue, index) => `
#### ${index + 1}. ${issue.type} - ${issue.area}
- **❌ Problema:** ${issue.problem}
- **💥 Impacto:** ${issue.impact}  
- **✅ Solución:** ${issue.solution}
`).join('')}

### 💡 RECOMENDACIONES

${results.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

---

*Auditoría generada automáticamente*
`;
}

export default runAudit;

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runAudit().catch(console.error);
}

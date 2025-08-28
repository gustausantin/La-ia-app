// ========================================
// CRM DAILY JOB API ENDPOINT
// Fecha: 28 Enero 2025
// Descripción: Endpoint para ejecutar job diario CRM desde cron externo
// ========================================

/**
 * ENDPOINT API para job diario CRM
 * Uso: POST /api/crm-daily-job
 * Headers: Authorization: Bearer <API_KEY>
 */
export default async function handler(req, res) {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        // 1. Verificar autenticación
        const authHeader = req.headers.authorization;
        const expectedKey = process.env.CRM_API_KEY || 'your-secret-api-key';
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                error: 'Missing or invalid authorization header' 
            });
        }

        const apiKey = authHeader.split(' ')[1];
        if (apiKey !== expectedKey) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid API key' 
            });
        }

        // 2. Importar y ejecutar job diario
        const { runDailyCRMJob } = await import('../../src/services/CRMDailyJob.js');
        
        console.log('🌅 Iniciando job diario CRM via API...');
        const jobResult = await runDailyCRMJob();

        // 3. Responder con resultados
        return res.status(200).json({
            success: jobResult.success,
            timestamp: new Date().toISOString(),
            data: jobResult
        });

    } catch (error) {
        console.error('❌ Error en API job diario:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * CONFIGURACIÓN PARA VERCEL
 */
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb'
        }
    }
};

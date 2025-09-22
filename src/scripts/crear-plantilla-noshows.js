import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const TAVERTET_ID = '310e1734-381d-4fda-8806-7c338a28c6be';

async function crearPlantillasNoShows() {
    try {
        console.log('📝 Creando plantillas para prevención de no-shows...\n');
        
        // Plantilla principal para no-shows
        await supabase.from('message_templates').insert({
            restaurant_id: TAVERTET_ID,
            name: 'Prevención No-Show',
            category: 'noshow_prevention',
            content: 'Hola {{customer_name}}, te confirmamos tu reserva para HOY a las {{reservation_time}} en {{restaurant_name}}. Mesa para {{party_size}} personas. ¿Todo correcto? Responde SÍ para confirmar. ¡Te esperamos!',
            channel: 'whatsapp',
            is_active: true
        });
        
        // Plantilla para alto riesgo
        await supabase.from('message_templates').insert({
            restaurant_id: TAVERTET_ID,
            name: 'No-Show Alto Riesgo',
            category: 'noshow_prevention',
            content: '¡Hola {{customer_name}}! 👋 Queremos asegurarnos de que tienes tu reserva para hoy a las {{reservation_time}}. Es muy importante para nosotros. ¿Podrás venir? Responde SÍ o NO.',
            channel: 'whatsapp',
            is_active: true
        });
        
        // Plantilla de seguimiento
        await supabase.from('message_templates').insert({
            restaurant_id: TAVERTET_ID,
            name: 'Seguimiento No-Show',
            category: 'noshow_followup',
            content: 'Hola {{customer_name}}, esperamos que estés bien. Notamos que no pudiste venir a tu reserva de ayer. ¿Todo bien? Aquí tienes un 10% de descuento para tu próxima visita: VUELVE10',
            channel: 'whatsapp',
            is_active: true
        });
        
        console.log('✅ Plantillas de no-shows creadas');
        console.log('- Prevención No-Show (general)');
        console.log('- No-Show Alto Riesgo (urgente)');
        console.log('- Seguimiento No-Show (recuperación)');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Ejecutar
crearPlantillasNoShows();

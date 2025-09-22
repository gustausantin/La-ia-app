// Script de diagnóstico para problemas de email
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnosticarEmail() {
  console.log('🔍 DIAGNÓSTICO DE EMAIL - La-IA');
  console.log('=====================================');
  
  try {
    // 1. Verificar conexión a Supabase
    console.log('\n1️⃣ Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('restaurants')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.log('❌ Error de conexión:', testError.message);
      return;
    }
    console.log('✅ Conexión a Supabase OK');

    // 2. Probar creación de usuario de prueba
    console.log('\n2️⃣ Probando creación de usuario...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      email_confirm: false, // Requiere confirmación
      user_metadata: {
        test: true,
        created_at: new Date().toISOString()
      }
    });

    if (userError) {
      console.log('❌ Error creando usuario:', userError.message);
      console.log('Código de error:', userError.code);
      
      // Verificar si es problema de rate limit
      if (userError.code === 'over_email_send_rate_limit') {
        console.log('🚨 PROBLEMA IDENTIFICADO: Rate limit de emails');
        console.log('Soluciones:');
        console.log('- Esperar 1 hora antes de intentar de nuevo');
        console.log('- Configurar SMTP personalizado en Supabase');
        console.log('- Usar un proveedor de email externo');
      }
      return;
    }
    
    console.log('✅ Usuario creado:', userData.user.email);

    // 3. Intentar generar enlace de confirmación
    console.log('\n3️⃣ Generando enlace de confirmación...');
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      options: {
        redirectTo: 'https://la-ia-app.vercel.app/confirm'
      }
    });

    if (linkError) {
      console.log('❌ Error generando enlace:', linkError.message);
      console.log('Código de error:', linkError.code);
      
      if (linkError.code === 'over_email_send_rate_limit') {
        console.log('🚨 CONFIRMADO: Rate limit de emails activo');
      }
    } else {
      console.log('✅ Enlace generado correctamente');
      console.log('Enlace:', linkData.properties?.action_link || 'No disponible');
    }

    // 4. Intentar método alternativo - inviteUserByEmail
    console.log('\n4️⃣ Probando método alternativo (invite)...');
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      testEmail,
      {
        redirectTo: 'https://la-ia-app.vercel.app/confirm'
      }
    );

    if (inviteError) {
      console.log('❌ Error con invite:', inviteError.message);
    } else {
      console.log('✅ Invite enviado correctamente');
    }

    // 5. Limpiar usuario de prueba
    console.log('\n5️⃣ Limpiando usuario de prueba...');
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Usuario de prueba eliminado');

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 DIAGNÓSTICO COMPLETADO');
}

// Ejecutar diagnóstico
diagnosticarEmail().catch(console.error);

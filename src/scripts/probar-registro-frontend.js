// Script para probar el registro exactamente como lo hace el frontend
import { createClient } from '@supabase/supabase-js';

// Usar las mismas credenciales que el frontend
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';

// Cliente normal (como el frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probarRegistroFrontend() {
  console.log('🧪 PROBANDO REGISTRO COMO FRONTEND');
  console.log('=====================================');
  
  const testEmail = `frontend-test-${Date.now()}@example.com`;
  const testPassword = 'Kx9#mP2$vL8@qR5!nW3&';
  
  try {
    console.log('\n📧 Email de prueba:', testEmail);
    console.log('🔗 URL de confirmación: https://la-ia-app.vercel.app/confirm');
    
    // Simular exactamente lo que hace Login.jsx
    console.log('\n1️⃣ Ejecutando supabase.auth.signUp...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          restaurant_name: 'Restaurante de Prueba',
          phone: '+34666777888',
          city: 'Madrid',
          address: 'Calle Test 123',
          postal_code: '28001',
          cuisine_type: 'Mediterránea',
        },
        emailRedirectTo: 'https://la-ia-app.vercel.app/confirm',
      },
    });

    if (authError) {
      console.log('❌ Error en signUp:', authError.message);
      console.log('Código:', authError.code);
      
      if (authError.code === 'over_email_send_rate_limit') {
        console.log('🚨 RATE LIMIT DETECTADO');
        console.log('Esto significa que Supabase ha alcanzado el límite de emails por hora');
        console.log('Soluciones:');
        console.log('1. Esperar 1 hora');
        console.log('2. Configurar SMTP personalizado en Supabase Dashboard');
        console.log('3. Usar un proveedor de email externo');
      }
      
      return;
    }

    if (authData.user) {
      console.log('✅ Usuario creado exitosamente');
      console.log('ID:', authData.user.id);
      console.log('Email:', authData.user.email);
      console.log('Email confirmado:', authData.user.email_confirmed_at ? 'Sí' : 'No');
      
      if (authData.user.email_confirmed_at) {
        console.log('⚠️  Email ya confirmado - esto es raro para un registro nuevo');
      } else {
        console.log('📧 Email de confirmación debería haber sido enviado');
      }
      
      // Probar reenvío de confirmación
      console.log('\n2️⃣ Probando reenvío de confirmación...');
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: testEmail,
        options: {
          emailRedirectTo: 'https://la-ia-app.vercel.app/confirm',
        }
      });

      if (resendError) {
        console.log('❌ Error en reenvío:', resendError.message);
        console.log('Código:', resendError.code);
      } else {
        console.log('✅ Reenvío exitoso');
      }
      
    } else {
      console.log('⚠️  No se creó usuario pero tampoco hay error');
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 PRUEBA COMPLETADA');
  console.log('\n💡 RECOMENDACIONES:');
  console.log('1. Revisa tu carpeta de SPAM');
  console.log('2. Verifica que el email no esté en lista negra');
  console.log('3. Comprueba la configuración SMTP en Supabase Dashboard');
  console.log('4. Si persiste, configura un proveedor de email personalizado');
}

// Ejecutar prueba
probarRegistroFrontend().catch(console.error);

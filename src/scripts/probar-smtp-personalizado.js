// Script para probar el nuevo SMTP personalizado
import { createClient } from '@supabase/supabase-js';

// Usar las mismas credenciales que el frontend
const supabaseUrl = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function probarSMTPPersonalizado() {
  console.log('📧 PROBANDO SMTP PERSONALIZADO - La-IA');
  console.log('=====================================');
  console.log('SMTP: smtp.hostinger.com:465');
  console.log('From: noreply@la-ia.site');
  console.log('=====================================');
  
  // Usar tu email real para la prueba
  const testEmail = 'gustausantin@gmail.com'; // Tu email real
  const testPassword = 'Kx9#mP2$vL8@qR5!nW3&';
  
  try {
    console.log('\n📧 Email de prueba:', testEmail);
    console.log('🔗 URL de confirmación: https://la-ia-app.vercel.app/confirm');
    
    console.log('\n1️⃣ Ejecutando registro con SMTP personalizado...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          restaurant_name: 'Tavertet',
          phone: '+34666777888',
          city: 'Barcelona',
          address: 'Carrer de Tavertet 1',
          postal_code: '08500',
          cuisine_type: 'Catalana',
        },
        emailRedirectTo: 'https://la-ia-app.vercel.app/confirm',
      },
    });

    if (authError) {
      console.log('❌ Error en signUp:', authError.message);
      console.log('Código:', authError.code);
      
      if (authError.message.includes('already registered')) {
        console.log('✅ El usuario ya existe - esto es normal');
        console.log('Probando reenvío de confirmación...');
        
        // Probar reenvío
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: testEmail,
          options: {
            emailRedirectTo: 'https://la-ia-app.vercel.app/confirm',
          }
        });

        if (resendError) {
          console.log('❌ Error en reenvío:', resendError.message);
          
          if (resendError.code === 'over_email_send_rate_limit') {
            console.log('⏰ Rate limit activo - espera 60 segundos');
          }
        } else {
          console.log('✅ Email de confirmación reenviado exitosamente');
          console.log('📧 Revisa tu bandeja de entrada y spam');
        }
      }
      
      return;
    }

    if (authData.user) {
      console.log('✅ Usuario creado exitosamente');
      console.log('ID:', authData.user.id);
      console.log('Email:', authData.user.email);
      console.log('📧 Email de confirmación enviado con SMTP personalizado');
      console.log('📧 Revisa tu bandeja de entrada y spam');
    }

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 PRUEBA COMPLETADA');
  console.log('\n💡 PRÓXIMOS PASOS:');
  console.log('1. Revisa tu email (gustausantin@gmail.com)');
  console.log('2. Busca email de noreply@la-ia.site');
  console.log('3. Revisa carpeta de SPAM si no lo ves');
  console.log('4. El email debería llegar en 1-2 minutos');
}

// Ejecutar prueba
probarSMTPPersonalizado().catch(console.error);

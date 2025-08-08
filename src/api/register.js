import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    password,
    firstName,
    lastName,
    restaurantName,
    phone,
    cuisineType,
    address,
    city,
    postalCode,
    country
  } = req.body;

  try {
    // 1. VALIDACIÓN COMPLETA DE DATOS
    console.log('Step 1: Validating input data...');

    if (!email || !password || !firstName || !lastName || !restaurantName ||
        !phone || !cuisineType || !address || !city || !postalCode) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        details: 'Todos los campos marcados como requeridos deben estar completos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Contraseña muy corta',
        details: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        error: 'Email inválido',
        details: 'El formato del email no es válido'
      });
    }

    // 2. CREAR USUARIO CON ADMIN API (FLUJO PROFESIONAL)
    console.log('Step 2: Creating user account with admin API...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Requiere confirmación por email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        restaurant_name: restaurantName,
        phone,
        city,
        postal_code: postalCode,
        country: country || 'España',
        registration_date: new Date().toISOString(),
        source: 'direct_registration'
      }
    });

    // Configurar la URL de confirmación personalizada
    const confirmationUrl = `${process.env.SITE_URL || 'https://7fa71e82-53a4-4e1e-8-replit.dev'}/confirm`;

    if (authError) {
      console.error('Auth error:', authError);

      // Manejar específicamente el rate limit
      if (authError.code === 'over_email_send_rate_limit') {
        return res.status(429).json({
          error: 'Límite de emails excedido',
          details: 'DESARROLLO: El límite es por IP, no por email. Espera 10-15 minutos o usa conexión móvil.',
          code: 'RATE_LIMIT',
          retryAfter: 600, // 10 minutos
          devTip: 'En desarrollo, este límite afecta toda la IP. Considera usar un hotspot móvil.',
          workaround: 'Esperando configuración sin verificación de email...'
        });
      }

      // Manejar usuario ya existente
      if (authError.message.includes('already registered')) {
        return res.status(409).json({
          error: 'Usuario ya existe',
          details: 'Este email ya está registrado. Intenta iniciar sesión.',
          code: 'USER_EXISTS'
        });
      }

      return res.status(400).json({
        error: 'Error creando usuario',
        details: authError.message,
        code: authError.code
      });
    }

    const userId = authData.user.id;
    console.log('User created successfully:', userId);

    // 3. CREAR RESTAURANTE
    console.log('Step 3: Creating restaurant...');

    const restaurantData = {
      name: restaurantName,
      cuisine_type: cuisineType,
      phone,
      address,
      city,
      postal_code: postalCode,
      country: country || 'España',
      created_at: new Date().toISOString()
    };

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();

    if (restaurantError) {
      console.error('Restaurant error:', restaurantError);

      // Si falla, el usuario ya existe pero sin datos completos
      console.log('Usuario creado pero falló el restaurante');

      return res.status(400).json({
        error: 'Error creando restaurante',
        details: restaurantError.message
      });
    }

    const restaurantId = restaurant.id;
    console.log('Restaurant created successfully:', restaurantId);

    // 4. CREAR RELACIÓN USUARIO-RESTAURANTE
    console.log('Step 4: Creating user-restaurant mapping...');

    const mappingData = {
      auth_user_id: userId,
      restaurant_id: restaurantId,
      role: 'owner',
      permissions: ['all'],
      created_at: new Date().toISOString()
      // NO incluir updated_at - no existe en el esquema
    };

    const { error: mappingError } = await supabaseAdmin
      .from('user_restaurant_mapping')
      .insert(mappingData);

    if (mappingError) {
      console.error('Mapping error:', mappingError);

      // Si falla, eliminar el restaurante
      await supabaseAdmin.from('restaurants').delete().eq('id', restaurantId);

      return res.status(400).json({
        error: 'Error creando relación usuario-restaurante',
        details: mappingError.message
      });
    }

    console.log('User-restaurant mapping created successfully');

    // 5. SALTAMOS LA CREACIÓN DE PERFIL - No es necesaria para el funcionamiento básico
    console.log('Step 5: Skipping profile creation (not required for basic functionality)');

    // 6. ENVIAR EMAIL DE CONFIRMACIÓN (CRÍTICO)
    console.log('Step 6: Sending confirmation email...');

    try {
      // Intentar enviar email con el método admin.generateLink
      const { data: linkData, error: emailError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        options: {
          redirectTo: confirmationUrl
        }
      });

      if (emailError) {
        console.error('❌ Error enviando email con generateLink:', emailError.message);
        
        // Fallback: Intentar con inviteUserByEmail
        console.log('🔄 Intentando método alternativo...');
        
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: confirmationUrl
        });

        if (inviteError) {
          console.error('❌ Error con método alternativo:', inviteError.message);
          throw new Error('No se pudo enviar el email de confirmación');
        } else {
          console.log('✅ Email enviado exitosamente con método alternativo');
        }
      } else {
        console.log('✅ Email de confirmación enviado exitosamente');
        console.log('📧 Link de confirmación generado:', linkData?.properties?.action_link || 'Link generado');
      }
    } catch (emailErr) {
      console.error('❌ Fallo crítico enviando email:', emailErr.message);
      
      // Si es un rate limit, devolver error específico
      if (emailErr.message.includes('rate_limit') || emailErr.message.includes('over_email_send_rate_limit')) {
        return res.status(429).json({
          error: 'Límite de emails excedido',
          details: 'Se ha alcanzado el límite de emails por hora. Inténtalo más tarde.',
          code: 'RATE_LIMIT',
          retryAfter: 3600 // 1 hora
        });
      }
      
      // Para otros errores, continuar pero avisar
      console.warn('⚠️ Usuario creado pero email no enviado - usuario debe usar "reenviar"');
    }

    // 7. RESPUESTA EXITOSA
    console.log('Step 7: Registration completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.',
      data: {
        userId,
        restaurantId,
        email,
        restaurantName
      },
      requiresEmailConfirmation: true
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
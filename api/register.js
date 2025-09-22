import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://ktsqwvhqamedpmzkzjaz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Agregar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

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
    // Step 1: Validating input data

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
    // Step 2: Creating user account with admin API

    // TEMPORAL: Bypass de confirmación de email para evitar rate limits
    const bypassEmailConfirmation = true; // Cambiar a false cuando el SMTP funcione bien
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: bypassEmailConfirmation, // TEMPORAL: true = sin confirmación
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        restaurant_name: restaurantName,
        phone,
        city,
        postal_code: postalCode,
        country: country || 'España',
        registration_date: new Date().toISOString(),
        source: 'direct_registration',
        bypass_email_confirmation: bypassEmailConfirmation
      }
    });

    // Configurar la URL de confirmación personalizada
    const confirmationUrl = `${process.env.SITE_URL || 'https://la-ia-app.vercel.app'}/confirm`;

    if (authError) {
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
    // 3. CREAR RESTAURANTE
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
      // Si falla, el usuario ya existe pero sin datos completos
      return res.status(400).json({
        error: 'Error creando restaurante',
        details: restaurantError.message
      });
    }

    const restaurantId = restaurant.id;
    // 4. CREAR RELACIÓN USUARIO-RESTAURANTE
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
      // Si falla, eliminar el restaurante
      await supabaseAdmin.from('restaurants').delete().eq('id', restaurantId);

      return res.status(400).json({
        error: 'Error creando relación usuario-restaurante',
        details: mappingError.message
      });
    }
    // 5. SALTAMOS LA CREACIÓN DE PERFIL - No es necesaria para el funcionamiento básico
    // 6. ENVIAR EMAIL DE CONFIRMACIÓN (TEMPORAL: DESHABILITADO)
    if (!bypassEmailConfirmation) {
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
          // Fallback: Intentar con inviteUserByEmail
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: confirmationUrl
          });

          if (inviteError) {
            throw new Error('No se pudo enviar el email de confirmación');
          }
        }
      } catch (emailErr) {
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
      }
    }

    // 7. RESPUESTA EXITOSA
    const successMessage = bypassEmailConfirmation 
      ? 'Cuenta creada exitosamente. Puedes iniciar sesión inmediatamente.'
      : 'Cuenta creada exitosamente. Revisa tu email para confirmar tu cuenta.';
      
    return res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        userId,
        restaurantId,
        email,
        restaurantName
      },
      requiresEmailConfirmation: true
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
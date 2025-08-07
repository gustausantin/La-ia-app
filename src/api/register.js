import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the credentials from environment
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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

    // 2. CREAR USUARIO CON SIGNUP NORMAL
    console.log('Step 2: Creating user account...');

    // Configurar opciones para evitar verificación por email
    const signUpOptions = {
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName
        },
        emailRedirectTo: undefined // Desactivar redirect de email
      }
    };

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp(signUpOptions);

    if (authError) {
      console.error('Auth error:', authError);
      
      // Manejar específicamente el rate limit
      if (authError.code === 'over_email_send_rate_limit') {
        return res.status(429).json({
          error: 'Límite de emails excedido',
          details: 'Por favor espera unos minutos antes de intentar registrarte otra vez. Demasiados emails enviados.',
          code: 'RATE_LIMIT',
          retryAfter: 300 // 5 minutos
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
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

    // 4. CREAR PERFIL DE USUARIO
    console.log('Step 4: Creating user profile...');

    const userProfileData = {
      id: userId,
      full_name: `${firstName} ${lastName}`.trim(),
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(userProfileData);

    if (profileError) {
      console.error('Profile error:', profileError);

      // Si falla, eliminar solo el restaurante
      await supabaseAdmin.from('restaurants').delete().eq('id', restaurantId);

      return res.status(400).json({
        error: 'Error creando perfil',
        details: profileError.message
      });
    }

    console.log('User profile created successfully');

    // 5. RESPUESTA EXITOSA
    console.log('Step 5: Registration completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: {
        userId,
        restaurantId,
        email,
        restaurantName
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}
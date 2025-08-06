
import { supabase } from '../lib/supabase.js';

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
    country,
    website,
    description
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

    // 2. CREAR USUARIO SIN EMAIL DE CONFIRMACIÓN
    console.log('Step 2: Creating user account...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ← Importante: no confirmar email aún
      user_metadata: {
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ 
        error: 'Error creando usuario',
        details: authError.message 
      });
    }

    if (!authData.user) {
      return res.status(500).json({ 
        error: 'Error interno',
        details: 'No se pudo crear el usuario' 
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
      email,
      address,
      city,
      postal_code: postalCode,
      country: country || 'ES',
      website: website || null,
      description: description || null,
      timezone: 'Europe/Madrid',
      currency: 'EUR',
      language: 'es',
      settings: {
        notifications_enabled: true,
        agent_auto_responses: true,
        booking_confirmation: true
      }
    };

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();

    if (restaurantError) {
      console.error('Restaurant error:', restaurantError);
      
      // Si falla, eliminar el usuario creado
      await supabase.auth.admin.deleteUser(userId);
      
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

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(userProfileData);

    if (profileError) {
      console.error('Profile error:', profileError);
      
      // Si falla, eliminar usuario y restaurante
      await Promise.all([
        supabase.auth.admin.deleteUser(userId),
        supabase.from('restaurants').delete().eq('id', restaurantId)
      ]);
      
      return res.status(400).json({ 
        error: 'Error creando perfil',
        details: profileError.message 
      });
    }

    // 5. CREAR MAPEO USUARIO-RESTAURANTE
    console.log('Step 5: Creating user-restaurant mapping...');
    
    const mappingData = {
      auth_user_id: userId,
      restaurant_id: restaurantId,
      role: 'owner',
      permissions: {
        full_access: true,
        manage_restaurant: true,
        manage_users: true,
        manage_bookings: true,
        manage_agent: true,
        view_analytics: true
      },
      created_at: new Date().toISOString()
    };

    const { error: mappingError } = await supabase
      .from('user_restaurant_mapping')
      .insert(mappingData);

    if (mappingError) {
      console.error('Mapping error:', mappingError);
      
      // Si falla, limpiar todo
      await Promise.all([
        supabase.auth.admin.deleteUser(userId),
        supabase.from('restaurants').delete().eq('id', restaurantId),
        supabase.from('user_profiles').delete().eq('id', userId)
      ]);
      
      return res.status(400).json({ 
        error: 'Error creando mapeo usuario-restaurante',
        details: mappingError.message 
      });
    }

    // 6. INICIALIZAR ESTADO DEL AGENTE (OPCIONAL)
    console.log('Step 6: Initializing agent status...');
    
    try {
      const agentStatusData = {
        restaurant_id: restaurantId,
        is_active: false,
        channels_status: {
          whatsapp: false,
          vapi: false,
          email: false,
          instagram: false,
          facebook: false
        },
        created_at: new Date().toISOString()
      };

      await supabase.from('agent_status').insert(agentStatusData);
      console.log('Agent status initialized');
    } catch (agentError) {
      console.warn('Agent status initialization failed (non-critical):', agentError);
    }

    // 7. AHORA SÍ, ENVIAR EMAIL DE CONFIRMACIÓN
    console.log('Step 7: Sending confirmation email...');
    
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${req.headers.origin}/login`,
      data: {
        restaurant_id: restaurantId,
        full_name: `${firstName} ${lastName}`.trim()
      }
    });

    if (emailError) {
      console.error('Email error:', emailError);
      // No fallar aquí, la cuenta ya está creada correctamente
      console.warn('Email not sent, but account is created successfully');
    }

    // 8. RESPUESTA DE ÉXITO
    console.log('Registration completed successfully');
    
    return res.status(200).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: {
        userId,
        restaurantId,
        email,
        emailSent: !emailError
      }
    });

  } catch (error) {
    console.error('Unexpected error during registration:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

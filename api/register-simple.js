// Endpoint simplificado de registro para evitar problemas de JSON
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://ktsqwvhqamedpmzkzjaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 Iniciando registro simplificado...');
    
    const { email, password, restaurantName } = req.body;
    
    if (!email || !password || !restaurantName) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        details: 'Email, password y restaurantName son requeridos'
      });
    }

    console.log('📧 Creando usuario con email:', email);
    
    // Crear usuario con confirmación automática
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Sin confirmación de email
      user_metadata: {
        restaurant_name: restaurantName,
        registration_date: new Date().toISOString(),
        source: 'bypass_registration'
      }
    });

    if (authError) {
      console.log('❌ Error creando usuario:', authError.message);
      return res.status(400).json({
        error: 'Error creando usuario',
        details: authError.message
      });
    }

    console.log('✅ Usuario creado:', authData.user.id);

    // Crear restaurante básico
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: restaurantName,
        cuisine_type: 'General',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (restaurantError) {
      console.log('❌ Error creando restaurante:', restaurantError.message);
      return res.status(400).json({
        error: 'Error creando restaurante',
        details: restaurantError.message
      });
    }

    console.log('✅ Restaurante creado:', restaurant.id);

    // Crear relación usuario-restaurante
    const { error: mappingError } = await supabaseAdmin
      .from('user_restaurant_mapping')
      .insert({
        auth_user_id: authData.user.id,
        restaurant_id: restaurant.id,
        role: 'owner',
        permissions: ['all'],
        created_at: new Date().toISOString()
      });

    if (mappingError) {
      console.log('❌ Error creando relación:', mappingError.message);
      return res.status(400).json({
        error: 'Error creando relación usuario-restaurante',
        details: mappingError.message
      });
    }

    console.log('✅ Relación creada exitosamente');

    return res.status(200).json({
      success: true,
      message: 'Cuenta creada exitosamente. Puedes iniciar sesión inmediatamente.',
      data: {
        userId: authData.user.id,
        restaurantId: restaurant.id,
        email: authData.user.email,
        restaurantName: restaurant.name
      }
    });

  } catch (error) {
    console.log('❌ Error general:', error.message);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
}

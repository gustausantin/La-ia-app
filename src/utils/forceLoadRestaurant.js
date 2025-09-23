import { supabase } from "../lib/supabase";

/**
 * FUNCIÓN DE EMERGENCIA: Intenta cargar el restaurant de TODAS las formas posibles
 * Esta función prueba múltiples estrategias para recuperar los datos del restaurant
 */
export async function forceLoadRestaurant() {
    console.log("🚨 INICIANDO CARGA FORZADA DEL RESTAURANT");
    
    const results = {
        success: false,
        restaurant: null,
        method: null,
        attempts: []
    };

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        console.error("❌ No hay usuario autenticado:", authError);
        return results;
    }

    console.log("👤 Usuario:", user.email, user.id);

    // MÉTODO 1: Query simple al mapping
    try {
        console.log("📡 Método 1: Query simple al mapping...");
        const { data, error } = await supabase
            .from('user_restaurant_mapping')
            .select('restaurant_id')
            .eq('auth_user_id', user.id);
        
        results.attempts.push({
            method: 'mapping_simple',
            success: !error && data?.length > 0,
            data: data,
            error: error?.message
        });

        if (data && data[0]?.restaurant_id) {
            const { data: rest } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', data[0].restaurant_id)
                .single();
            
            if (rest) {
                results.success = true;
                results.restaurant = rest;
                results.method = 'mapping_simple';
                console.log("✅ Método 1 exitoso:", rest.name);
                return results;
            }
        }
    } catch (e) {
        console.log("⚠️ Método 1 falló:", e.message);
    }

    // MÉTODO 2: RPC
    try {
        console.log("📡 Método 2: RPC get_user_restaurant_info...");
        const { data, error } = await supabase
            .rpc('get_user_restaurant_info', { user_id: user.id });
        
        results.attempts.push({
            method: 'rpc',
            success: !error && !!data,
            data: data,
            error: error?.message
        });

        if (data?.restaurant_id) {
            results.success = true;
            results.restaurant = {
                id: data.restaurant_id,
                name: data.restaurant_name,
                email: data.email,
                phone: data.phone,
                city: data.city,
                plan: data.plan
            };
            results.method = 'rpc';
            console.log("✅ Método 2 exitoso:", data.restaurant_name);
            return results;
        }
    } catch (e) {
        console.log("⚠️ Método 2 falló:", e.message);
    }

    // MÉTODO 3: Buscar por email
    try {
        console.log("📡 Método 3: Buscar restaurant por email...");
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('email', user.email);
        
        results.attempts.push({
            method: 'email_search',
            success: !error && data?.length > 0,
            data: data,
            error: error?.message
        });

        if (data && data[0]) {
            results.success = true;
            results.restaurant = data[0];
            results.method = 'email_search';
            console.log("✅ Método 3 exitoso:", data[0].name);
            
            // Intentar crear el mapping
            await supabase
                .from('user_restaurant_mapping')
                .upsert({
                    auth_user_id: user.id,
                    restaurant_id: data[0].id,
                    role: 'owner'
                }, { onConflict: 'auth_user_id' });
            
            return results;
        }
    } catch (e) {
        console.log("⚠️ Método 3 falló:", e.message);
    }

    // MÉTODO 4: Query con join
    try {
        console.log("📡 Método 4: Query con join...");
        const { data, error } = await supabase
            .from('user_restaurant_mapping')
            .select(`
                restaurant_id,
                restaurants (
                    id,
                    name,
                    email,
                    phone,
                    city,
                    plan,
                    active
                )
            `)
            .eq('auth_user_id', user.id)
            .single();
        
        results.attempts.push({
            method: 'join_query',
            success: !error && !!data?.restaurants,
            data: data,
            error: error?.message
        });

        if (data?.restaurants) {
            results.success = true;
            results.restaurant = data.restaurants;
            results.method = 'join_query';
            console.log("✅ Método 4 exitoso:", data.restaurants.name);
            return results;
        }
    } catch (e) {
        console.log("⚠️ Método 4 falló:", e.message);
    }

    // MÉTODO 5: Obtener TODOS los restaurants y buscar manualmente
    try {
        console.log("📡 Método 5: Obtener todos los restaurants...");
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .limit(100);
        
        results.attempts.push({
            method: 'all_restaurants',
            success: !error,
            count: data?.length,
            error: error?.message
        });

        if (data && data.length > 0) {
            // Buscar si alguno coincide con el email del usuario
            const match = data.find(r => r.email === user.email);
            if (match) {
                results.success = true;
                results.restaurant = match;
                results.method = 'all_restaurants_email_match';
                console.log("✅ Método 5 exitoso (por email):", match.name);
                return results;
            }

            // Si solo hay un restaurant, asumir que es el del usuario
            if (data.length === 1) {
                results.success = true;
                results.restaurant = data[0];
                results.method = 'all_restaurants_single';
                console.log("✅ Método 5 exitoso (único restaurant):", data[0].name);
                
                // Crear el mapping
                await supabase
                    .from('user_restaurant_mapping')
                    .upsert({
                        auth_user_id: user.id,
                        restaurant_id: data[0].id,
                        role: 'owner'
                    }, { onConflict: 'auth_user_id' });
                
                return results;
            }
        }
    } catch (e) {
        console.log("⚠️ Método 5 falló:", e.message);
    }

    console.error("❌ TODOS LOS MÉTODOS FALLARON");
    console.log("📊 Resumen de intentos:", results.attempts);
    
    return results;
}

// Función auxiliar para crear el restaurant si no existe
export async function createRestaurantIfNeeded(userEmail) {
    console.log("🏗️ Intentando crear restaurant para:", userEmail);
    
    try {
        const { data, error } = await supabase
            .rpc('create_restaurant_securely', {
                restaurant_data: {
                    name: `Restaurante de ${userEmail.split('@')[0]}`,
                    email: userEmail,
                    phone: '+34 600 000 000',
                    city: 'Madrid',
                    plan: 'trial',
                    active: true
                },
                user_profile: {
                    email: userEmail,
                    full_name: userEmail.split('@')[0]
                }
            });
        
        if (!error && data) {
            console.log("✅ Restaurant creado exitosamente:", data);
            return data;
        } else {
            console.error("❌ Error creando restaurant:", error);
            return null;
        }
    } catch (e) {
        console.error("❌ Excepción creando restaurant:", e);
        return null;
    }
}

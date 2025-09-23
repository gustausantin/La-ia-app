import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";
import { forceLoadRestaurant, createRestaurantIfNeeded } from "../utils/forceLoadRestaurant";

export default function TestConnection() {
    const { user, restaurant, restaurantId, fetchRestaurantInfo } = useAuthContext();
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [forceLoadResult, setForceLoadResult] = useState(null);
    const [isForceLoading, setIsForceLoading] = useState(false);

    useEffect(() => {
        const runTests = async () => {
            const results = {};
            
            // 1. Test Auth Session
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                results.session = {
                    success: !error && !!session,
                    data: session ? { 
                        userId: session.user.id,
                        email: session.user.email 
                    } : null,
                    error: error?.message
                };
            } catch (e) {
                results.session = { success: false, error: e.message };
            }

            // 2. Test User Mapping
            if (results.session?.data?.userId) {
                try {
                    const { data, error } = await supabase
                        .from('user_restaurant_mapping')
                        .select('*')
                        .eq('auth_user_id', results.session.data.userId);
                    
                    results.userMapping = {
                        success: !error && data?.length > 0,
                        data: data,
                        error: error?.message
                    };
                } catch (e) {
                    results.userMapping = { success: false, error: e.message };
                }
            }

            // 3. Test Restaurant Direct
            if (results.userMapping?.data?.[0]?.restaurant_id) {
                try {
                    const { data, error } = await supabase
                        .from('restaurants')
                        .select('*')
                        .eq('id', results.userMapping.data[0].restaurant_id)
                        .single();
                    
                    results.restaurant = {
                        success: !error && !!data,
                        data: data,
                        error: error?.message
                    };
                } catch (e) {
                    results.restaurant = { success: false, error: e.message };
                }
            }

            // 4. Test RPC
            if (results.session?.data?.userId) {
                try {
                    const { data, error } = await supabase
                        .rpc('get_user_restaurant_info', { 
                            user_id: results.session.data.userId 
                        });
                    
                    results.rpc = {
                        success: !error && !!data,
                        data: data,
                        error: error?.message
                    };
                } catch (e) {
                    results.rpc = { success: false, error: e.message };
                }
            }

            // 5. Context Status
            results.context = {
                user: !!user,
                restaurant: !!restaurant,
                restaurantId: restaurantId
            };

            setTestResults(results);
            setLoading(false);
        };

        runTests();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-8">🔍 Probando Conexión...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-8">🔍 Diagnóstico de Conexión</h1>
                
                <div className="space-y-6">
                    {/* Auth Session */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-lg font-semibold mb-3">
                            1. Sesión de Autenticación {testResults.session?.success ? '✅' : '❌'}
                        </h2>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testResults.session, null, 2)}
                        </pre>
                    </div>

                    {/* User Mapping */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-lg font-semibold mb-3">
                            2. Mapeo Usuario-Restaurante {testResults.userMapping?.success ? '✅' : '❌'}
                        </h2>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testResults.userMapping, null, 2)}
                        </pre>
                    </div>

                    {/* Restaurant */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-lg font-semibold mb-3">
                            3. Datos del Restaurante {testResults.restaurant?.success ? '✅' : '❌'}
                        </h2>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testResults.restaurant, null, 2)}
                        </pre>
                    </div>

                    {/* RPC */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-lg font-semibold mb-3">
                            4. RPC get_user_restaurant_info {testResults.rpc?.success ? '✅' : '❌'}
                        </h2>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testResults.rpc, null, 2)}
                        </pre>
                    </div>

                    {/* Context */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-lg font-semibold mb-3">
                            5. Estado del Contexto {testResults.context?.restaurant ? '✅' : '❌'}
                        </h2>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                            {JSON.stringify(testResults.context, null, 2)}
                        </pre>
                    </div>

                    {/* Resumen */}
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <h2 className="text-lg font-semibold mb-3">📊 Resumen</h2>
                        <ul className="space-y-2">
                            <li>
                                <strong>Usuario autenticado:</strong> {testResults.session?.data?.email || 'No'}
                            </li>
                            <li>
                                <strong>Restaurant ID encontrado:</strong> {testResults.userMapping?.data?.[0]?.restaurant_id || 'No'}
                            </li>
                            <li>
                                <strong>Nombre del restaurante:</strong> {testResults.restaurant?.data?.name || 'No disponible'}
                            </li>
                            <li>
                                <strong>Contexto cargado:</strong> {testResults.context?.restaurant ? 'Sí' : 'No'}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        🔄 Recargar Página
                    </button>
                    <button
                        onClick={async () => {
                            setIsForceLoading(true);
                            const result = await forceLoadRestaurant();
                            setForceLoadResult(result);
                            setIsForceLoading(false);
                            
                            if (result.success && result.restaurant) {
                                // Recargar la página para aplicar cambios
                                setTimeout(() => {
                                    window.location.href = '/dashboard';
                                }, 1500);
                            }
                        }}
                        disabled={isForceLoading}
                        className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isForceLoading ? '⏳ Cargando...' : '🚨 FORZAR CARGA DEL RESTAURANT'}
                    </button>
                    <button
                        onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user?.email) {
                                const result = await createRestaurantIfNeeded(user.email);
                                if (result) {
                                    alert('Restaurant creado! Recargando...');
                                    window.location.reload();
                                }
                            }
                        }}
                        className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        ➕ CREAR RESTAURANT SI NO EXISTE
                    </button>
                </div>

                {/* Mostrar resultado de carga forzada */}
                {forceLoadResult && (
                    <div className={`mt-6 p-6 rounded-lg ${forceLoadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <h3 className="text-lg font-semibold mb-3">
                            {forceLoadResult.success ? '✅ Restaurant Cargado!' : '❌ No se pudo cargar'}
                        </h3>
                        {forceLoadResult.restaurant && (
                            <div className="text-sm">
                                <p><strong>Nombre:</strong> {forceLoadResult.restaurant.name}</p>
                                <p><strong>ID:</strong> {forceLoadResult.restaurant.id}</p>
                                <p><strong>Método:</strong> {forceLoadResult.method}</p>
                            </div>
                        )}
                        <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-gray-600">Ver detalles técnicos</summary>
                            <pre className="mt-2 bg-white p-3 rounded text-xs overflow-auto">
                                {JSON.stringify(forceLoadResult, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}

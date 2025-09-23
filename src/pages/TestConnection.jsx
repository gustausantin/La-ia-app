import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";

export default function TestConnection() {
    const { user, restaurant, restaurantId } = useAuthContext();
    const [testResults, setTestResults] = useState({});
    const [loading, setLoading] = useState(true);

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

                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    🔄 Recargar Página
                </button>
            </div>
        </div>
    );
}

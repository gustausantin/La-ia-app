// Dashboard.jsx - DASHBOARD REVOLUCIONARIO ENFOCADO EN VALOR - OPUS 4 & 5 INCLUDED
import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardRevolutionary from "../components/DashboardRevolutionary";
import { useAuthContext } from "../contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

// Componente principal del Dashboard Revolucionario
export default function Dashboard() {
    const { status, isAuthenticated, restaurant, restaurantId } = useAuthContext();
    const navigate = useNavigate();

    // Verificar autenticación
    if (status === 'loading') {
        return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
        </div>
    </div>
        );
    }

    if (!isAuthenticated) {
    return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Requerido</h2>
                    <p className="text-gray-600">Debes iniciar sesión para acceder al dashboard</p>
            </div>
        </div>
    );
}

    // Si no hay restaurant cargado, mostrar aviso y botón de diagnóstico
    if (!restaurant || !restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-red-100 rounded-full p-3">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                        Problema al cargar el restaurante
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        No se pudo cargar la información de tu restaurante. 
                        Por favor, intenta recargar la página o verificar tu configuración.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-purple-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-purple-700 transition-colors"
                        >
                            🔄 Recargar Página
                        </button>
                        <button
                            onClick={() => navigate('/configuracion')}
                            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-colors"
                        >
                            ⚙️ Ir a Configuración
                        </button>
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            <strong>Nota:</strong> Revisa la consola del navegador (F12) para ver 
                            mensajes de depuración que pueden ayudar a identificar el problema.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Renderizar Dashboard Revolucionario
    return <DashboardRevolutionary />;
}
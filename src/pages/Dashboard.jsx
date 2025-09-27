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

    // Si no hay restaurant cargado, mostrar spinner de carga
    if (!restaurant || !restaurantId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del restaurante...</p>
                </div>
            </div>
        );
    }

    // Renderizar Dashboard Revolucionario
    return <DashboardRevolutionary />;
}
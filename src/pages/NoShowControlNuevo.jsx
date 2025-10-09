// NoShowControlNuevo.jsx - Nueva página de control de No-Shows (EN CONSTRUCCIÓN)
import React from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NoShowControlNuevo() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard-nuevo')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver al Dashboard Nuevo
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                Control de No-Shows (Nuevo)
                            </h1>
                            <p className="text-gray-600">
                                🚧 Página en construcción
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
                    <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Página en Construcción
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Esta será la nueva página completa de control de No-Shows con:
                    </p>
                    <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
                        <li>✓ Sección educativa: ¿Qué es un no-show?</li>
                        <li>✓ Sistema predictivo explicado</li>
                        <li>✓ KPIs principales</li>
                        <li>✓ Tabla de reservas en riesgo</li>
                        <li>✓ Gráfico de tendencias 30 días</li>
                        <li>✓ Panel de configuración de automatización</li>
                    </ul>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={() => navigate('/dashboard-nuevo')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all"
                    >
                        Ir al Dashboard Nuevo
                    </button>
                    <button
                        onClick={() => navigate('/no-shows')}
                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                    >
                        Ver Página Original
                    </button>
                </div>
            </div>
        </div>
    );
}


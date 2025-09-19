// NoShowControl.jsx - Página completa de Control de No-Shows
import React from "react";
import { useNavigate } from "react-router-dom";
import NoShowManager from "../components/NoShowManager";
import { ArrowLeft } from "lucide-react";

export default function NoShowControl() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Volver al Dashboard</span>
                        </button>
                        
                        <div className="h-6 w-px bg-gray-300"></div>
                        
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Control Avanzado de No-Shows
                            </h1>
                            <p className="text-gray-600">
                                Sistema inteligente de prevención y análisis predictivo
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-7xl mx-auto p-6">
                <NoShowManager />
            </div>
        </div>
    );
}

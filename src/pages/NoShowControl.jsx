// NoShowControl.jsx - Página simple de control de no-shows
import React from "react";
import NoShowManager from "../components/NoShowManager";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NoShowControl() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header simple */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver al Dashboard
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Control de No-Shows
                            </h1>
                            <p className="text-gray-600">
                                Sistema predictivo y gestión de reservas de riesgo
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
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { BarChart3, Users, Calendar, MessageSquare, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { user, restaurant } = useAuthContext();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenido a La-IA
        </h1>
        <p className="text-gray-600">
          Tu asistente inteligente está listo para gestionar {restaurant?.name || 'tu restaurante'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-green-600 mt-2">+20% vs ayer</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversaciones</p>
              <p className="text-3xl font-bold text-gray-900">45</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-green-600 mt-2">+15% vs ayer</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-3xl font-bold text-gray-900">1,234</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-sm text-green-600 mt-2">+8% vs mes pasado</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-3xl font-bold text-gray-900">€2,450</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-sm text-green-600 mt-2">+25% vs ayer</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Nueva reserva para 4 personas - Mesa 12</span>
              <span className="text-xs text-gray-400">hace 5 min</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Cliente preguntó por menú sin gluten</span>
              <span className="text-xs text-gray-400">hace 12 min</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Reserva cancelada - Mesa 8</span>
              <span className="text-xs text-gray-400">hace 23 min</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Agente IA</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">Estado</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Activo</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conversaciones activas</span>
              <span className="text-sm font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tiempo de respuesta promedio</span>
              <span className="text-sm font-medium">1.2s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Satisfacción del cliente</span>
              <span className="text-sm font-medium">98%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
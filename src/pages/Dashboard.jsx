
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Phone,
  MessageSquare,
  Bot,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  console.log('📊 Dashboard component rendering...');
  
  const { user, restaurant, agentStatus, isAuthenticated, isReady } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayReservations: 12,
    totalCustomers: 89,
    todayRevenue: 1245,
    avgRating: 4.6
  });

  // Eliminar verificación problemática - el Layout ya maneja esto

  useEffect(() => {
    // Simular carga de datos - más rápido
    console.log('📊 Dashboard useEffect ejecutándose...');
    const timer = setTimeout(() => {
      console.log('📊 Dashboard carga completada');
      setLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  console.log('📊 Dashboard render state:', { loading, isReady, isAuthenticated });

  if (loading) {
    console.log('📊 Dashboard mostrando loading...');
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Bot className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('📊 Dashboard renderizando contenido principal...');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido de vuelta! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Aquí tienes un resumen de {restaurant?.name || 'tu restaurante'} hoy
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              agentStatus?.active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <Bot className="w-4 h-4 inline mr-1" />
              Agente IA {agentStatus?.active ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayReservations}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8%</span>
            <span className="text-gray-500 ml-1">esta semana</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.todayRevenue}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+15%</span>
            <span className="text-gray-500 ml-1">vs ayer</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valoración</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
            <span className="text-gray-500 ml-1">89 reseñas</span>
          </div>
        </div>
      </div>

      {/* Agent Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bot className="w-5 h-5 text-purple-600 mr-2" />
            Actividad del Agente IA
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Reserva confirmada</p>
                  <p className="text-sm text-gray-600">Mesa para 4 - 20:30</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">hace 5 min</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Consulta WhatsApp</p>
                  <p className="text-sm text-gray-600">Pregunta sobre menú</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">hace 12 min</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Llamada recibida</p>
                  <p className="text-sm text-gray-600">Modificación de reserva</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">hace 25 min</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Conversaciones activas</span>
              <span className="font-medium text-gray-900">{agentStatus?.activeConversations || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Acciones pendientes</span>
              <span className="font-medium text-orange-600">{agentStatus?.pendingActions || 0}</span>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            Horario de Hoy
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">19:00 - Mesa 5</p>
                <p className="text-sm text-gray-600">Familia González (4 personas)</p>
              </div>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Confirmada</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">19:30 - Mesa 2</p>
                <p className="text-sm text-gray-600">Sr. Martín (2 personas)</p>
              </div>
              <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pendiente</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">20:00 - Mesa 8</p>
                <p className="text-sm text-gray-600">Pareja López (2 personas)</p>
              </div>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Confirmada</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">20:30 - Mesa 12</p>
                <p className="text-sm text-gray-600">Cumpleaños Ana (6 personas)</p>
              </div>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">Especial</span>
            </div>
          </div>

          <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Ver todas las reservas
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Calendar className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Nueva Reserva</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Users className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Nuevo Cliente</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Bot className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Config. Agente</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <Activity className="w-6 h-6 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Ver Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Square, 
  Users, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

export default function Mesas() {
  console.log('🪑 Mesas component rendering...');

  const { restaurant } = useAuthContext();
  const [mesas] = useState([
    { id: 1, numero: 1, capacidad: 4, estado: 'libre', ocupada_hasta: null },
    { id: 2, numero: 2, capacidad: 2, estado: 'ocupada', ocupada_hasta: '20:30' },
    { id: 3, numero: 3, capacidad: 6, estado: 'reservada', ocupada_hasta: '19:00' },
    { id: 4, numero: 4, capacidad: 4, estado: 'libre', ocupada_hasta: null },
    { id: 5, numero: 5, capacidad: 8, estado: 'ocupada', ocupada_hasta: '21:00' },
    { id: 6, numero: 6, capacidad: 2, estado: 'libre', ocupada_hasta: null }
  ]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'libre': return 'bg-green-100 text-green-700 border-green-200';
      case 'ocupada': return 'bg-red-100 text-red-700 border-red-200';
      case 'reservada': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'libre': return <CheckCircle className="w-4 h-4" />;
      case 'ocupada': return <XCircle className="w-4 h-4" />;
      case 'reservada': return <Clock className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-600 mt-1">Gestiona la distribución y estado de las mesas</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nueva Mesa</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{mesas.length}</p>
            </div>
            <Square className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Libres</p>
              <p className="text-2xl font-bold text-green-600">{mesas.filter(m => m.estado === 'libre').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-red-600">{mesas.filter(m => m.estado === 'ocupada').length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
              <p className="text-2xl font-bold text-purple-600">{mesas.reduce((acc, mesa) => acc + mesa.capacidad, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Mesas Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución de Mesas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${getEstadoColor(mesa.estado)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getEstadoIcon(mesa.estado)}
                  <span className="font-medium">Mesa {mesa.numero}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-white rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-white rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Capacidad:</span>
                  <span className="font-medium">{mesa.capacidad} personas</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Estado:</span>
                  <span className="font-medium capitalize">{mesa.estado}</span>
                </div>

                {mesa.ocupada_hasta && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Hasta:</span>
                    <span className="font-medium">{mesa.ocupada_hasta}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
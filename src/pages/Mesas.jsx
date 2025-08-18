
import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Users, MapPin } from 'lucide-react';

export default function Mesas() {
  console.log('🪑 Mesas component rendering...');
  
  const [mesas] = useState([
    {
      id: 1,
      numero: 1,
      capacidad: 2,
      zona: 'Terraza',
      estado: 'libre',
      ubicacion: 'Ventana'
    },
    {
      id: 2,
      numero: 2,
      capacidad: 4,
      zona: 'Interior',
      estado: 'ocupada',
      ubicacion: 'Centro'
    },
    {
      id: 3,
      numero: 3,
      capacidad: 6,
      zona: 'Interior',
      estado: 'reservada',
      ubicacion: 'Esquina'
    },
    {
      id: 4,
      numero: 4,
      capacidad: 2,
      zona: 'Barra',
      estado: 'libre',
      ubicacion: 'Barra'
    },
    {
      id: 5,
      numero: 5,
      capacidad: 4,
      zona: 'Terraza',
      estado: 'ocupada',
      ubicacion: 'Exterior'
    },
    {
      id: 6,
      numero: 6,
      capacidad: 8,
      zona: 'Privado',
      estado: 'libre',
      ubicacion: 'Sala privada'
    }
  ]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-100 border-green-300 text-green-700';
      case 'ocupada':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'reservada':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'mantenimiento':
        return 'bg-gray-100 border-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'libre':
        return 'Libre';
      case 'ocupada':
        return 'Ocupada';
      case 'reservada':
        return 'Reservada';
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  const contarMesasPorEstado = (estado) => {
    return mesas.filter(mesa => mesa.estado === estado).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h1>
          <p className="text-gray-600 mt-1">Administra las mesas y su disponibilidad</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mesa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{mesas.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Libres</p>
              <p className="text-2xl font-bold text-green-600">{contarMesasPorEstado('libre')}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-red-600">{contarMesasPorEstado('ocupada')}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reservadas</p>
              <p className="text-2xl font-bold text-yellow-600">{contarMesasPorEstado('reservada')}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mesas Grid */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Layout del Restaurante</h2>
          <p className="text-gray-600">Vista general de todas las mesas</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${getEstadoColor(mesa.estado)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">Mesa {mesa.numero}</h3>
                <div className="flex space-x-1">
                  <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{mesa.capacidad} personas</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{mesa.zona}</span>
                </div>
                
                <div>
                  <span className="text-xs text-gray-600">{mesa.ubicacion}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                <span className="text-xs font-medium uppercase tracking-wide">
                  {getEstadoText(mesa.estado)}
                </span>
              </div>
              
              {/* Botones de acción según estado */}
              <div className="mt-3 flex space-x-2">
                {mesa.estado === 'libre' && (
                  <>
                    <button className="text-xs bg-white bg-opacity-80 hover:bg-opacity-100 px-2 py-1 rounded">
                      Ocupar
                    </button>
                    <button className="text-xs bg-white bg-opacity-80 hover:bg-opacity-100 px-2 py-1 rounded">
                      Reservar
                    </button>
                  </>
                )}
                
                {mesa.estado === 'ocupada' && (
                  <button className="text-xs bg-white bg-opacity-80 hover:bg-opacity-100 px-2 py-1 rounded">
                    Liberar
                  </button>
                )}
                
                {mesa.estado === 'reservada' && (
                  <>
                    <button className="text-xs bg-white bg-opacity-80 hover:bg-opacity-100 px-2 py-1 rounded">
                      Confirmar
                    </button>
                    <button className="text-xs bg-white bg-opacity-80 hover:bg-opacity-100 px-2 py-1 rounded">
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zones Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Interior', 'Terraza', 'Privado'].map((zona) => {
          const mesasZona = mesas.filter(mesa => mesa.zona === zona);
          return (
            <div key={zona} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{zona}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total mesas:</span>
                  <span className="font-medium">{mesasZona.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacidad total:</span>
                  <span className="font-medium">{mesasZona.reduce((total, mesa) => total + mesa.capacidad, 0)} personas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Disponibles:</span>
                  <span className="font-medium text-green-600">{mesasZona.filter(mesa => mesa.estado === 'libre').length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Grid, Users, Plus, Edit, Trash2 } from 'lucide-react';

export default function Mesas() {
  const { restaurant } = useAuthContext();
  const [mesas, setMesas] = useState([
    { id: 1, numero: 1, capacidad: 2, estado: 'libre', ubicacion: 'Terraza' },
    { id: 2, numero: 2, capacidad: 4, estado: 'ocupada', ubicacion: 'Interior' },
    { id: 3, numero: 3, capacidad: 6, estado: 'reservada', ubicacion: 'Interior' },
    { id: 4, numero: 4, capacidad: 2, estado: 'libre', ubicacion: 'Terraza' },
    { id: 5, numero: 5, capacidad: 8, estado: 'ocupada', ubicacion: 'Sala VIP' },
    { id: 6, numero: 6, capacidad: 4, estado: 'libre', ubicacion: 'Interior' },
  ]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-500';
      case 'ocupada':
        return 'bg-red-500';
      case 'reservada':
        return 'bg-yellow-500';
      case 'mantenimiento':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h1>
          <p className="text-gray-600">Administra las mesas de {restaurant?.name || 'tu restaurante'}</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nueva Mesa</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-600">Libres</p>
              <p className="text-2xl font-bold text-gray-900">
                {mesas.filter(m => m.estado === 'libre').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-600">Ocupadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {mesas.filter(m => m.estado === 'ocupada').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-sm text-gray-600">Reservadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {mesas.filter(m => m.estado === 'reservada').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Grid className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{mesas.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista de Mesas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Layout del Restaurante</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Libre</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Ocupada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Reservada</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                mesa.estado === 'libre' ? 'border-green-200 bg-green-50' :
                mesa.estado === 'ocupada' ? 'border-red-200 bg-red-50' :
                mesa.estado === 'reservada' ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">Mesa {mesa.numero}</span>
                <div className={`w-3 h-3 rounded-full ${getEstadoColor(mesa.estado)}`}></div>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{mesa.capacidad} personas</span>
                </div>
                <div>{mesa.ubicacion}</div>
                <div className="font-medium">{getEstadoText(mesa.estado)}</div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Mesas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Mesas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mesas.map((mesa) => (
                <tr key={mesa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Mesa {mesa.numero}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{mesa.capacidad} personas</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{mesa.ubicacion}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      mesa.estado === 'libre' ? 'bg-green-100 text-green-700' :
                      mesa.estado === 'ocupada' ? 'bg-red-100 text-red-700' :
                      mesa.estado === 'reservada' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${getEstadoColor(mesa.estado)}`}></div>
                      {getEstadoText(mesa.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">Editar</button>
                    <button className="text-red-600 hover:text-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

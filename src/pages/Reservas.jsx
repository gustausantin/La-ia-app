import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  Clock, 
  Search, 
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

export default function Reservas() {
  console.log('📅 Reservas component rendering...');

  const { user, restaurant } = useAuthContext();
  const [reservas] = useState([
    {
      id: 1,
      cliente: 'Familia González',
      personas: 4,
      fecha: '2024-01-18',
      hora: '19:00',
      mesa: 5,
      estado: 'confirmada',
      telefono: '600123456'
    },
    {
      id: 2,
      cliente: 'Sr. Martín',
      personas: 2,
      fecha: '2024-01-18',
      hora: '19:30',
      mesa: 2,
      estado: 'pendiente',
      telefono: '600789123'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600 mt-1">Gestiona todas las reservas del restaurante</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-green-600">10</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">2</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Personas</p>
              <p className="text-2xl font-bold text-purple-600">34</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente o teléfono..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reservas de Hoy</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{reserva.cliente}</h4>
                    <p className="text-sm text-gray-600">{reserva.telefono}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{reserva.personas} personas</p>
                    <p className="text-xs text-gray-500">Mesa {reserva.mesa}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{reserva.hora}</p>
                    <p className="text-xs text-gray-500">{reserva.fecha}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      reserva.estado === 'confirmada' 
                        ? 'bg-green-100 text-green-700'
                        : reserva.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {reserva.estado === 'confirmada' ? 'Confirmada' : 
                       reserva.estado === 'pendiente' ? 'Pendiente' : 'Cancelada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
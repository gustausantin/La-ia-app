
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Calendar, Clock, Users, Plus, Search, Filter } from 'lucide-react';

export default function Reservas() {
  const { restaurant } = useAuthContext();
  const [reservas, setReservas] = useState([
    {
      id: 1,
      cliente: 'María García',
      fecha: '2024-01-18',
      hora: '20:00',
      personas: 4,
      mesa: 12,
      estado: 'confirmada',
      telefono: '+34 666 123 456'
    },
    {
      id: 2,
      cliente: 'Juan Pérez',
      fecha: '2024-01-18',
      hora: '19:30',
      personas: 2,
      mesa: 8,
      estado: 'pendiente',
      telefono: '+34 666 789 012'
    },
    {
      id: 3,
      cliente: 'Ana Martínez',
      fecha: '2024-01-19',
      hora: '21:00',
      personas: 6,
      mesa: 15,
      estado: 'confirmada',
      telefono: '+34 666 345 678'
    }
  ]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'confirmada':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelada':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600">Gestiona las reservas de {restaurant?.name || 'tu restaurante'}</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Todas las fechas</option>
              <option>Hoy</option>
              <option>Mañana</option>
              <option>Esta semana</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Todos los estados</option>
              <option>Confirmadas</option>
              <option>Pendientes</option>
              <option>Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Confirmadas</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total personas</p>
              <p className="text-2xl font-bold text-gray-900">48</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservas List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Reservas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservas.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{reserva.cliente}</div>
                      <div className="text-sm text-gray-500">{reserva.telefono}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{reserva.fecha}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{reserva.hora}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{reserva.personas}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">Mesa {reserva.mesa}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(reserva.estado)}`}>
                      {reserva.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">Editar</button>
                    <button className="text-red-600 hover:text-red-800">Cancelar</button>
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

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Users, Search, Plus, Mail, Phone, Calendar } from 'lucide-react';

export default function Clientes() {
  const { restaurant } = useAuthContext();
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: 'María García',
      email: 'maria.garcia@email.com',
      telefono: '+34 666 123 456',
      ultimaVisita: '2024-01-15',
      totalReservas: 12,
      gastoProm: 45.50
    },
    {
      id: 2,
      nombre: 'Juan Pérez',
      email: 'juan.perez@email.com',
      telefono: '+34 666 789 012',
      ultimaVisita: '2024-01-10',
      totalReservas: 8,
      gastoProm: 38.20
    },
    {
      id: 3,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      telefono: '+34 666 345 678',
      ultimaVisita: '2024-01-18',
      totalReservas: 15,
      gastoProm: 52.30
    },
    {
      id: 4,
      nombre: 'Carlos López',
      email: 'carlos.lopez@email.com',
      telefono: '+34 666 456 789',
      ultimaVisita: '2024-01-12',
      totalReservas: 5,
      gastoProm: 41.80
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra la base de datos de clientes de {restaurant?.name || 'tu restaurante'}</p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Nuevos este mes</p>
              <p className="text-2xl font-bold text-gray-900">23</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Clientes VIP</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Gasto Promedio</p>
              <p className="text-2xl font-bold text-gray-900">€44.45</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Todos los clientes</option>
              <option>Clientes VIP</option>
              <option>Nuevos clientes</option>
              <option>Clientes frecuentes</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Ordenar por nombre</option>
              <option>Ordenar por última visita</option>
              <option>Ordenar por total reservas</option>
              <option>Ordenar por gasto promedio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Visita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gasto Prom.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                        {cliente.totalReservas > 10 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gold-100 text-yellow-700">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{cliente.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{cliente.telefono}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{cliente.ultimaVisita}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{cliente.totalReservas}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">€{cliente.gastoProm}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">Ver</button>
                    <button className="text-green-600 hover:text-green-800">Editar</button>
                    <button className="text-purple-600 hover:text-purple-800">Historial</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h4>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Exportar lista de clientes
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Enviar newsletter
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Análisis de comportamiento
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Segmentación</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Clientes frecuentes (>5 visitas)</span>
              <span className="font-medium">67%</span>
            </div>
            <div className="flex justify-between">
              <span>Clientes ocasionales (2-5 visitas)</span>
              <span className="font-medium">28%</span>
            </div>
            <div className="flex justify-between">
              <span>Clientes únicos (1 visita)</span>
              <span className="font-medium">5%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Próximos Cumpleaños</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span>María García</span>
              <span className="text-purple-600">22 Ene</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Ana Martínez</span>
              <span className="text-purple-600">25 Ene</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Carlos López</span>
              <span className="text-purple-600">28 Ene</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Star,
  Edit,
  Trash2
} from 'lucide-react';

export default function Clientes() {
  console.log('👥 Clientes component rendering...');
  
  const { restaurant } = useAuthContext();
  const [clientes] = useState([
    {
      id: 1,
      nombre: 'Ana González',
      email: 'ana@email.com',
      telefono: '600123456',
      visitas: 8,
      ultimaVisita: '2024-01-15',
      valorTotal: 450,
      tipo: 'frecuente'
    },
    {
      id: 2,
      nombre: 'Carlos Martín',
      email: 'carlos@email.com',
      telefono: '600789123',
      visitas: 3,
      ultimaVisita: '2024-01-10',
      valorTotal: 180,
      tipo: 'regular'
    }
  ]);

  const clientesFrecuentes = clientes.filter(c => c.visitas > 5).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona tu base de datos de clientes</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-1">este mes</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Frecuentes</p>
              <p className="text-2xl font-bold text-green-600">{clientesFrecuentes}</p>
            </div>
            <Star className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Más de 5 visitas</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
              <p className="text-2xl font-bold text-purple-600">€45</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Por visita</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nuevos este mes</p>
              <p className="text-2xl font-bold text-yellow-600">8</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+25%</span>
            <span className="text-gray-500 ml-1">vs mes anterior</span>
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
                placeholder="Buscar cliente por nombre, email o teléfono..."
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

      {/* Clients List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-lg">
                        {cliente.nombre.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{cliente.nombre}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-1" />
                        <span className="text-sm">{cliente.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        <span className="text-sm">{cliente.telefono}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{cliente.visitas}</p>
                    <p className="text-xs text-gray-500">visitas</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">€{cliente.valorTotal}</p>
                    <p className="text-xs text-gray-500">valor total</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{cliente.ultimaVisita}</p>
                    <p className="text-xs text-gray-500">última visita</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cliente.tipo === 'frecuente' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {cliente.tipo === 'frecuente' ? 'Frecuente' : 'Regular'}
                    </span>
                    
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
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


import React, { useState } from 'react';
import { Users, Phone, Mail, Calendar, Star, TrendingUp, UserPlus } from 'lucide-react';

export default function Clientes() {
  console.log('👥 Clientes component rendering...');
  
  const [clientes] = useState([
    {
      id: 1,
      nombre: 'María González',
      email: 'maria@email.com',
      telefono: '+34 666 777 888',
      ultimaVisita: '2024-01-15',
      totalVisitas: 12,
      gastoTotal: 1240,
      valoracion: 4.8,
      preferencias: 'Mesa terraza, sin picante'
    },
    {
      id: 2,
      nombre: 'Carlos Martín',
      email: 'carlos@email.com',
      telefono: '+34 555 444 333',
      ultimaVisita: '2024-01-10',
      totalVisitas: 8,
      gastoTotal: 890,
      valoracion: 4.5,
      preferencias: 'Vegetariano, mesa interior'
    },
    {
      id: 3,
      nombre: 'Ana López',
      email: 'ana@email.com',
      telefono: '+34 777 888 999',
      ultimaVisita: '2024-01-18',
      totalVisitas: 15,
      gastoTotal: 2100,
      valoracion: 4.9,
      preferencias: 'Vino tinto, postres sin azúcar'
    }
  ]);

  const clientesFrecuentes = clientes.filter(cliente => cliente.totalVisitas > 5).length;
  const clientesNuevos = clientes.filter(cliente => cliente.totalVisitas <= 2).length;
  const gastoPromedio = clientes.reduce((total, cliente) => total + cliente.gastoTotal, 0) / clientes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">Administra la información de tus clientes</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Cliente
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
              <p className="text-sm font-medium text-gray-600">Clientes Nuevos</p>
              <p className="text-2xl font-bold text-purple-600">{clientesNuevos}</p>
            </div>
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Este mes</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gasto Promedio</p>
              <p className="text-2xl font-bold text-yellow-600">€{Math.round(gastoPromedio)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span>Por cliente</span>
          </div>
        </div>
      </div>

      {/* Clientes List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {cliente.nombre.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{cliente.nombre}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {cliente.telefono}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Última visita:</span>
                      <p className="font-medium text-gray-900">{cliente.ultimaVisita}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total visitas:</span>
                      <p className="font-medium text-gray-900">{cliente.totalVisitas}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Gasto total:</span>
                      <p className="font-medium text-gray-900">€{cliente.gastoTotal}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valoración:</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <p className="font-medium text-gray-900">{cliente.valoracion}</p>
                      </div>
                    </div>
                  </div>
                  
                  {cliente.preferencias && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">Preferencias:</span>
                      <p className="text-sm text-gray-700 italic">{cliente.preferencias}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                    Editar
                  </button>
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium px-3 py-1 border border-green-600 rounded hover:bg-green-50 transition-colors">
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentación</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Clientes frecuentes (&gt;5 visitas)</span>
              <span className="font-medium">67%</span>
            </div>
            <div className="flex justify-between">
              <span>Clientes ocasionales (2-5 visitas)</span>
              <span className="font-medium">23%</span>
            </div>
            <div className="flex justify-between">
              <span>Clientes nuevos (1 visita)</span>
              <span className="font-medium">10%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Clave</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Retención de clientes</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Satisfacción promedio</span>
                <span className="font-medium">4.7/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Crecimiento mensual</span>
                <span className="font-medium text-green-600">+12%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

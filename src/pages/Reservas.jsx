
import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function Reservas() {
  console.log('📅 Reservas component rendering...');
  
  const [reservas] = useState([
    {
      id: 1,
      cliente: 'María González',
      fecha: '2024-01-18',
      hora: '19:00',
      personas: 4,
      mesa: 5,
      telefono: '+34 666 777 888',
      email: 'maria@email.com',
      estado: 'confirmada',
      notas: 'Cumpleaños, necesita tarta'
    },
    {
      id: 2,
      cliente: 'Carlos Martín',
      fecha: '2024-01-18',
      hora: '19:30',
      personas: 2,
      mesa: 2,
      telefono: '+34 555 444 333',
      email: 'carlos@email.com',
      estado: 'pendiente',
      notas: ''
    },
    {
      id: 3,
      cliente: 'Ana López',
      fecha: '2024-01-18',
      hora: '20:00',
      personas: 6,
      mesa: 8,
      telefono: '+34 777 888 999',
      email: 'ana@email.com',
      estado: 'confirmada',
      notas: 'Cena de empresa'
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

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'confirmada':
        return <CheckCircle className="w-4 h-4" />;
      case 'pendiente':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600 mt-1">Gestiona las reservas de tu restaurante</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Nueva Reserva
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
              <p className="text-2xl font-bold text-purple-600">48</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Reservas List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Reservas de Hoy</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{reserva.cliente}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {reserva.hora}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {reserva.personas} personas
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Mesa {reserva.mesa}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {reserva.telefono}
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {reserva.email}
                    </div>
                  </div>
                  
                  {reserva.notas && (
                    <p className="mt-2 text-sm text-gray-600 italic">
                      Nota: {reserva.notas}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(reserva.estado)}`}>
                    {getEstadoIcon(reserva.estado)}
                    <span className="ml-1 capitalize">{reserva.estado}</span>
                  </span>
                  
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Editar
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Cancelar
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

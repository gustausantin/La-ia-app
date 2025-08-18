
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const Calendario = () => {
  const { restaurantInfo } = useAuthContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Funciones de navegación
  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Cargar reservas
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReservations([
        {
          id: 1,
          fecha: new Date(2025, 0, 20),
          cliente: 'Juan Pérez',
          personas: 4,
          hora: '20:00',
          estado: 'confirmada'
        },
        {
          id: 2,
          fecha: new Date(2025, 0, 22),
          cliente: 'María García',
          personas: 2,
          hora: '19:30',
          estado: 'pendiente'
        },
        {
          id: 3,
          fecha: selectedDate,
          cliente: 'Carlos López',
          personas: 6,
          hora: '21:00',
          estado: 'confirmada'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [currentDate, selectedDate]);

  // Obtener reservas para una fecha específica
  const getReservationsForDate = (date) => {
    return reservations.filter(reservation =>
      isSameDay(reservation.fecha, date)
    );
  };

  // Obtener reservas del día seleccionado
  const selectedDateReservations = getReservationsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Calendario de Reservas</h1>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Nueva Reserva
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, index) => {
                  const dayReservations = getReservationsForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        p-3 text-sm border rounded-lg transition-all
                        ${isSelected 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                        ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                        ${dayReservations.length > 0 ? 'ring-2 ring-blue-200' : ''}
                      `}
                    >
                      <div className="font-medium">{format(day, 'd')}</div>
                      {dayReservations.length > 0 && (
                        <div className="text-xs mt-1">
                          {dayReservations.length} reserva{dayReservations.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando reservas...</p>
                </div>
              ) : selectedDateReservations.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateReservations.map((reservation) => (
                    <div key={reservation.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{reservation.cliente}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          reservation.estado === 'confirmada' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reservation.estado}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {reservation.hora}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {reservation.personas} personas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay reservas para este día</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del mes</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total reservas</span>
                  <span className="font-semibold text-gray-900">{reservations.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Confirmadas</span>
                  <span className="font-semibold text-green-600">
                    {reservations.filter(r => r.estado === 'confirmada').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pendientes</span>
                  <span className="font-semibold text-yellow-600">
                    {reservations.filter(r => r.estado === 'pendiente').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendario;

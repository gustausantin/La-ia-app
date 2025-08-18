
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

function Calendario() {
  const { restaurant, restaurantId } = useAuthContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generar días del mes
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

  // Cargar reservas (simulado por ahora)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReservations([
        {
          id: 1,
          date: new Date(),
          time: '19:00',
          customerName: 'Juan Pérez',
          guests: 4,
          table: 'Mesa 5'
        },
        {
          id: 2,
          date: new Date(),
          time: '20:30',
          customerName: 'María García',
          guests: 2,
          table: 'Mesa 3'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [currentDate, restaurantId]);

  // Obtener reservas para una fecha específica
  const getReservationsForDate = (date) => {
    return reservations.filter(reservation => 
      isSameDay(new Date(reservation.date), date)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
                <p className="text-gray-600">Gestión de reservas por fecha</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4" />
                Nueva Reserva
              </button>
            </div>
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
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
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
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-3 h-20 text-left rounded-lg border transition-all
                        ${isSelected 
                          ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-500' 
                          : 'border-gray-100 hover:bg-gray-50'
                        }
                        ${!isSameMonth(day, currentDate) ? 'text-gray-300' : 'text-gray-900'}
                        ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                      `}
                    >
                      <div className="text-sm font-medium">
                        {format(day, 'd')}
                      </div>
                      
                      {dayReservations.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="text-xs text-purple-600 font-medium">
                            {dayReservations.length} reserva{dayReservations.length > 1 ? 's' : ''}
                          </div>
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
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {getReservationsForDate(selectedDate).map((reservation) => (
                    <div key={reservation.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {reservation.customerName}
                        </span>
                        <span className="text-sm text-gray-600">
                          {reservation.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {reservation.guests}
                        </div>
                        <div>
                          {reservation.table}
                        </div>
                      </div>
                    </div>
                  ))}

                  {getReservationsForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay reservas para esta fecha</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del mes</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total reservas</span>
                  <span className="font-semibold text-gray-900">
                    {reservations.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Días con reservas</span>
                  <span className="font-semibold text-gray-900">
                    {new Set(reservations.map(r => format(new Date(r.date), 'yyyy-MM-dd'))).size}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Promedio por día</span>
                  <span className="font-semibold text-gray-900">
                    {(reservations.length / monthDays.length).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendario;

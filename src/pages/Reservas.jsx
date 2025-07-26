import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'

export default function Reservas() {
  const { restaurant } = useAuthContext()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (restaurant?.id) {
      fetchReservations()
    }
  }, [restaurant, selectedDate])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('date', selectedDate)
        .order('time', { ascending: true })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-800 border-green-200'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelada': return 'bg-red-100 text-red-800 border-red-200'
      case 'completada': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp': return '💬'
      case 'telefono': return '📞'
      case 'web': return '🌐'
      case 'presencial': return '🏪'
      default: return '📋'
    }
  }

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId)

      if (error) throw error
      fetchReservations() // Refresh data
    } catch (error) {
      console.error('Error updating reservation:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600">Gestiona las reservas de tu restaurante</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Nueva Reserva
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{reservations.length}</p>
            <p className="text-sm text-gray-600">Total Reservas</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {reservations.filter(r => r.status === 'confirmada').length}
            </p>
            <p className="text-sm text-gray-600">Confirmadas</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {reservations.filter(r => r.status === 'pendiente').length}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {reservations.filter(r => r.status === 'cancelada').length}
            </p>
            <p className="text-sm text-gray-600">Canceladas</p>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Reservas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        <div className="p-6">
          {reservations.length > 0 ? (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getChannelIcon(reservation.channel)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{reservation.customer_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>⏰ {reservation.time}</span>
                          <span>👥 {reservation.party_size} personas</span>
                          {reservation.table_number && <span>🪑 Mesa {reservation.table_number}</span>}
                          {reservation.customer_phone && <span>📞 {reservation.customer_phone}</span>}
                        </div>
                        {reservation.special_requests && (
                          <p className="text-sm text-gray-500 mt-1">💭 {reservation.special_requests}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                      <div className="flex space-x-1">
                        {reservation.status === 'pendiente' && (
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'confirmada')}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                          >
                            ✓ Confirmar
                          </button>
                        )}
                        {reservation.status === 'confirmada' && (
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'completada')}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                          >
                            ✓ Completar
                          </button>
                        )}
                        {(reservation.status === 'pendiente' || reservation.status === 'confirmada') && (
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'cancelada')}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            ✗ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas para esta fecha</h3>
              <p className="text-gray-500 mb-4">Selecciona otra fecha o crea una nueva reserva</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Crear Primera Reserva
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
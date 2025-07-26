import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { restaurant } = useAuth()
  const [stats, setStats] = useState({
    todayReservations: 0,
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0,
    totalCustomers: 0,
    todayRevenue: 0,
    upcomingReservations: [],
    recentReservations: [],
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (restaurant?.id) {
      fetchDashboardData()
    }
  }, [restaurant])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      const [reservationsResult, tablesResult, customersResult] = await Promise.all([
        supabase.from('reservations').select('*').eq('restaurant_id', restaurant.id).eq('date', today),
        supabase.from('tables').select('*').eq('restaurant_id', restaurant.id),
        supabase.from('customers').select('id').eq('restaurant_id', restaurant.id)
      ])

      const todayReservations = reservationsResult.data || []
      const tables = tablesResult.data || []
      const customers = customersResult.data || []

      const confirmedReservations = todayReservations.filter(r => r.status === 'confirmada')
      const occupiedTables = tables.filter(t => t.status === 'occupied').length
      const availableTables = tables.filter(t => t.status === 'available').length
      const occupancyRate = tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0

      const upcomingReservations = confirmedReservations
        .filter(r => {
          if (!r.time) return false
          const [hours, minutes] = r.time.split(':').map(Number)
          const reservationTime = new Date(now)
          reservationTime.setHours(hours, minutes, 0, 0)
          return reservationTime >= now && reservationTime <= twoHoursLater
        })
        .slice(0, 5)

      const recentReservations = todayReservations
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6)

      const todayRevenue = confirmedReservations.length * 45

      setStats({
        todayReservations: confirmedReservations.length,
        totalTables: tables.length,
        occupiedTables,
        availableTables,
        totalCustomers: customers.length,
        todayRevenue,
        upcomingReservations,
        recentReservations,
        occupancyRate
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      case 'completada': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen de {restaurant?.name || 'tu restaurante'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última actualización</p>
          <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">RESERVAS HOY</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayReservations}</p>
              <p className="text-sm text-blue-600">{stats.occupancyRate}% ocupación</p>
            </div>
            <div className="text-blue-500">📅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MESAS</p>
              <p className="text-3xl font-bold text-gray-900">{stats.availableTables}</p>
              <p className="text-sm text-green-600">{stats.occupiedTables} ocupadas</p>
            </div>
            <div className="text-green-500">🪑</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CLIENTES</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              <p className="text-sm text-purple-600">Base de datos</p>
            </div>
            <div className="text-purple-500">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">INGRESOS HOY</p>
              <p className="text-3xl font-bold text-gray-900">€{stats.todayRevenue}</p>
              <p className="text-sm text-orange-600">Estimado</p>
            </div>
            <div className="text-orange-500">💰</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Próximas Reservas (2h)</h3>
            <p className="text-sm text-gray-600">Reservas confirmadas para las próximas 2 horas</p>
          </div>
          <div className="p-6">
            {stats.upcomingReservations.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getChannelIcon(reservation.channel)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{reservation.customer_name}</p>
                        <p className="text-sm text-gray-600">{reservation.time} • {reservation.party_size} personas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                      {reservation.table_number && (
                        <p className="text-sm text-gray-500 mt-1">Mesa {reservation.table_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⏰</div>
                <p className="text-gray-500">No hay reservas próximas</p>
                <p className="text-sm text-gray-400">Las reservas de las próximas 2 horas aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <p className="text-sm text-gray-600">Últimas reservas del día</p>
          </div>
          <div className="p-6">
            {stats.recentReservations.length > 0 ? (
              <div className="space-y-4">
                {stats.recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">{getChannelIcon(reservation.channel)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{reservation.customer_name}</p>
                        <p className="text-sm text-gray-600">{reservation.time} • {reservation.party_size} personas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">No hay reservas hoy</p>
                <p className="text-sm text-gray-400">Las reservas del día aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <span className="text-xl">➕</span>
            <span className="font-medium text-blue-700">Nueva Reserva</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <span className="text-xl">👥</span>
            <span className="font-medium text-green-700">Ver Clientes</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <span className="text-xl">🪑</span>
            <span className="font-medium text-purple-700">Gestionar Mesas</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <span className="text-xl">📊</span>
            <span className="font-medium text-orange-700">Ver Analytics</span>
          </button>
        </div>
      </div>
    </div>
  )
}
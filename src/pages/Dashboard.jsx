import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { restaurant, user } = useAuthContext()
  const [stats, setStats] = useState({
    reservasHoy: 0,
    mesasOcupadas: 0,
    clientesTotal: 0,
    ingresosDia: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (restaurant) {
      fetchDashboardData()
    }
  }, [restaurant])

  const fetchDashboardData = async () => {
    try {
      // Por ahora datos simulados - después conectaremos con Supabase real
      setStats({
        reservasHoy: 12,
        mesasOcupadas: 8,
        clientesTotal: 156,
        ingresosDia: 2450
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de {restaurant?.name}</p>
        <p className="text-sm text-gray-500">Última actualización: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Reservas Hoy
              </h3>
              <p className="text-3xl font-bold text-gray-900">{stats.reservasHoy}</p>
              <p className="text-sm text-red-600">0% ocupación</p>
            </div>
            <div className="text-red-500 text-3xl">
              📅
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Mesas
              </h3>
              <p className="text-3xl font-bold text-gray-900">{stats.mesasOcupadas}</p>
              <p className="text-sm text-green-600">0 ocupadas</p>
            </div>
            <div className="text-green-500 text-3xl">
              🪑
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Clientes
              </h3>
              <p className="text-3xl font-bold text-gray-900">{stats.clientesTotal}</p>
              <p className="text-sm text-blue-600">Base de datos</p>
            </div>
            <div className="text-blue-500 text-3xl">
              👥
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Ingresos Hoy
              </h3>
              <p className="text-3xl font-bold text-gray-900">€{stats.ingresosDia}</p>
              <p className="text-sm text-yellow-600">Estimado</p>
            </div>
            <div className="text-yellow-500 text-3xl">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Próximas reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Próximas Reservas (2h)</h3>
          <p className="text-gray-500">Reservas confirmadas para las próximas 2 horas</p>
          <div className="mt-4 text-center py-8">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-500">No hay reservas próximas</p>
            <p className="text-sm text-gray-400">Las reservas de las próximas 2 horas aparecerán aquí</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <p className="text-gray-500">Últimas reservas del día</p>
          <div className="mt-4 text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">Sin actividad reciente</p>
            <p className="text-sm text-gray-400">La actividad del día aparecerá aquí</p>
          </div>
        </div>
      </div>
    </div>
  )
}
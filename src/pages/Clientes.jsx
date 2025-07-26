import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Clientes() {
  const { restaurant } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegment, setSelectedSegment] = useState('all')

  useEffect(() => {
    if (restaurant?.id) {
      fetchCustomers()
    }
  }, [restaurant])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'VIP': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'REGULAR': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NEW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm))

    const matchesSegment = selectedSegment === 'all' || customer.segment === selectedSegment

    return matchesSearch && matchesSegment
  })

  const segments = ['all', 'VIP', 'REGULAR', 'NEW']
  const segmentCounts = {
    all: customers.length,
    VIP: customers.filter(c => c.segment === 'VIP').length,
    REGULAR: customers.filter(c => c.segment === 'REGULAR').length,
    NEW: customers.filter(c => c.segment === 'NEW').length
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Base de datos de clientes de tu restaurante</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            <p className="text-sm text-gray-600">Total Clientes</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{segmentCounts.VIP}</p>
            <p className="text-sm text-gray-600">Clientes VIP</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{segmentCounts.REGULAR}</p>
            <p className="text-sm text-gray-600">Regulares</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{segmentCounts.NEW}</p>
            <p className="text-sm text-gray-600">Nuevos</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            {segments.map((segment) => (
              <button
                key={segment}
                onClick={() => setSelectedSegment(segment)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSegment === segment
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {segment === 'all' ? 'Todos' : segment} ({segmentCounts[segment]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredCustomers.length} clientes encontrados
          </h3>
        </div>
        <div className="p-6">
          {filteredCustomers.length > 0 ? (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>📧 {customer.email}</span>
                          {customer.phone && <span>📞 {customer.phone}</span>}
                          <span>📅 Cliente desde {new Date(customer.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                        {customer.preferences && (
                          <p className="text-sm text-gray-500 mt-1">💭 {customer.preferences}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSegmentColor(customer.segment)}`}>
                        {customer.segment}
                      </span>
                      <div className="text-right text-sm text-gray-500">
                        <p>Reservas: {customer.total_reservations || 0}</p>
                        <p>No-shows: {customer.no_show_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedSegment !== 'all' 
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Aún no tienes clientes registrados'
                }
              </p>
              {!searchTerm && selectedSegment === 'all' && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  ➕ Agregar Primer Cliente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
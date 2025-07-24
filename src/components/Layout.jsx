import { useAuth } from '../hooks/useAuth'

export default function Layout({ children, activeSection, setActiveSection }) {
  const { user, restaurant, signOut } = useAuth()

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'reservas', name: 'Reservas', icon: '📅' },
    { id: 'clientes', name: 'Clientes', icon: '👥' },
    { id: 'mesas', name: 'Mesas', icon: '🪑' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'configuracion', name: 'Configuración', icon: '⚙️' }
  ]

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🍽️</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Son-IA</h1>
              <p className="text-sm text-gray-500">Restaurant Intelligence</p>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">{restaurant?.name || 'Cargando...'}</h3>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {restaurant?.plan || 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
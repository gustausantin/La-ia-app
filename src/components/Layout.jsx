import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, restaurant, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'reservas', name: 'Reservas', icon: '📅', path: '/reservas' },
    { id: 'clientes', name: 'Clientes', icon: '👥', path: '/clientes' },
    { id: 'mesas', name: 'Mesas', icon: '🪑', path: '/mesas' },
    { id: 'analytics', name: 'Analytics', icon: '📈', path: '/analytics' },
    { id: 'configuracion', name: 'Configuración', icon: '⚙️', path: '/configuracion' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🍽️</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Son-IA</h1>
              <p className="text-sm text-gray-500">Restaurant Intelligence</p>
            </div>
          </div>
        </div>
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
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-700 hover:bg-gray-100'}`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>
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
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

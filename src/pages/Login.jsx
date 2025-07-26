import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Estados para login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Estados adicionales para registro
  const [restaurantName, setRestaurantName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { signIn } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await signIn(email, password)

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de hacer login. Revisa tu bandeja de entrada.')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos.')
        } else {
          setError(error.message)
        }
      }
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    if (!restaurantName.trim()) {
      setError('El nombre del restaurante es obligatorio')
      setLoading(false)
      return
    }

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            restaurant_name: restaurantName,
            phone: phone,
            city: city
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // 2. Crear restaurante
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .insert([
            {
              name: restaurantName.trim(),
              email: email,
              phone: phone || null,
              city: city || null,
              plan: 'free',
              active: true,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (restaurantError) {
          console.error('Error creating restaurant:', restaurantError)
          throw new Error('Error al crear el restaurante')
        }

        // 3. Crear mapeo usuario-restaurante
        const { error: mappingError } = await supabase
          .from('user_restaurant_mapping')
          .insert([
            {
              auth_user_id: authData.user.id,
              restaurant_id: restaurantData.id,
              role: 'owner',
              permissions: {
                read: true,
                write: true,
                delete: true,
                admin: true
              },
              active: true
            }
          ])

        if (mappingError) {
          console.error('Error creating mapping:', mappingError)
          throw new Error('Error al configurar permisos')
        }

        setMessage('¡Registro exitoso! Revisa tu email para confirmar tu cuenta antes de hacer login.')
        setIsLogin(true)

        // Limpiar formularios
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setRestaurantName('')
        setPhone('')
        setCity('')
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (err.message.includes('already registered')) {
        setError('Este email ya está registrado. Intenta hacer login.')
      } else {
        setError(err.message || 'Error al crear la cuenta. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🍽️ Son-IA
          </h1>
          <p className="text-gray-600 text-lg">
            Restaurant Intelligence System
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Toggle Login/Registro */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setError('')
                setMessage('')
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setError('')
                setMessage('')
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm">{message}</p>
            </div>
          )}

          {/* Formulario de Login */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          ) : (
            /* Formulario de Registro */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="restaurant-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Restaurante *
                  </label>
                  <input
                    id="restaurant-name"
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mi Restaurante"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Madrid"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña *
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Repite la contraseña"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Al registrarte, se creará automáticamente tu restaurante en Son-IA
              </p>
            </form>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Son-IA. Sistema de Inteligencia para Restaurantes</p>
        </div>
      </div>
    </div>
  )
}
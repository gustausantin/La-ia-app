import { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Bot, Mail, Lock, Eye, EyeOff, AlertCircle, User, Building, Phone, Utensils, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { isAuthenticated, loading } = useAuthContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    restaurantName: '',
    phone: '',
    cuisineType: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'ES'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [cooldownEnd, setCooldownEnd] = useState(null);

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos';
    }

    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'El nombre del restaurante es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[+]?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono no válido';
    }

    if (!formData.cuisineType) {
      newErrors.cuisineType = 'Selecciona el tipo de cocina';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'El código postal es requerido';
    }



    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Limpiar errores anteriores

    // Verificar si estamos en cooldown
    if (cooldownEnd && new Date() < cooldownEnd) {
      const remainingSeconds = Math.ceil((cooldownEnd - new Date()) / 1000);
      toast.error(`⏱️ Espera ${remainingSeconds} segundos antes de intentar otra vez.`);
      return;
    }

    // Validar el formulario
    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Iniciando registro controlado desde backend...');

      // Llamar al endpoint del backend que controla todo el flujo
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          restaurantName: formData.restaurantName,
          phone: formData.phone,
          cuisineType: formData.cuisineType,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Lanzar error con detalles del servidor si están disponibles
        const errorDetails = result || { message: 'Error en el registro' };
        throw new Error(JSON.stringify(errorDetails));
      }

      console.log('Registro exitoso:', result);

      // Guardar el email para mostrar en el mensaje de éxito
      setRegisteredEmail(formData.email);

      // Mostrar pantalla de éxito
      setShowSuccess(true);

    } catch (error) {
      console.error('Registration error:', error);

      let parsedError;
      try {
        parsedError = JSON.parse(error.message);
      } catch (e) {
        // Si no es un JSON, usa el mensaje de error directamente
        parsedError = { error: error.message };
      }

      // Manejar errores específicos del servidor
      if (parsedError && parsedError.error) {
        const { error: errorMsg, details, code } = parsedError;

        switch (code) {
          case 'RATE_LIMIT':
            const retryAfter = parsedError.retryAfter || 300; // 5 minutos por defecto
            setCooldownEnd(new Date(Date.now() + retryAfter * 1000));
            toast.error(`⏱️ Límite de emails alcanzado. Espera ${Math.ceil(retryAfter / 60)} minutos e inténtalo otra vez.`);
            break;
          case 'USER_EXISTS':
            toast.error('📧 Este email ya está registrado. Ve a la página de login.');
            break;
          default:
            toast.error(details || errorMsg || 'Error al crear la cuenta');
        }
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Error al crear la cuenta. Por favor, inténtalo de nuevo.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo si el usuario empieza a escribir de nuevo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Pantalla de verificación de email
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Mail className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              ¡Casi está!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Verifica tu email para activar tu cuenta
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  Hemos enviado un correo a <strong>{registeredEmail}</strong>.
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Abre el email y haz clic en el enlace para activar tu cuenta.
                  Una vez confirmada, ya podrás iniciar sesión.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={async () => {
                    const toastLoading = toast.loading('Reenviando email...');
                    try {
                      const { supabase } = await import('../lib/supabase.js');
                      const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email: registeredEmail,
                        options: {
                          emailRedirectTo: `${window.location.origin}/confirm`
                        }
                      });

                      toast.dismiss(toastLoading);

                      if (error) {
                        if (error.message.includes('rate_limit') || error.message.includes('too_many_requests')) {
                          toast.error('⏱️ Espera unos minutos antes de reenviar otro email');
                        } else {
                          throw error;
                        }
                      } else {
                        toast.success('✅ Email de verificación reenviado. Revisa tu bandeja de entrada.');
                      }
                    } catch (error) {
                      toast.dismiss(toastLoading);
                      console.error('Error reenviando email:', error);
                      toast.error(`❌ Error al reenviar: ${error.message || 'Inténtalo más tarde'}`);
                    }
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  ¿No has recibido el email? Reenviar
                </button>

                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                >
                  Ya he verificado, ir a login
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Revisa también tu carpeta de spam si no encuentras el email
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Iniciando La-IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
            <Bot className="h-10 w-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Únete a La-IA
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Crea tu cuenta y revoluciona tu restaurante
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Gustau"
                />
              </div>
              {errors.firstName && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.firstName}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Santin Sanchez"
                />
              </div>
              {errors.lastName && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.lastName}
                </div>
              )}
            </div>

            {/* Restaurant Name */}
            <div className="col-span-2">
              <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del restaurante
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  required
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.restaurantName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre de tu restaurante"
                />
              </div>
              {errors.restaurantName && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.restaurantName}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+34 612 345 678"
                />
              </div>
              {errors.phone && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone}
                </div>
              )}
            </div>

            {/* Cuisine Type */}
            <div>
              <label htmlFor="cuisineType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de cocina
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Utensils className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="cuisineType"
                  name="cuisineType"
                  required
                  value={formData.cuisineType}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.cuisineType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="mediterranea">Mediterránea</option>
                  <option value="italiana">Italiana</option>
                  <option value="japonesa">Japonesa</option>
                  <option value="mexicana">Mexicana</option>
                  <option value="china">China</option>
                  <option value="india">India</option>
                  <option value="fusion">Fusión</option>
                  <option value="tradicional">Tradicional</option>
                  <option value="vegetariana">Vegetariana</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              {errors.cuisineType && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.cuisineType}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección completa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Calle Principal 123"
                />
              </div>
              {errors.address && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.address}
                </div>
              )}
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={formData.city}
                onChange={handleChange}
                className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Madrid"
              />
              {errors.city && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.city}
                </div>
              )}
            </div>

            {/* Postal Code */}
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código postal
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                required
                value={formData.postalCode}
                onChange={handleChange}
                className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                  errors.postalCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="28001"
              />
              {errors.postalCode && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.postalCode}
                </div>
              )}
            </div>



            {/* Email */}
            <div className="col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="col-span-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </div>
              )}
            </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando cuenta...
                  </div>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
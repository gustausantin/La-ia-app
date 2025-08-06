// src/pages/Login.jsx - VERSIÓN CORREGIDA SIN STYLE JSX
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";
import {
  Bot,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    restaurantName: "",
    phone: "",
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          toast.success("¡Bienvenido de vuelta!");
          navigate("/dashboard");
        } else {
          toast.error(result.error || "Error al iniciar sesión");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              restaurant_name: formData.restaurantName,
              phone: formData.phone,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error en el proceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Son-IA</h1>
            <p className="text-gray-600">
              Tu recepcionista virtual inteligente 24/7
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Restaurante
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                    placeholder="La Terraza Mediterránea"
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                    placeholder="+34 600 123 456"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                  placeholder="tu@restaurante.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 font-medium flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"}</span>
              )}
            </button>
          </form>

          {/* Beneficios */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Sin comisiones</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                <span>Atención 24/7</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                <span>Multi-canal</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Shield className="w-4 h-4 text-indigo-500 mr-2 flex-shrink-0" />
                <span>100% seguro</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Al continuar, aceptas nuestros{" "}
              <a href="#" className="text-purple-600 hover:underline">
                términos de servicio
              </a>{" "}
              y{" "}
              <a href="#" className="text-purple-600 hover:underline">
                política de privacidad
              </a>
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-100 shadow-lg">
            <div className="flex items-center justify-center mb-3">
              {[...Array(5)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <p className="text-gray-700 italic mb-2">
              "Son-IA ha transformado completamente cómo gestionamos las
              reservas. Ya no perdemos clientes por no contestar a tiempo."
            </p>
            <p className="text-sm text-gray-600 font-medium">
              María García - La Brasserie
            </p>
            <p className="text-xs text-gray-500 mt-1">Ahorro mensual: €450</p>
          </div>
        </div>
      </div>
    </div>
  );
}

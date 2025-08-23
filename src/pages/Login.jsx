// Login.jsx - Versión ORIGINAL con solo 1 error corregido

import { useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Bot,
  MessageCircle,
  Phone,
  Globe,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  Shield,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";

// DATOS NECESARIOS DE SUPABASE:
// - tabla: restaurants (ya existe)
// - tabla: user_restaurant_mapping (ya existe)
// - tabla: agent_settings (configuración inicial del agente)
// - tabla: onboarding_progress (seguimiento del onboarding)
// - RPC: create_restaurant_with_agent(data)

// Componente de feature card
const FeatureCard = ({ icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  </div>
);

// Componente de testimonial
const TestimonialCard = ({ quote, author, restaurant, savings }) => (
  <div className="bg-white/50 backdrop-blur p-4 rounded-lg border border-purple-100">
    <div className="flex gap-1 mb-2">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-sm text-gray-700 italic mb-3">"{quote}"</p>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-sm text-gray-900">{author}</p>
        <p className="text-xs text-gray-600">{restaurant}</p>
      </div>
      {savings && (
        <div className="text-right">
          <p className="text-xs text-gray-600">Ahorro mensual</p>
          <p className="font-bold text-green-600">€{savings}</p>
        </div>
      )}
    </div>
  </div>
);

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // Para registro multi-step

  // Estados para login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Estados para registro - Step 1
  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados para registro - Step 2 (Configuración del Agente)
  const [agentName, setAgentName] = useState("Sofia");
  const [primaryChannel, setPrimaryChannel] = useState("whatsapp");
  const [expectedVolume, setExpectedVolume] = useState("medium");
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("23:00");

  const { login } = useAuthContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await login(email, password);

      if (!result.success) {
        if (result.error?.includes("Email not confirmed")) {
          setError(
            "Por favor confirma tu email antes de hacer login. Revisa tu bandeja de entrada.",
          );
        } else if (result.error?.includes("Invalid login credentials")) {
          setError("Email o contraseña incorrectos.");
        } else {
          setError(result.error || "Error al iniciar sesión");
        }
      }
    } catch (err) {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();

    // Validaciones Step 1
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!restaurantName.trim()) {
      setError("El nombre del restaurante es obligatorio");
      return;
    }

    setError("");
    setCurrentStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 1. Crear usuario en Supabase Auth (CON confirmación de email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            restaurant_name: restaurantName,
            phone: phone,
            city: city,
          },
          emailRedirectTo: `${window.location.origin}/confirm`, // CON confirmación de email
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // CON CONFIRMACIÓN DE EMAIL - siempre guardar datos temporalmente
        localStorage.setItem('pendingRegistration', JSON.stringify({
          restaurantName: restaurantName.trim(),
          phone: phone || null,
          city: city || null,
          userId: authData.user.id,
          email: email,
          timestamp: new Date().toISOString()
        }));
        
        setMessage(`✅ ¡Registro exitoso! 
        
📧 Hemos enviado un email de confirmación a: ${email}

🔗 Por favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.

⏰ Una vez confirmado, se creará automáticamente tu restaurante y podrás acceder al dashboard.`);
        
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message.includes("already registered")) {
        setError("Este email ya está registrado. Intenta hacer login.");
      } else {
        setError(
          err.message || "Error al crear la cuenta. Inténtalo de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Componente de beneficios del agente
  const AgentBenefits = () => (
    <div className="lg:block hidden">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl text-white h-full">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="w-10 h-10" />
          <div>
            <h2 className="text-2xl font-bold">Tu Agente IA 24/7</h2>
            <p className="text-purple-100">Recepcionista virtual inteligente</p>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <FeatureCard
            icon={<MessageCircle className="w-5 h-5 text-purple-600" />}
            title="Multi-Canal"
            description="WhatsApp, llamadas, Instagram, web. Un agente, todos los canales."
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5 text-purple-600" />}
            title="Respuesta Instantánea"
            description="0 segundos de espera. Tu agente responde al instante, siempre."
          />
          <FeatureCard
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            title="Más Reservas"
            description="Aumenta tus reservas un 35% capturando clientes 24/7."
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5 text-purple-600" />}
            title="Sin Errores"
            description="Olvídate de reservas duplicadas o errores de comunicación."
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg mb-3">
            Lo que dicen nuestros clientes
          </h3>
          <TestimonialCard
            quote="En 2 meses hemos aumentado las reservas un 40%. El agente nunca duerme."
            author="Carlos Mendoza"
            restaurant="La Brasería Madrid"
            savings="1,200"
          />
          <TestimonialCard
            quote="Ya no pierdo reservas por no contestar el WhatsApp. ¡Es increíble!"
            author="María García"
            restaurant="Sushi Kyoto Barcelona"
            savings="800"
          />
        </div>

        <div className="mt-8 p-4 bg-white/10 backdrop-blur rounded-lg">
          <p className="text-sm font-medium mb-2">🎁 Oferta especial</p>
          <p className="text-2xl font-bold">14 días GRATIS</p>
          <p className="text-sm text-purple-100">Sin tarjeta de crédito</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Panel izquierdo - Formularios */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="w-10 h-10 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">La-IA</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Sistema Inteligente de Reservas con IA
            </p>
            {!isLogin && currentStep === 2 && (
              <p className="text-purple-600 font-medium mt-2">
                Paso 2: Configura tu Agente IA
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Toggle Login/Registro */}
            {currentStep === 1 && (
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                    setMessage("");
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                    setMessage("");
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Crear Cuenta
                </button>
              </div>
            )}

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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>

                {/* ========================================================== */}
                {/* || ÚNICO CAMBIO REALIZADO: Arreglada la etiqueta <a>   || */}
                {/* ========================================================== */}
                <div className="text-center">
                  <a
                    href="#"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </form>
            ) : (
              /* Formulario de Registro Multi-Step */
              <>
                {currentStep === 1 ? (
                  <form onSubmit={handleNextStep} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label
                          htmlFor="reg-email"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email *
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="tu@email.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="restaurant-name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Nombre del Restaurante *
                        </label>
                        <input
                          id="restaurant-name"
                          type="text"
                          required
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Mi Restaurante"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Teléfono
                          </label>
                          <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="+34 600 000 000"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="city"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Ciudad
                          </label>
                          <input
                            id="city"
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Madrid"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="reg-password"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Contraseña *
                        </label>
                        <input
                          id="reg-password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="confirm-password"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Confirmar Contraseña *
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Repite la contraseña"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      Siguiente: Configurar Agente
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* Step 2: Configuración del Agente */
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">
                          Personaliza tu Agente IA
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tu agente empezará a trabajar inmediatamente después del
                        registro
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="agent-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nombre del Agente
                      </label>
                      <input
                        id="agent-name"
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Sofia, Carlos, Luna..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este es el nombre que usará al presentarse a tus
                        clientes
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Canal Principal
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                            primaryChannel === "whatsapp"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="channel"
                            value="whatsapp"
                            checked={primaryChannel === "whatsapp"}
                            onChange={(e) => setPrimaryChannel(e.target.value)}
                            className="sr-only"
                          />
                          <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                          <span className="text-sm font-medium">WhatsApp</span>
                        </label>
                        <label
                          className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                            primaryChannel === "vapi"
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="channel"
                            value="vapi"
                            checked={primaryChannel === "vapi"}
                            onChange={(e) => setPrimaryChannel(e.target.value)}
                            className="sr-only"
                          />
                          <Phone className="w-5 h-5 mr-2 text-orange-600" />
                          <span className="text-sm font-medium">Llamadas</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Volumen esperado de reservas
                      </label>
                      <select
                        value={expectedVolume}
                        onChange={(e) => setExpectedVolume(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="low">Bajo (0-10 al día)</option>
                        <option value="medium">Medio (10-30 al día)</option>
                        <option value="high">Alto (30-50 al día)</option>
                        <option value="very-high">Muy Alto (+50 al día)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horario del Restaurante
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="opening"
                            className="block text-xs text-gray-600 mb-1"
                          >
                            Apertura
                          </label>
                          <input
                            id="opening"
                            type="time"
                            value={openingTime}
                            onChange={(e) => setOpeningTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="closing"
                            className="block text-xs text-gray-600 mb-1"
                          >
                            Cierre
                          </label>
                          <input
                            id="closing"
                            type="time"
                            value={closingTime}
                            onChange={(e) => setClosingTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                      >
                        Atrás
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          "Creando tu agente..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Crear Cuenta
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-700 text-center">
                        ✨ Tu agente {agentName} empezará a recibir reservas
                        inmediatamente
                      </p>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
          {/* Info adicional */}
          {isLogin && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                    setMessage("");
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium ml-1"
                >
                  Prueba 14 días gratis
                </button>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Sin tarjeta
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Configuración en 2 min
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Cancela cuando quieras
                </span>
              </div>
            </div>
          )}
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 La-IA. Sistema de Inteligencia para Restaurantes</p>
          </div>
        </div>
      </div>
      {/* Panel derecho - Beneficios (solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5">
        <AgentBenefits />
      </div>
    </div>
  );
}
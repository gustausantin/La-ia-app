// Configuracion.jsx - VERSIÓN ACTUALIZADA CON CAMBIOS DE HORARIOS
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    Settings as SettingsIcon,
    Building2,
    Clock,
    Users,
    Bell,
    Globe,
    Zap,
    CreditCard,
    Shield,
    Save,
    Upload,
    Calendar,
    MessageSquare,
    Phone,
    Mail,
    MapPin,
    Image,
    Link2,
    ChevronRight,
    Check,
    X,
    AlertCircle,
    Sparkles,
    Palette,
    Languages,
    DollarSign,
    Smartphone,
    Bot,
    Webhook,
    Key,
    UserPlus,
    Crown,
    BarChart3,
    HelpCircle,
    ExternalLink,
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    Download,
    Trash2,
    Brain,
    MessageCircle,
    PhoneCall,
    Instagram,
    Facebook,
    Wifi,
    WifiOff,
    Volume2,
    Timer,
    Target,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Info,
    Gauge,
    Activity,
    Mic,
    Hash,
    Code,
    Database,
    FileText,
    Sliders,
    Plus,
    Gift,
    Heart,
    Award,
    Percent,
    Users as UsersIcon,
    Utensils,
    Navigation,
    ThermometerSun,
    UserCheck,
    TrendingDown,
    DollarSign as Dollar,
    Camera,
    Settings,
} from "lucide-react";
import toast from "react-hot-toast";

const Configuracion = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("General");
    
    // Estado para todos los settings
    const [settings, setSettings] = useState({
        // Información básica
        name: "",
        description: "",
        cuisine_type: "",
        phone: "",
        email: "",
        website: "",
        address: "",
        city: "",
        postal_code: "",
        country: "ES",
        timezone: "Europe/Madrid",
        currency: "EUR",
        language: "es",
    });

    // Pestañas de configuración (SIN HORARIOS)
    const tabs = [
        {
            id: "general",
            label: "General",
            icon: <Building2 className="w-4 h-4" />,
        },
        {
            id: "agent",
            label: "Agente IA",
            icon: <Bot className="w-4 h-4" />,
        },
        {
            id: "crm",
            label: "CRM IA",
            icon: <Brain className="w-4 h-4" />,
        },
        {
            id: "channels",
            label: "Canales",
            icon: <MessageSquare className="w-4 h-4" />,
        },
        {
            id: "calendar",
            label: "Horarios y Calendario", // RENOMBRADO
            icon: <Calendar className="w-4 h-4" />,
        },
        {
            id: "notifications",
            label: "Notificaciones",
            icon: <Bell className="w-4 h-4" />,
        },
    ];

    // CARGAR CONFIGURACIÓN - MÉTODO DIRECTO
    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                console.log("🔥 INICIANDO CARGA DE CONFIGURACIÓN");

                // 1. Obtener usuario actual
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log("❌ No hay usuario autenticado");
                    setLoading(false);
                    return;
                }
                console.log("✅ Usuario autenticado:", user.email);

                // 2. Obtener restaurant ID del mapping
                const { data: mapping, error: mappingError } = await supabase
                    .from('user_restaurant_mapping')
                    .select('restaurant_id')
                    .eq('auth_user_id', user.id)
                    .single();
                    
                if (mappingError || !mapping) {
                    console.log("❌ Error obteniendo mapping:", mappingError);
                    setLoading(false);
                    return;
                }
                
                const restaurantId = mapping.restaurant_id;
                console.log("🏪 Restaurant ID:", restaurantId);

                // 3. Obtener datos del restaurante
                const { data: restaurant, error: restaurantError } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();

                if (restaurantError || !restaurant) {
                    console.log("❌ Error obteniendo restaurant:", restaurantError);
                    setLoading(false);
                    return;
                }

                console.log("✅ DATOS DEL RESTAURANTE OBTENIDOS:");
                console.log("- name:", restaurant.name);
                console.log("- email:", restaurant.email);
                console.log("- phone:", restaurant.phone);
                console.log("- address:", restaurant.address);
                console.log("- city:", restaurant.city);
                console.log("- postal_code:", restaurant.postal_code);
                console.log("- cuisine_type:", restaurant.cuisine_type);

                // 4. MAPEAR DIRECTAMENTE LOS DATOS
                const newSettings = {
                    name: restaurant.name || "",
                    description: restaurant.description || "",
                    cuisine_type: restaurant.cuisine_type || "",
                    phone: restaurant.phone || "",
                    email: restaurant.email || "",
                    website: restaurant.website || "",
                    address: restaurant.address || "",
                    city: restaurant.city || "",
                    postal_code: restaurant.postal_code || "",
                    country: restaurant.country || "ES",
                    timezone: restaurant.timezone || "Europe/Madrid",
                    currency: restaurant.currency || "EUR",
                    language: restaurant.language || "es",
                };

                console.log("🎯 APLICANDO SETTINGS:");
                console.log(newSettings);

                setSettings(newSettings);
                console.log("✅ CONFIGURACIÓN CARGADA EXITOSAMENTE");

            } catch (error) {
                console.error("❌ ERROR CARGANDO CONFIGURACIÓN:", error);
                toast.error("Error cargando la configuración");
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []); // Sin dependencias - se ejecuta una vez al montar

    // Función para actualizar settings
    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Función de guardado
    const handleSave = async () => {
        try {
            setSaving(true);
            console.log("💾 GUARDANDO CONFIGURACIÓN:", settings);

            // Obtener usuario y restaurant ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("No hay usuario autenticado");
                return;
            }

            const { data: mapping } = await supabase
                .from('user_restaurant_mapping')
                .select('restaurant_id')
                .eq('auth_user_id', user.id)
                .single();
                
            if (!mapping) {
                toast.error("No se encontró el restaurante");
                return;
            }

            // Actualizar datos del restaurante
            const { error } = await supabase
                .from('restaurants')
                .update({
                    name: settings.name,
                    description: settings.description,
                    cuisine_type: settings.cuisine_type,
                    phone: settings.phone,
                    email: settings.email,
                    website: settings.website,
                    address: settings.address,
                    city: settings.city,
                    postal_code: settings.postal_code,
                    country: settings.country,
                    timezone: settings.timezone,
                    currency: settings.currency,
                    language: settings.language,
                })
                .eq('id', mapping.restaurant_id);

            if (error) {
                throw error;
            }

            toast.success("Configuración guardada correctamente");
            console.log("✅ CONFIGURACIÓN GUARDADA");

        } catch (error) {
            console.error("❌ ERROR GUARDANDO:", error);
            toast.error("Error guardando la configuración");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2">Cargando configuración...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <SettingsIcon className="w-8 h-8 text-purple-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
                </div>
                <p className="text-gray-600">
                    Centro de control completo para tu restaurante. Configura CRM IA, canales de comunicación y
                    todas las funcionalidades avanzadas.
                </p>
            </div>

            {/* Pestañas */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.label)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                            activeTab === tab.label
                                ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenido de pestañas */}
            {activeTab === "General" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Información General</h2>
                        <span className="text-sm text-gray-500">Configuración básica de tu restaurante</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del restaurante
                            </label>
                            <input
                                type="text"
                                value={settings.name}
                                onChange={(e) => updateSetting('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Mi Restaurante"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de cocina
                            </label>
                            <select
                                value={settings.cuisine_type}
                                onChange={(e) => updateSetting('cuisine_type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecciona el tipo</option>
                                <option value="mediterranea">Mediterránea</option>
                                <option value="italiana">Italiana</option>
                                <option value="japonesa">Japonesa</option>
                                <option value="mexicana">Mexicana</option>
                                <option value="francesa">Francesa</option>
                                <option value="china">China</option>
                                <option value="india">India</option>
                                <option value="fusion">Fusión</option>
                                <option value="vegetariana">Vegetariana</option>
                                <option value="otra">Otra</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email de contacto
                            </label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => updateSetting('email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="contacto@mirestaurante.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={settings.phone}
                                onChange={(e) => updateSetting('phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="+34 600 000 000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sitio web
                            </label>
                            <input
                                type="url"
                                value={settings.website}
                                onChange={(e) => updateSetting('website', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="https://www.mirestaurante.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección completa
                            </label>
                            <input
                                type="text"
                                value={settings.address}
                                onChange={(e) => updateSetting('address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Calle Mayor 123, Madrid"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ciudad
                            </label>
                            <input
                                type="text"
                                value={settings.city}
                                onChange={(e) => updateSetting('city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Madrid"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Código postal
                            </label>
                            <input
                                type="text"
                                value={settings.postal_code}
                                onChange={(e) => updateSetting('postal_code', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="28001"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción del restaurante
                        </label>
                        <textarea
                            value={settings.description}
                            onChange={(e) => updateSetting('description', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Describe tu restaurante, especialidades, ambiente..."
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Horarios y Calendario - RENOMBRADO */}
            {activeTab === "Horarios y Calendario" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Horarios y Calendario</h2>
                        <span className="text-sm text-gray-500">Configura los horarios de operación y calendario</span>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900 mb-2">Configuración de Horarios</h4>
                                <p className="text-sm text-blue-800">
                                    Los horarios del restaurante se configuran desde la página de <strong>Calendario</strong>. 
                                    Allí podrás establecer los días de operación, horarios de apertura y cierre, 
                                    y gestionar la disponibilidad para reservas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center py-8">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Gestiona tus horarios desde el Calendario
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Ve a la sección de Calendario para configurar los horarios de operación de tu restaurante.
                        </p>
                        <button
                            onClick={() => window.location.href = '/calendario'}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            Ir al Calendario
                        </button>
                    </div>
                </div>
            )}

            {/* Otras pestañas - placeholder */}
            {activeTab !== "General" && activeTab !== "Horarios y Calendario" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center py-8">
                        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {activeTab}
                        </h3>
                        <p className="text-gray-600">
                            Esta sección está en desarrollo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuracion;

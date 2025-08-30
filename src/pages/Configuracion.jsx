// Configuracion.jsx - VERSIÓN SIMPLIFICADA Y ROBUSTA
import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import {
    Settings,
    Building2,
    MessageSquare,
    Users,
    Clock,
    Save,
    Check,
    X,
    AlertCircle,
    Zap,
    Phone,
    Mail,
    Globe,
    RefreshCw
} from "lucide-react";

// Spinner de carga
const LoadingSpinner = ({ text = "Cargando..." }) => (
    <div className="flex items-center justify-center p-8">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">{text}</p>
        </div>
    </div>
);

// Configuración de canales disponibles
const AVAILABLE_CHANNELS = {
    whatsapp: {
        name: "WhatsApp",
        icon: MessageSquare,
        color: "green",
        description: "Conecta con WhatsApp Business API"
    },
    vapi: {
        name: "Llamadas (Vapi)",
        icon: Phone,
        color: "blue", 
        description: "Sistema de llamadas con IA"
    },
    email: {
        name: "Email",
        icon: Mail,
        color: "orange",
        description: "Configurar servidor SMTP"
    },
    web_chat: {
        name: "Web Chat",
        icon: Globe,
        color: "purple",
        description: "Chat integrado en web"
    },
    facebook: {
        name: "Facebook",
        icon: Users,
        color: "blue",
        description: "Messenger de Facebook"
    },
    instagram: {
        name: "Instagram",
        icon: Users,
        color: "pink",
        description: "Direct de Instagram"
    }
};

// Componente principal
export default function Configuracion() {
    const { restaurant, restaurantId } = useAuthContext();
    
    // Estados básicos
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("restaurant");
    
    // Estados de configuración
    const [restaurantConfig, setRestaurantConfig] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "España"
    });

    const [channelsConfig, setChannelsConfig] = useState({});
    const [businessHours, setBusinessHours] = useState({
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "22:00", closed: false },
        saturday: { open: "09:00", close: "22:00", closed: false },
        sunday: { open: "09:00", close: "22:00", closed: true }
    });

    // Cargar configuración actual
    const loadConfiguration = useCallback(async () => {
        if (!restaurantId) return;

        setLoading(true);
        try {
            // Cargar datos del restaurante
            const { data: restaurantData, error: restaurantError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('id', restaurantId)
                .single();

            if (!restaurantError && restaurantData) {
                setRestaurantConfig({
                    name: restaurantData.name || "",
                    email: restaurantData.email || "",
                    phone: restaurantData.phone || "",
                    address: restaurantData.address || "",
                    city: restaurantData.city || "",
                    country: restaurantData.country || "España"
                });

                // Cargar horarios si existen
                if (restaurantData.business_hours) {
                    setBusinessHours(restaurantData.business_hours);
                }
            }

            // Cargar configuración de canales
            const { data: channelsData, error: channelsError } = await supabase
                .from('channel_credentials')
                .select('*')
                .eq('restaurant_id', restaurantId);

            if (!channelsError && channelsData) {
                const channelsMap = {};
                channelsData.forEach(channel => {
                    channelsMap[channel.channel] = {
                        enabled: channel.is_active,
                        credentials: channel.credentials || {},
                        config: channel.config || {}
                    };
                });
                setChannelsConfig(channelsMap);
            }

        } catch (error) {
            console.error('Error cargando configuración:', error);
            toast.error('Error cargando configuración');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Guardar configuración del restaurante
    const saveRestaurantConfig = useCallback(async () => {
        if (!restaurantId) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({
                    ...restaurantConfig,
                    business_hours: businessHours,
                    updated_at: new Date().toISOString()
                })
                .eq('id', restaurantId);

            if (error) {
                throw error;
            }

            toast.success('Configuración guardada correctamente');
        } catch (error) {
            console.error('Error guardando configuración:', error);
            toast.error('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    }, [restaurantId, restaurantConfig, businessHours]);

    // Habilitar/deshabilitar canal
    const toggleChannel = useCallback(async (channelType, enabled) => {
        try {
            if (enabled) {
                // Crear/actualizar canal
                const { error } = await supabase
                    .from('channel_credentials')
                    .upsert({
                        restaurant_id: restaurantId,
                        channel: channelType,
                        is_active: true,
                        credentials: {},
                        config: {}
                    });

                if (error) throw error;
            } else {
                // Desactivar canal
                const { error } = await supabase
                    .from('channel_credentials')
                    .update({ is_active: false })
                    .eq('restaurant_id', restaurantId)
                    .eq('channel', channelType);

                if (error) throw error;
            }

            // Actualizar estado local
            setChannelsConfig(prev => ({
                ...prev,
                [channelType]: {
                    ...prev[channelType],
                    enabled: enabled
                }
            }));

            toast.success(`Canal ${channelType} ${enabled ? 'activado' : 'desactivado'}`);
        } catch (error) {
            console.error('Error toggling channel:', error);
            toast.error('Error al cambiar estado del canal');
        }
    }, [restaurantId]);

    // Cargar datos al inicializar
    useEffect(() => {
        if (restaurantId) {
            loadConfiguration();
        }
    }, [restaurantId, loadConfiguration]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <LoadingSpinner text="Cargando configuración..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                        <p className="text-gray-600">Gestiona la configuración de tu restaurante</p>
                    </div>
                    <button
                        onClick={loadConfiguration}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>

                {/* Navegación de pestañas */}
                <div className="flex gap-1 mt-4">
                    {[
                        { id: "restaurant", label: "Restaurante", icon: Building2 },
                        { id: "channels", label: "Canales", icon: MessageSquare },
                        { id: "hours", label: "Horarios", icon: Clock }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? "bg-purple-100 text-purple-700"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {/* Pestaña Restaurante */}
                {activeTab === "restaurant" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Información del Restaurante</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del restaurante
                                </label>
                                <input
                                    type="text"
                                    value={restaurantConfig.name}
                                    onChange={(e) => setRestaurantConfig(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Nombre del restaurante"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={restaurantConfig.email}
                                    onChange={(e) => setRestaurantConfig(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="email@restaurante.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={restaurantConfig.phone}
                                    onChange={(e) => setRestaurantConfig(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="+34 600 000 000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ciudad
                                </label>
                                <input
                                    type="text"
                                    value={restaurantConfig.city}
                                    onChange={(e) => setRestaurantConfig(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Madrid"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={restaurantConfig.address}
                                    onChange={(e) => setRestaurantConfig(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Calle Principal, 123"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={saveRestaurantConfig}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Pestaña Canales */}
                {activeTab === "channels" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Gestión de Canales de Comunicación</h2>
                        <p className="text-gray-600 mb-6">
                            Configura los canales de comunicación que quieres usar. Solo aquí se gestionan los canales.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(AVAILABLE_CHANNELS).map(([channelType, channel]) => {
                                const isEnabled = channelsConfig[channelType]?.enabled || false;
                                const IconComponent = channel.icon;
                                
                                return (
                                    <div
                                        key={channelType}
                                        className={`border-2 rounded-lg p-4 transition-colors ${
                                            isEnabled
                                                ? "border-green-200 bg-green-50"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <IconComponent className={`w-6 h-6 text-${channel.color}-600`} />
                                                <h3 className="font-medium text-gray-900">{channel.name}</h3>
                                            </div>
                                            <button
                                                onClick={() => toggleChannel(channelType, !isEnabled)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    isEnabled ? "bg-green-600" : "bg-gray-300"
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        isEnabled ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
                                        
                                        <div className="flex items-center gap-2">
                                            {isEnabled ? (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <Check className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Conectado</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <X className="w-4 h-4" />
                                                    <span className="text-sm">No conectado</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {isEnabled && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-xs text-blue-700">
                                                    ⚙️ Para configurar credenciales específicas, contacta con soporte técnico.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Pestaña Horarios */}
                {activeTab === "hours" && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Horarios de Atención</h2>
                        
                        <div className="space-y-4">
                            {Object.entries(businessHours).map(([day, hours]) => {
                                const dayNames = {
                                    monday: "Lunes",
                                    tuesday: "Martes", 
                                    wednesday: "Miércoles",
                                    thursday: "Jueves",
                                    friday: "Viernes",
                                    saturday: "Sábado",
                                    sunday: "Domingo"
                                };

                                return (
                                    <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                        <div className="w-24">
                                            <span className="font-medium text-gray-900">{dayNames[day]}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!hours.closed}
                                                onChange={(e) => setBusinessHours(prev => ({
                                                    ...prev,
                                                    [day]: { ...prev[day], closed: !e.target.checked }
                                                }))}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-600">Abierto</span>
                                        </div>
                                        
                                        {!hours.closed && (
                                            <>
                                                <input
                                                    type="time"
                                                    value={hours.open}
                                                    onChange={(e) => setBusinessHours(prev => ({
                                                        ...prev,
                                                        [day]: { ...prev[day], open: e.target.value }
                                                    }))}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                />
                                                <span className="text-gray-500">a</span>
                                                <input
                                                    type="time"
                                                    value={hours.close}
                                                    onChange={(e) => setBusinessHours(prev => ({
                                                        ...prev,
                                                        [day]: { ...prev[day], close: e.target.value }
                                                    }))}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                                />
                                            </>
                                        )}
                                        
                                        {hours.closed && (
                                            <span className="text-gray-500 italic">Cerrado</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={saveRestaurantConfig}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Guardando..." : "Guardar Horarios"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

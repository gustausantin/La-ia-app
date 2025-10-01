import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    Settings as SettingsIcon,
    Building2,
    Bell,
    MessageSquare,
    Save,
    Upload,
    X,
    RefreshCw,
    Bot,
    Power,
    Image,
    Phone,
    Instagram,
    Facebook,
    Calendar,
    Users,
        Clock,
        AlertCircle,
        AlertTriangle,
        HelpCircle
} from "lucide-react";
import toast from "react-hot-toast";

const ToggleSwitch = ({ enabled, onChange, label }) => {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    enabled ? 'bg-purple-600' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
            {label && <span className="text-sm text-gray-700">{label}</span>}
        </div>
    );
};

const SettingSection = ({ title, description, icon, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600">{description}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

const Configuracion = () => {
    const { restaurantId } = useAuthContext();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [settings, setSettings] = useState({
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
        logo_url: "",
        capacity_total: 0,
        price_range: "",
        agent: {
            enabled: true,
            name: "Sofia",
            gender: "female",
            avatar_url: ""
        },
        channels: {
            // Modo simple por defecto (objetos precreados para evitar undefined)
            voice: { enabled: false, phone_number: "" },
            whatsapp: { enabled: false, use_same_phone: true, phone_number: "" },
            webchat: { enabled: true },
            instagram: { enabled: false, handle: "", invite_email: "" },
            facebook: { enabled: false, page_url: "", invite_email: "" },
            vapi: { enabled: false },
            reservations_email: { current_inbox: "", forward_to: "" },
            external: { thefork_url: "", google_reserve_url: "" }
        },
        notifications: {
            reservation_emails: [],
            system_emails: [],
            quiet_hours: { start: "", end: "", mode: "mute" },
            new_reservation: false,
            cancelled_reservation: false,
            reservation_modified: false,
            // daily_digest eliminado para MVP
            agent_offline: true,
            integration_errors: true,
            // Nuevos errores del sistema
            system_save_errors: true,
            system_connection_errors: true,
            system_reservation_conflicts: true,
            system_config_incomplete: true
        }
    });

    // Ayudas (popovers) por canal
    const [showHelpWA, setShowHelpWA] = useState(false);
    const [showHelpIG, setShowHelpIG] = useState(false);
    const [showHelpFB, setShowHelpFB] = useState(false);
  const [showHelpDigest, setShowHelpDigest] = useState(false);

  // Helper: RPC con fallback REST firmado si proyecto devuelve "No API key"
  const callRpcSafe = async (fnName, args) => {
    const { data, error } = await supabase.rpc(fnName, args);
    if (!error) return { data };
    if ((error.message || '').includes('No API key')) {
      try {
        const baseUrl = import.meta?.env?.VITE_SUPABASE_URL;
        const anon = import.meta?.env?.VITE_SUPABASE_ANON_KEY;
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(`${baseUrl}/rest/v1/rpc/${fnName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': anon,
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${anon}`
          },
          body: JSON.stringify(args)
        });
        if (!resp.ok) {
          let detail = '';
          try { detail = await resp.text(); } catch {}
          throw new Error(detail || `REST error ${resp.status}`);
        }
        const json = await resp.json().catch(() => ({}));
        return { data: json };
      } catch (e) {
        return { error: e };
      }
    }
    return { error };
  };

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
            id: "channels",
            label: "Canales",
            icon: <MessageSquare className="w-4 h-4" />,
        },
        {
            id: "notifications",
            label: "Notificaciones",
            icon: <Bell className="w-4 h-4" />,
        }
    ];

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            console.log("📄 CARGANDO CONFIGURACIÓN - INICIO");
            console.log("🔍 Estado del contexto:", { 
                restaurantId, 
                restaurant,
                user 
            });
            
            const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error("❌ Error obteniendo usuario:", userError);
                setLoading(false);
                return;
            }
            if (!authUser) {
                console.log("❌ No hay usuario autenticado");
                setLoading(false);
                return;
            }
            console.log("✅ Usuario autenticado:", authUser.email, authUser.id);

            // Preferir el restaurantId del contexto si está disponible
            let currentRestaurantId = restaurantId;
            if (!currentRestaurantId) {
                console.log("⚠️ No hay restaurantId en contexto, buscando en mapping...");
                const { data: mapping, error: mapError } = await supabase
                    .from('user_restaurant_mapping')
                    .select('restaurant_id')
                    .eq('auth_user_id', authUser.id)
                    .maybeSingle();
                
                console.log("📊 Resultado del mapping:", { mapping, error: mapError });
                
                if (mapError && mapError.code === '42501') {
                    console.log("🔄 Error de permisos, intentando con RPC...");
                    try {
                        const { data: rpcData, error: rpcErr } = await supabase
                            .rpc('get_user_restaurant_info', { user_id: authUser.id });
                        console.log("📊 Resultado RPC:", { rpcData, error: rpcErr });
                        currentRestaurantId = rpcData?.restaurant_id || null;
                    } catch (e) {
                        console.error("❌ Error en RPC:", e);
                    }
                } else {
                    currentRestaurantId = mapping?.restaurant_id || null;
                }
            }
            
            if (!currentRestaurantId) {
                console.error("⚠️ No se pudo determinar el Restaurant ID");
                console.log("📋 Información de depuración:", {
                    contexto: { restaurantId, restaurant },
                    usuario: authUser.id
                });
                setLoading(false);
                return;
            }
            console.log("🏪 Restaurant ID encontrado:", currentRestaurantId);

            const { data: restaurant } = await supabase
                .from("restaurants")
                .select("*")
                .eq("id", currentRestaurantId)
                .maybeSingle();

            if (restaurant) {
                
                // Fusionar configuraciones manteniendo estructura completa
                const dbSettings = restaurant.settings || {};
                
                // 🔥 RECUPERAR DATOS DEL REGISTRO si están vacíos
                const pendingData = localStorage.getItem('pendingRegistration');
                let registrationData = null;
                if (pendingData) {
                    try {
                        registrationData = JSON.parse(pendingData);
                    } catch (e) {
                        console.error('Error parsing pendingRegistration:', e);
                    }
                }
                
                setSettings({
                    // ✅ DATOS DEL REGISTRO - Prioridad: DB > localStorage > vacío
                    name: restaurant.name || registrationData?.restaurantName || "",
                    email: restaurant.email || registrationData?.email || "",
                    phone: restaurant.phone || registrationData?.phone || "",
                    address: restaurant.address || registrationData?.address || "",
                    city: restaurant.city || registrationData?.city || "",
                    postal_code: restaurant.postal_code || registrationData?.postalCode || "",
                    cuisine_type: restaurant.cuisine_type || registrationData?.cuisineType || "",
                    
                    // ✅ DATOS ADICIONALES - DESDE SETTINGS
                    description: dbSettings.description || "",
                    website: dbSettings.website || "",
                    logo_url: dbSettings.logo_url || "",
                    
                    // ✅ CONFIGURACIÓN TÉCNICA
                    country: restaurant.country || "ES",
                    timezone: restaurant.timezone || "Europe/Madrid",
                    currency: restaurant.currency || "EUR",
                    language: restaurant.language || "es",
                    
                    // ✅ AGENTE IA
                    agent: {
                        enabled: dbSettings.agent?.enabled !== false,
                        name: dbSettings.agent?.name || registrationData?.agentName || "Sofia",
                        gender: dbSettings.agent?.gender || "female",
                        avatar_url: dbSettings.agent?.avatar_url || ""
                    },
                    
                    // ✅ CANALES Y NOTIFICACIONES
                    channels: {
                        voice: { enabled: restaurant.channels?.voice?.enabled || false, phone_number: restaurant.channels?.voice?.phone_number || "" },
                        whatsapp: {
                            enabled: restaurant.channels?.whatsapp?.enabled || false,
                            use_same_phone: restaurant.channels?.whatsapp?.use_same_phone ?? true,
                            phone_number: restaurant.channels?.whatsapp?.phone_number || ""
                        },
                        webchat: { enabled: restaurant.channels?.webchat?.enabled !== false, site_domain: restaurant.channels?.webchat?.site_domain || "", widget_key: restaurant.channels?.webchat?.widget_key || "" },
                        instagram: { enabled: restaurant.channels?.instagram?.enabled || false, handle: restaurant.channels?.instagram?.handle || "", invite_email: restaurant.channels?.instagram?.invite_email || "" },
                        facebook: { enabled: restaurant.channels?.facebook?.enabled || false, page_url: restaurant.channels?.facebook?.page_url || "", invite_email: restaurant.channels?.facebook?.invite_email || "" },
                        vapi: { enabled: restaurant.channels?.vapi?.enabled || false },
                        reservations_email: {
                            current_inbox: restaurant.channels?.reservations_email?.current_inbox || "",
                            forward_to: restaurant.channels?.reservations_email?.forward_to || ""
                        },
                        external: {
                            thefork_url: restaurant.channels?.external?.thefork_url || "",
                            google_reserve_url: restaurant.channels?.external?.google_reserve_url || ""
                        }
                    },
                    notifications: {
                        reservation_emails: restaurant.notifications?.reservation_emails || [],
                        system_emails: restaurant.notifications?.system_emails || [],
                        quiet_hours: restaurant.notifications?.quiet_hours || { start: "", end: "", mode: "mute" },
                        new_reservation: restaurant.notifications?.new_reservation ?? false,
                        cancelled_reservation: restaurant.notifications?.cancelled_reservation ?? false,
                        reservation_modified: restaurant.notifications?.reservation_modified ?? false,
                        // daily_digest eliminado para MVP
                        agent_offline: restaurant.notifications?.agent_offline ?? true,
                        integration_errors: restaurant.notifications?.integration_errors ?? true,
                        // Nuevos errores del sistema
                        system_save_errors: restaurant.notifications?.system_save_errors ?? true,
                        system_connection_errors: restaurant.notifications?.system_connection_errors ?? true,
                        system_reservation_conflicts: restaurant.notifications?.system_reservation_conflicts ?? true,
                        system_config_incomplete: restaurant.notifications?.system_config_incomplete ?? true
                    },
                });
            }

            setLoading(false);
        };

        loadSettings();
    }, []);

    const handleSave = async (section) => {
        // Determinar restaurantId de forma robusta
        let effectiveRestaurantId = restaurantId;
        if (!effectiveRestaurantId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: mapping } = await supabase
                    .from('user_restaurant_mapping')
                    .select('restaurant_id')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();
                effectiveRestaurantId = mapping?.restaurant_id || null;
            }
        }
        if (!effectiveRestaurantId) {
            toast.error("No se encontró el ID del restaurante");
            return;
        }

        try {
            setSaving(true);

            if (section === "Información General") {
                // Obtener configuración actual para hacer merge
                const { data: currentData } = await supabase
                    .from("restaurants")
                    .select("settings")
                    .eq("id", restaurantId)
                    .single();
                    
                const currentSettings = currentData?.settings || {};
                
                // Guardar campos directos + campos en settings
                const { error } = await supabase
                    .from("restaurants")
                    .update({
                        name: settings.name,
                        email: settings.email,
                        phone: settings.phone,
                        address: settings.address,
                        city: settings.city,
                        postal_code: settings.postal_code,
                        cuisine_type: settings.cuisine_type,
                        settings: {
                            ...currentSettings,
                            description: settings.description,
                            website: settings.website,
                            logo_url: settings.logo_url,
                            capacity_total: settings.capacity_total,
                            price_range: settings.price_range
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", restaurantId);

                if (error) throw error;
            } else if (section === "Canales de comunicación") {
                // Validaciones previas (no permitir guardar con campos críticos vacíos)
                const ch = settings.channels || {};
                const errors = [];
                if (ch.voice?.enabled && !ch.voice?.phone_number) {
                    errors.push('Teléfono de reservas: faltan números.');
                }
                if (ch.whatsapp?.enabled) {
                    if (ch.whatsapp?.use_same_phone) {
                        if (!ch.voice?.phone_number) errors.push('WhatsApp: usa mismo número, pero no hay teléfono en llamadas.');
                    } else if (!ch.whatsapp?.phone_number) {
                        errors.push('WhatsApp: falta el número.');
                    }
                }
                if (ch.vapi?.enabled && !ch.vapi?.voice_number) {
                    errors.push('VAPI: falta el número del asistente.');
                }
                if (ch.instagram?.enabled) {
                    if (!ch.instagram?.handle) errors.push('Instagram: falta usuario/URL.');
                    if (!ch.instagram?.invite_email) errors.push('Instagram: falta email para invitarnos como admin.');
                }
                if (ch.facebook?.enabled) {
                    if (!ch.facebook?.page_url) errors.push('Facebook: falta URL de la página.');
                    if (!ch.facebook?.invite_email) errors.push('Facebook: falta email para invitarnos como admin.');
                }
                // Email de reservas: si rellenan current_inbox pero no alias, lo genero más abajo; no bloquear
                if (errors.length > 0) {
                    toast.error(errors[0]);
                    return;
                }
                // Preparar canales con defaults
                const updatedChannels = {
                    ...settings.channels,
                };
                // Si usan mismo número para WhatsApp, reflejarlo
                if (updatedChannels?.whatsapp?.use_same_phone && updatedChannels?.voice?.phone_number) {
                    updatedChannels.whatsapp = {
                        ...updatedChannels.whatsapp,
                        phone_number: updatedChannels.voice.phone_number,
                    };
                }
                // Generar alias de reenvío si está vacío
                try {
                    const envDomain = (import.meta?.env?.VITE_ALIAS_EMAIL_DOMAIN) || '';
                    const hostnameBase = envDomain || (typeof window !== 'undefined' ? window.location.hostname : 'alias.local');
                if (updatedChannels?.reservations_email && !updatedChannels.reservations_email.forward_to) {
                        updatedChannels.reservations_email = {
                            ...updatedChannels.reservations_email,
                        forward_to: `reservas-${effectiveRestaurantId}@${hostnameBase}`
                        };
                    }
                } catch {}

                const { error } = await callRpcSafe('update_restaurant_channels', {
                    p_restaurant_id: effectiveRestaurantId,
                    p_channels: updatedChannels
                });
                if (error) {
                    console.error('RPC update_restaurant_channels error:', error);
                    throw error;
                }
            } else if (section === "Configuración de notificaciones") {
                // Validaciones previas para notificaciones
                const n = settings.notifications || {};
                const anyEnabled = (n.new_reservation || n.cancelled_reservation || n.reservation_modified || n.agent_offline || n.integration_errors || n.system_save_errors || n.system_connection_errors || n.system_reservation_conflicts || n.system_config_incomplete) === true;
                const hasRecipients = (Array.isArray(n.reservation_emails) && n.reservation_emails.length > 0) || (Array.isArray(n.system_emails) && n.system_emails.length > 0);
                if (anyEnabled && !hasRecipients) {
                    toast.error('Añade al menos un email destinatario para las notificaciones.');
                    return;
                }
                // Defaults de horario silencioso
                const qh = settings.notifications?.quiet_hours || {};
                const updatedNotifications = {
                    ...settings.notifications,
                    quiet_hours: {
                        start: qh.start || '08:00',
                        end: qh.end || '22:00',
                        mode: qh.mode || 'digest'
                    }
                };

                const { error } = await callRpcSafe('update_restaurant_notifications', {
                    p_restaurant_id: effectiveRestaurantId,
                    p_notifications: updatedNotifications
                });
                if (error) {
                    console.error('RPC update_restaurant_notifications error:', error);
                    throw error;
                }
            }

            toast.success(`✅ ${section} guardado correctamente`);
            
        } catch (error) {
            console.error("❌ Error guardando:", error);
            toast.error("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <SettingsIcon className="w-8 h-8 text-purple-600" />
                        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Centro de control para tu restaurante. Configura canales de comunicación y notificaciones.
                    </p>
                </div>

                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors ${
                                        activeTab === tab.id
                                            ? "border-purple-500 text-purple-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="space-y-8">
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <SettingSection
                                title="Información General"
                                description="Configuración básica de tu restaurante"
                                icon={<Building2 />}
                            >
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Image className="w-5 h-5 text-blue-600" />
                                            Logo del Restaurante
                                        </h4>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                                {settings.logo_url ? (
                                                    <img
                                                        src={settings.logo_url}
                                                        alt="Logo"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <Image className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    id="logo-upload"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    logo_url: event.target.result
                                                                }));
                                                                toast.success('Logo cargado correctamente');
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => document.getElementById('logo-upload').click()}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                            Subir logo
                                                        </button>
                                                        {settings.logo_url && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm('¿Estás seguro de eliminar el logo?')) {
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            logo_url: ''
                                                                        }));
                                                                        toast.success('Logo eliminado correctamente');
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                                                            >
                                                                <X className="w-4 h-4" />
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG o SVG (máx. 5MB) • Recomendado: 400x400px
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del restaurante
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.name}
                                                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Nombre de tu restaurante"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tipo de cocina
                                            </label>
                                            <select
                                                value={settings.cuisine_type}
                                                onChange={(e) => setSettings(prev => ({ ...prev, cuisine_type: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="">Selecciona el tipo</option>
                                                <option value="Mediterránea">Mediterránea</option>
                                                <option value="Española">Española</option>
                                                <option value="Italiana">Italiana</option>
                                                <option value="Asiática">Asiática</option>
                                                <option value="Mexicana">Mexicana</option>
                                                <option value="Francesa">Francesa</option>
                                                <option value="Japonesa">Japonesa</option>
                                                <option value="China">China</option>
                                                <option value="India">India</option>
                                                <option value="Americana">Americana</option>
                                                <option value="Vegetariana/Vegana">Vegetariana/Vegana</option>
                                                <option value="Marisquería">Marisquería</option>
                                                <option value="Asador/Parrilla">Asador/Parrilla</option>
                                                <option value="Tapas">Tapas</option>
                                                <option value="Fusión">Fusión</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email de contacto
                                            </label>
                                            <input
                                                type="email"
                                                value={settings.email}
                                                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="contacto@restaurante.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={settings.phone}
                                                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="https://www.turestaurante.com"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Descripción del restaurante
                                            </label>
                                            <textarea
                                                value={settings.description}
                                                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Describe tu restaurante, especialidades, ambiente..."
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dirección completa
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.address}
                                                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                                onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                                                onChange={(e) => setSettings(prev => ({ ...prev, postal_code: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="28001"
                                            />
                                        </div>

                                    </div>

                                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Información General")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Guardar General
                                        </button>
                                    </div>
                                </div>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === "agent" && (
                        <div className="space-y-6">
                            <SettingSection
                                title="Configuración del Agente IA"
                                description="Control centralizado de tu asistente virtual"
                                icon={<Bot />}
                            >
                                <div className="space-y-6">
                                    {/* Toggle principal del agente con AVATAR */}
                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Avatar del agente */}
                                                <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                                    {settings.agent?.avatar_url ? (
                                                        <img
                                                            src={settings.agent.avatar_url}
                                                            alt={settings.agent?.name || "Agente"}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Bot className="w-10 h-10 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {settings.agent?.name || "Agente IA"}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {settings.agent?.gender === "male" ? "👨 Voz masculina" : "👩 Voz femenina"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {settings.agent?.enabled ? "✅ Activo - Atendiendo clientes 24/7" : "❌ Desactivado"}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.agent?.enabled || false}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            enabled: e.target.checked
                                                        }
                                                    }))}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Información cuando está desactivado */}
                                    {!settings.agent?.enabled && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex gap-3">
                                                <Power className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-amber-900">Agente desactivado</h4>
                                                    <p className="text-sm text-amber-800 mt-1">
                                                        El agente no responderá a clientes en WhatsApp, teléfono, Instagram, Facebook ni otros canales.
                                                        Las reservas manuales desde el dashboard siguen funcionando normalmente.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Configuración básica */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre del agente
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.agent?.name || ""}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    agent: {
                                                        ...prev.agent,
                                                        name: e.target.value
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Sofia o Marcos"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                El nombre con el que se presentará a los clientes
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Género de la voz
                                            </label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            gender: "female"
                                                        }
                                                    }))}
                                                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                                                        settings.agent?.gender === "female"
                                                            ? "border-purple-500 bg-purple-50 text-purple-700 font-semibold"
                                                            : "border-gray-300 bg-white text-gray-700 hover:border-purple-300"
                                                    }`}
                                                >
                                                    👩 Femenino
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        agent: {
                                                            ...prev.agent,
                                                            gender: "male"
                                                        }
                                                    }))}
                                                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                                                        settings.agent?.gender === "male"
                                                            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                                                            : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                                                    }`}
                                                >
                                                    👨 Masculino
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Define qué voz usará en llamadas telefónicas
                                            </p>
                                        </div>
                                    </div>

                                    {/* Avatar personalizado */}
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Image className="w-5 h-5 text-blue-600" />
                                            Avatar del Agente (Humanizar)
                                        </h4>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 bg-white rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                                {settings.agent?.avatar_url ? (
                                                    <img
                                                        src={settings.agent.avatar_url}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Bot className="w-10 h-10 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    id="avatar-upload"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    agent: {
                                                                        ...prev.agent,
                                                                        avatar_url: event.target.result
                                                                    }
                                                                }));
                                                                toast.success('Avatar cargado correctamente');
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => document.getElementById('avatar-upload').click()}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        Subir avatar
                                                    </button>
                                                    {settings.agent?.avatar_url && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                if (window.confirm('¿Eliminar el avatar?')) {
                                                                    setSettings(prev => ({
                                                                        ...prev,
                                                                        agent: {
                                                                            ...prev.agent,
                                                                            avatar_url: ''
                                                                        }
                                                                    }));
                                                                    toast.success('Avatar eliminado');
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    💡 Genera una imagen con IA (Midjourney, DALL-E) de un empleado virtual realista. Recomendado: foto profesional, circular, 512x512px
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón guardar */}
                                    <div className="flex justify-end pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleSave("Configuración del Agente")}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-semibold shadow-lg"
                                        >
                                            {saving ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Guardar Configuración
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </SettingSection>
                        </div>
                    )}

                    {activeTab === "channels" && (
                        <SettingSection
                            title="Canales de Comunicación"
                            description="Gestión de canales de comunicación con clientes"
                            icon={<MessageSquare />}
                        >
                            <div className="space-y-6">
                                {/* Teléfono principal (llamadas) */}
                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Teléfono de reservas (llamadas)</h4>
                                                <p className="text-sm text-gray-600">Número donde hoy reciben llamadas</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.voice?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    voice: { ...prev.channels?.voice, enabled }
                                                }
                                            }))}
                                        />
                                    </div>
                                    {settings.channels?.voice?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Número de teléfono</label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.voice?.phone_number || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            voice: { ...prev.channels?.voice, phone_number: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="+34 600 000 000"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">WhatsApp Business</h4>
                                                <p className="text-sm text-gray-600">Canal principal de comunicación</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setShowHelpWA(v => !v)} className="text-gray-500 hover:text-gray-700">
                                            <HelpCircle className="w-5 h-5" />
                                        </button>
                                        <ToggleSwitch
                                            enabled={settings.channels?.whatsapp?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    whatsapp: { ...prev.channels?.whatsapp, enabled }
                                                }
                                            }))}
                                        />
                                    </div>
                                    {showHelpWA && (
                                        <div className="mb-4 p-2 rounded-lg bg-green-50 border border-green-200 text-sm text-gray-700">
                                            <p className="font-medium mb-1">¿Dónde consigo esto?</p>
                                            <ol className="list-decimal ml-5 space-y-1">
                                                <li>Indica el número que ya usas con tus clientes.</li>
                                                <li>Cuando activemos WhatsApp Business API te pediremos un código SMS/llamada.</li>
                                                <li>Si prefieres número nuevo, te lo damos listo y sin cortes.</li>
                                            </ol>
                                        </div>
                                    )}
                                    {settings.channels?.whatsapp?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="wa-same-number"
                                                    type="checkbox"
                                                    checked={settings.channels?.whatsapp?.use_same_phone ?? true}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            whatsapp: { ...prev.channels?.whatsapp, use_same_phone: e.target.checked }
                                                        }
                                                    }))}
                                                />
                                                <label htmlFor="wa-same-number" className="text-sm text-gray-700">Usar el mismo número de llamadas</label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Número de teléfono</label>
                                                <input
                                                    type="text"
                                                    value={(settings.channels?.whatsapp?.use_same_phone ? settings.channels?.voice?.phone_number : settings.channels?.whatsapp?.phone_number) || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            whatsapp: { ...prev.channels?.whatsapp, phone_number: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    placeholder="+34 600 000 000"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Web Chat</h4>
                                                <p className="text-sm text-gray-600">Chat integrado en la web</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.webchat?.enabled !== false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    webchat: { ...prev.channels?.webchat, enabled }
                                                }
                                            }))}
                                        />
                                    </div>
                                    {settings.channels?.webchat?.enabled !== false && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Dominio del sitio</label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.webchat?.site_domain || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            webchat: { ...prev.channels?.webchat, site_domain: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="restaurante.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Widget Key (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.webchat?.widget_key || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            webchat: { ...prev.channels?.webchat, widget_key: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Opcional"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-pink-50 p-6 rounded-xl border border-pink-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
                                                <Instagram className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Instagram</h4>
                                                <p className="text-sm text-gray-600">Mensajes directos automáticos</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setShowHelpIG(v => !v)} className="text-gray-500 hover:text-gray-700">
                                            <HelpCircle className="w-5 h-5" />
                                        </button>
                                        <ToggleSwitch
                                            enabled={settings.channels?.instagram?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    instagram: { ...prev.channels?.instagram, enabled }
                                                }
                                            }))}
                                        />
                                    </div>
                                    {showHelpIG && (
                                        <div className="mb-4 p-2 rounded-lg bg-pink-50 border border-pink-200 text-sm text-gray-700">
                                            <p className="font-medium mb-1">¿Cómo conectarlo?</p>
                                            <ol className="list-decimal ml-5 space-y-1">
                                                <li>Escribe tu @usuario o URL de Instagram.</li>
                                                <li>Déjanos un email para invitar a nuestro equipo como administrador.</li>
                                                <li>Nosotros hacemos el resto y activamos los mensajes automáticos.</li>
                                            </ol>
                                        </div>
                                    )}
                                    {settings.channels?.instagram?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario o URL de Instagram</label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.instagram?.handle || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            instagram: { ...prev.channels?.instagram, handle: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                    placeholder="@restaurante o https://instagram.com/restaurante"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email para invitarnos como administradores</label>
                                                <input
                                                    type="email"
                                                    value={settings.channels?.instagram?.invite_email || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            instagram: { ...prev.channels?.instagram, invite_email: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                                    placeholder="ops@tu-empresa.com"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
                                                <Facebook className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Facebook Messenger</h4>
                                                <p className="text-sm text-gray-600">Chat de página de Facebook</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setShowHelpFB(v => !v)} className="text-gray-500 hover:text-gray-700">
                                            <HelpCircle className="w-5 h-5" />
                                        </button>
                                        <ToggleSwitch
                                            enabled={settings.channels?.facebook?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    facebook: { ...prev.channels?.facebook, enabled }
                                                }
                                            }))}
                                        />
                                    </div>
                                    {showHelpFB && (
                                        <div className="mb-4 p-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-gray-700">
                                            <p className="font-medium mb-1">¿Cómo conectarlo?</p>
                                            <ol className="list-decimal ml-5 space-y-1">
                                                <li>Pega la URL de tu página de Facebook.</li>
                                                <li>Déjanos un email para invitar a nuestro equipo como administrador.</li>
                                                <li>Activamos el chat y empezamos a recibir mensajes.</li>
                                            </ol>
                                        </div>
                                    )}
                                    {settings.channels?.facebook?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">URL de la página</label>
                                                <input
                                                    type="url"
                                                    value={settings.channels?.facebook?.page_url || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            facebook: { ...prev.channels?.facebook, page_url: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                                                    placeholder="https://facebook.com/tu-pagina"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email para añadirnos como administradores</label>
                                                <input
                                                    type="email"
                                                    value={settings.channels?.facebook?.invite_email || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            facebook: { ...prev.channels?.facebook, invite_email: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
                                                    placeholder="ops@tu-empresa.com"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">VAPI - Llamadas IA</h4>
                                                <p className="text-sm text-gray-600">Asistente telefónico inteligente</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch
                                            enabled={settings.channels?.vapi?.enabled || false}
                                            onChange={(enabled) => setSettings(prev => ({
                                                ...prev,
                                                channels: {
                                                    ...prev.channels,
                                                    vapi: { ...prev.channels?.vapi, enabled }
                                                }
                                            }))}
                                        />
                                    </div>
                                    {settings.channels?.vapi?.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Número para el asistente (voz)</label>
                                                <input
                                                    type="text"
                                                    value={settings.channels?.vapi?.voice_number || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        channels: {
                                                            ...prev.channels,
                                                            vapi: { ...prev.channels?.vapi, voice_number: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="+34 910 000 000"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleSave("Canales de comunicación")}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Guardar Canales
                                </button>
                            </div>
                        </SettingSection>
                    )}

                    {activeTab === "notifications" && (
                        <SettingSection
                            title="Sistema de Notificaciones"
                            description="Configuración completa de alertas y notificaciones automáticas"
                            icon={<Bell />}
                        >
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        Notificaciones de Reservas
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-medium text-gray-900">Nueva reserva confirmada</h5>
                                                <p className="text-sm text-gray-600">Notificar cuando se confirme una nueva reserva</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.notifications?.new_reservation ?? false}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        new_reservation: enabled
                                                    }
                                                }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-medium text-gray-900">Reserva cancelada</h5>
                                                <p className="text-sm text-gray-600">Alerta cuando se cancele una reserva</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.notifications?.cancelled_reservation ?? false}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        cancelled_reservation: enabled
                                                    }
                                                }))}
                                            />
                                        </div>
                                        {/* Destinatarios y horario silencioso */}
                                        <div className="space-y-4 pt-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">📧 Emails para notificaciones de reservas</label>
                                                <input
                                                    type="text"
                                                    value={(settings.notifications?.reservation_emails || []).join(", ")}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            reservation_emails: e.target.value.split(',').map(x => x.trim()).filter(Boolean)
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="reservas@restaurante.com, gerente@restaurante.com"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Para nueva reserva, cancelada y modificada</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Horario silencioso (inicio)</label>
                                                <input
                                                    type="time"
                                                    value={settings.notifications?.quiet_hours?.start || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            quiet_hours: { ...prev.notifications?.quiet_hours, start: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Horario silencioso (fin)</label>
                                                <input
                                                    type="time"
                                                    value={settings.notifications?.quiet_hours?.end || ""}
                                                    onChange={(e) => setSettings(prev => ({
                                                        ...prev,
                                                        notifications: {
                                                            ...prev.notifications,
                                                            quiet_hours: { ...prev.notifications?.quiet_hours, end: e.target.value }
                                                        }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-medium text-gray-900">Reserva modificada</h5>
                                                <p className="text-sm text-gray-600">Cambios de hora, mesa o comensales</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.notifications?.reservation_modified ?? false}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        reservation_modified: enabled
                                                    }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                </div>


                                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-green-600" />
                                        Notificaciones del Sistema
                                    </h4>
                                    <div className="space-y-4">
                                        {/* Emails para notificaciones del sistema */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">⚙️ Emails para notificaciones del sistema</label>
                                            <input
                                                type="text"
                                                value={(settings.notifications?.system_emails || []).join(", ")}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        system_emails: e.target.value.split(',').map(x => x.trim()).filter(Boolean)
                                                    }
                                                }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="admin@restaurante.com, soporte@restaurante.com"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Para errores del sistema, agente offline e integraciones</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-medium text-gray-900">Agente IA desconectado</h5>
                                                <p className="text-sm text-gray-600">Alerta si el agente IA deja de funcionar</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.notifications?.agent_offline ?? false}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        agent_offline: enabled
                                                    }
                                                }))}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="font-medium text-gray-900">Errores de integración</h5>
                                                <p className="text-sm text-gray-600">Notificar errores en canales o integraciones</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={settings.notifications?.integration_errors ?? false}
                                                onChange={(enabled) => setSettings(prev => ({
                                                    ...prev,
                                                    notifications: {
                                                        ...prev.notifications,
                                                        integration_errors: enabled
                                                    }
                                                }))}
                                            />
                                        </div>
                                        
                                        {/* Nueva sección: Errores del Sistema */}
                                        <div className="border-t border-green-200 pt-4 mt-4">
                                            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                                Errores del Sistema
                                            </h5>
                                            <div className="space-y-3 ml-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h6 className="font-medium text-gray-800">Fallo crítico al guardar</h6>
                                                        <p className="text-xs text-gray-600">Reservas, configuración o datos de cliente no se guardan</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications?.system_save_errors ?? true}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                system_save_errors: enabled
                                                            }
                                                        }))}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h6 className="font-medium text-gray-800">Problema de conexión</h6>
                                                        <p className="text-xs text-gray-600">Fallos de red, autenticación o timeouts</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications?.system_connection_errors ?? true}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                system_connection_errors: enabled
                                                            }
                                                        }))}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h6 className="font-medium text-gray-800">Conflicto de reservas</h6>
                                                        <p className="text-xs text-gray-600">Mesa doble-asignada u horarios solapados</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications?.system_reservation_conflicts ?? true}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                system_reservation_conflicts: enabled
                                                            }
                                                        }))}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h6 className="font-medium text-gray-800">Configuración incompleta</h6>
                                                        <p className="text-xs text-gray-600">Sin mesas, horarios o setup básico</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        enabled={settings.notifications?.system_config_incomplete ?? true}
                                                        onChange={(enabled) => setSettings(prev => ({
                                                            ...prev,
                                                            notifications: {
                                                                ...prev.notifications,
                                                                system_config_incomplete: enabled
                                                            }
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => handleSave("Configuración de notificaciones")}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Guardar Notificaciones
                                </button>
                            </div>
                        </SettingSection>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Configuracion;


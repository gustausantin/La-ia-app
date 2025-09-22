// Configuracion.jsx - Panel de Configuración COMPLETO SIN ERRORES
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
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

// Componente ToggleSwitch robusto
const ToggleSwitch = ({ enabled, onChange, label }) => {
    return (
        <div className="flex items-center gap-3">
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

// Componente SettingSection robusto
const SettingSection = ({ title, description, icon, premium, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                {title}
                                {premium && <Crown className="w-4 h-4 text-purple-500" />}
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
    const location = useLocation();
    
    // 🎯 DETECTAR TAB DESDE URL PARAMS
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        
        // Mapear tabs válidos
        const validTabs = {
            'general': 'general',
            'hours': 'hours', 
            'reservations': 'reservations',
            'agent': 'agent',
            'crm': 'crm',
            'channels': 'channels',
            'workflows': 'workflows',
            'notifications': 'notifications',
            'team': 'team',
            'billing': 'billing',
            'integrations': 'integrations'
        };
        
        return validTabs[tabParam] || 'general';
    };
    
    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // 🎯 ESCUCHAR CAMBIOS EN URL PARAMS
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        
        if (tabParam && tabParam !== activeTab) {
            const validTabs = {
                'general': 'general',
                'hours': 'hours', 
                'reservations': 'reservations',
                'agent': 'agent',
                'crm': 'crm',
                'channels': 'channels',
                'workflows': 'workflows',
                'notifications': 'notifications',
                'team': 'team',
                'billing': 'billing',
                'integrations': 'integrations'
            };
            
            if (validTabs[tabParam]) {
                setActiveTab(validTabs[tabParam]);
            }
        }
    }, [location.search, activeTab]);
    
    // ESTADO ULTRA ROBUSTO - ESTRUCTURA COMPLETA GARANTIZADA
    const [settings, setSettings] = useState({
        // Información general
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
        capacity_total: 0, // Configurable por cada restaurante
        price_range: "â‚¬â‚¬ - Moderado (25-45â‚¬)",
        instagram_handle: "",
        facebook_page: "",
        tripadvisor_url: "",
        google_maps_url: "",
        opening_year: new Date().getFullYear(),
        parking_available: false,
        wifi_available: true,
        accepts_groups: true,
        private_events: true,
        outdoor_seating: false,
        delivery_available: false,
        takeout_available: true,


        // CRM IA - desde BD Ãºnicamente
        crm: {},

        // Agente IA - desde BD Ãºnicamente
        agent: {},

        // Canales - desde BD Ãºnicamente
        channels: {},

        // Notificaciones - desde BD Ãºnicamente
        notifications: {},
        
        // Horarios - desde BD únicamente
        operating_hours: {}
    });

    // Tabs de navegación
    const settingsTabs = [
        {
            id: "general",
            label: "General",
            icon: <Building2 className="w-4 h-4" />,
        },
        { 
            id: "hours", 
            label: "Horarios", 
            icon: <Clock className="w-4 h-4" />,
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

    // Cargar configuración
    useEffect(() => {
        const loadSettings = async () => {
            if (!restaurantId) {
                console.log("âŒ No restaurant ID available");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("ðŸ”„ Cargando configuraciÃ³n para restaurant:", restaurantId);

                const { data: restaurant, error } = await supabase
                    .from("restaurants")
                    .select("*")
                    .eq("id", restaurantId)
                    .single();

                if (error) {
                    console.error("âŒ Error cargando restaurant:", error);
                    throw error;
                }

                if (restaurant) {
                   
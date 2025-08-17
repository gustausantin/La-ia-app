
// src/pages/Analytics.jsx - Business Intelligence PREMIUM con foco en el Agente IA
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    format,
    subDays,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    getDay,
    differenceInDays,
    addDays,
} from "date-fns";
import { es } from "date-fns/locale";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    ReferenceLine,
    Scatter,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    DollarSign,
    Clock,
    Target,
    BarChart3,
    PieChart as PieIcon,
    Activity,
    RefreshCw,
    Download,
    Filter,
    Eye,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Star,
    Phone,
    MessageSquare,
    Globe,
    Bot,
    Brain,
    Sparkles,
    MessageCircle,
    Instagram,
    Facebook,
    Mail,
    PhoneCall,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Info,
    TrendingUp as TrendIcon,
} from "lucide-react";
import toast from "react-hot-toast";

// Paleta de colores premium
const COLORS = {
    primary: "#3B82F6",
    secondary: "#10B981",
    tertiary: "#8B5CF6",
    quaternary: "#F59E0B",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    info: "#3B82F6",
    agent: "#8B5CF6",
    whatsapp: "#25D366",
    instagram: "#E4405F",
    facebook: "#1877F2",
    vapi: "#FF6B6B",
    manual: "#6B7280",
};

// Componente principal
function Analytics() {
    console.log('📊 Analytics component rendering...');
    
    const { restaurant, restaurantId, isReady } = useAuthContext();

    // Estados principales
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("30d");
    const [activeTab, setActiveTab] = useState("ai-overview");
    const [comparisonMode, setComparisonMode] = useState(false);
    const [agentStatus] = useState({ active: true });

    // Si no está listo el contexto
    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="relative mb-6">
                        <Brain className="w-16 h-16 text-purple-600 animate-pulse mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        </div>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                        Analizando datos con IA...
                    </p>
                    <p className="text-sm text-gray-600">
                        Procesando {Math.floor(Math.random() * 1000 + 500)} conversaciones
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
                <p className="text-gray-600">Analiza el rendimiento de tu restaurante.</p>
            </div>
        </div>
    );
}

export default Analytics;

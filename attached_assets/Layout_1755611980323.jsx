// src/components/Layout.jsx - Versión CORREGIDA sin estado duplicado
import { NavLink, Outlet } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { useState } from "react";
import {
    Home,
    Calendar,
    Users,
    Briefcase,
    BarChart2,
    Settings,
    Clock,
    MessageSquare,
    Bot,
    Bell,
    ChevronDown,
    LogOut,
    Phone,
    MessageCircle,
    Mail,
    Instagram,
    Facebook,
    Activity,
    Zap,
} from "lucide-react";

export default function Layout() {
    // Obtener TODOS los datos necesarios del contexto global
    const {
        user,
        restaurant,
        signOut,
        agentStatus, // NUEVO - del contexto
        notifications, // NUEVO - del contexto
        unreadCount, // NUEVO - del contexto
        markNotificationAsRead, // NUEVO - del contexto
        markAllNotificationsAsRead, // NUEVO - del contexto
    } = useAuthContext();

    // Solo estados locales para UI
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Ya no necesitamos:
    // - useState para notifications (viene del contexto)
    // - useState para agentStatus (viene del contexto)
    // - useEffect para simular notificaciones (vienen del contexto real-time)

    const menuItems = [
        { name: "Dashboard", path: "/dashboard", icon: Home, badge: null },
        { name: "Reservas", path: "/reservas", icon: Calendar, badge: "12" },
        {
            name: "Comunicación",
            path: "/comunicacion",
            icon: MessageSquare,
            badge: agentStatus.activeConversations || 0,
        },
        { name: "Clientes", path: "/clientes", icon: Users, badge: null },
        { name: "Mesas", path: "/mesas", icon: Briefcase, badge: null },
        {
            name: "Calendario",
            path: "/calendario",
            icon: Calendar,
            badge: null,
        }, // ACTUALIZADO de Horarios a Calendario
        { name: "Analytics", path: "/analytics", icon: BarChart2, badge: null },
        {
            name: "Agente IA",
            path: "/configuracion",
            icon: Bot,
            badge: agentStatus.pendingActions || 0,
        },
        {
            name: "Configuración",
            path: "/configuracion",
            icon: Settings,
            badge: null,
        },
    ];

    // Función helper para formatear tiempo de notificación
    const formatNotificationTime = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000 / 60); // minutos

        if (diff < 1) return "Ahora";
        if (diff < 60) return `${diff} min`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h`;
        return `${Math.floor(diff / 1440)}d`;
    };

    // Función helper para obtener el ícono de notificación
    const getNotificationIcon = (type) => {
        const icons = {
            reservation: Calendar,
            agent: Bot,
            system: Activity,
            alert: Bell,
        };
        return icons[type] || Bell;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                {/* Logo y Estado del Agente */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Bot className="w-8 h-8 text-purple-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Son-IA
                                </h1>
                                <p className="text-xs text-gray-500">
                                    Sistema Operativo IA
                                </p>
                            </div>
                        </div>
                        <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                                agentStatus.active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                        >
                            {agentStatus.active ? "Activo" : "Inactivo"}
                        </span>
                    </div>
                    {agentStatus.active && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center space-x-1 text-gray-600">
                                <MessageCircle className="w-3 h-3" />
                                <span>
                                    {agentStatus.activeConversations} activas
                                </span>
                            </div>
                            <div className="flex items-center space-x-1 text-orange-600">
                                <Activity className="w-3 h-3" />
                                <span>
                                    {agentStatus.pendingActions} pendientes
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info del Restaurante */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {restaurant?.name || "Cargando..."}
                    </h3>
                    <p className="text-sm text-gray-600 truncate mt-1">
                        {user?.email}
                    </p>

                    {/* Canales Activos - usando datos del contexto */}
                    <div className="flex items-center space-x-2 mt-3">
                        <Phone
                            className={`w-4 h-4 ${agentStatus.channels?.vapi ? "text-green-600" : "text-gray-400"}`}
                        />
                        <MessageCircle
                            className={`w-4 h-4 ${agentStatus.channels?.whatsapp ? "text-green-600" : "text-gray-400"}`}
                        />
                        <Mail
                            className={`w-4 h-4 ${agentStatus.channels?.email ? "text-green-600" : "text-gray-400"}`}
                        />
                        <Instagram
                            className={`w-4 h-4 ${agentStatus.channels?.instagram ? "text-green-600" : "text-gray-400"}`}
                        />
                        <Facebook
                            className={`w-4 h-4 ${agentStatus.channels?.facebook ? "text-green-600" : "text-gray-400"}`}
                        />
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`
                            }
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                            {item.badge && item.badge > 0 && (
                                <span
                                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                                        item.name === "Agente IA" &&
                                        item.badge > 0
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
                                    }`}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Plan y Acciones */}
                <div className="p-4 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                                Plan Pro
                            </span>
                            <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-xs text-gray-600">
                            <div>1,247 conversaciones este mes</div>
                            <div className="text-purple-600 font-medium">
                                3,000 incluidas
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {menuItems.find((item) =>
                                    window.location.pathname.includes(
                                        item.path,
                                    ),
                                )?.name || "Dashboard"}
                            </h2>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Notificaciones - ahora del contexto global */}
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setShowNotifications(!showNotifications)
                                    }
                                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">
                                                Notificaciones
                                            </h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={
                                                        markAllNotificationsAsRead
                                                    }
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Marcar todas como leídas
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications
                                                    .slice(0, 10)
                                                    .map((notification) => {
                                                        const NotificationIcon =
                                                            getNotificationIcon(
                                                                notification.type,
                                                            );
                                                        return (
                                                            <div
                                                                key={
                                                                    notification.id
                                                                }
                                                                className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                                                    !notification.read
                                                                        ? "bg-blue-50"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    markNotificationAsRead(
                                                                        notification.id,
                                                                    )
                                                                }
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div
                                                                        className={`p-2 rounded-lg ${
                                                                            notification.type ===
                                                                            "agent"
                                                                                ? "bg-purple-100"
                                                                                : notification.type ===
                                                                                    "reservation"
                                                                                  ? "bg-blue-100"
                                                                                  : notification.type ===
                                                                                      "alert"
                                                                                    ? "bg-orange-100"
                                                                                    : "bg-gray-100"
                                                                        }`}
                                                                    >
                                                                        <NotificationIcon
                                                                            className={`w-4 h-4 ${
                                                                                notification.type ===
                                                                                "agent"
                                                                                    ? "text-purple-600"
                                                                                    : notification.type ===
                                                                                        "reservation"
                                                                                      ? "text-blue-600"
                                                                                      : notification.type ===
                                                                                          "alert"
                                                                                        ? "text-orange-600"
                                                                                        : "text-gray-600"
                                                                            }`}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-900">
                                                                            {
                                                                                notification.message
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {formatNotificationTime(
                                                                                notification.timestamp,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    {!notification.read && (
                                                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div className="p-8 text-center text-gray-500">
                                                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <p>No hay notificaciones</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 10 && (
                                            <div className="p-3 text-center border-t border-gray-200">
                                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                    Ver todas las notificaciones
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Menú de usuario */}
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setShowUserMenu(!showUserMenu)
                                    }
                                    className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {user?.email
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                        <div className="p-4 border-b border-gray-200">
                                            <p className="font-semibold text-gray-900">
                                                {restaurant?.name}
                                            </p>
                                            <p className="text-sm text-gray-600 truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <div className="p-2">
                                            <NavLink
                                                to="/configuracion"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                                                onClick={() =>
                                                    setShowUserMenu(false)
                                                }
                                            >
                                                <Settings className="w-4 h-4 inline mr-2" />
                                                Configuración
                                            </NavLink>
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    signOut();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                                            >
                                                <LogOut className="w-4 h-4 inline mr-2" />
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

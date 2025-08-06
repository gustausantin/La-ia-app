// src/components/NotificationCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { 
    Bell, 
    X, 
    Check, 
    AlertCircle, 
    Info, 
    CheckCircle2,
    Bot,
    Calendar,
    Users,
    MessageSquare,
    Clock,
    TrendingUp,
    AlertTriangle,
    Trash2,
    Archive
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos de notificaciones con iconos y colores
const NOTIFICATION_TYPES = {
    agent_alert: {
        icon: Bot,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        title: 'Alerta del Agente'
    },
    new_reservation: {
        icon: Calendar,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        title: 'Nueva Reserva'
    },
    customer_action: {
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        title: 'Acción de Cliente'
    },
    conversation: {
        icon: MessageSquare,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        title: 'Conversación'
    },
    system: {
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        title: 'Sistema'
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        title: 'Advertencia'
    },
    success: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        title: 'Éxito'
    },
    error: {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        title: 'Error'
    }
};

export default function NotificationCenter({ isOpen, onClose }) {
    const { 
        notifications, 
        unreadCount, 
        markNotificationAsRead, 
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications 
    } = useAuthContext();

    const [filter, setFilter] = useState('all'); // all, unread, agent, system
    const [selectedNotification, setSelectedNotification] = useState(null);

    // Filtrar notificaciones según el filtro activo
    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.read;
        if (filter === 'agent') return notification.type.includes('agent');
        if (filter === 'system') return notification.type === 'system';
        return true;
    });

    // Agrupar notificaciones por fecha
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = format(new Date(notification.created_at), 'yyyy-MM-dd');
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notification);
        return groups;
    }, {});

    // Manejar clic en notificación
    const handleNotificationClick = useCallback((notification) => {
        if (!notification.read) {
            markNotificationAsRead(notification.id);
        }
        setSelectedNotification(notification);

        // Navegar según el tipo de notificación
        if (notification.link) {
            window.location.href = notification.link;
            onClose();
        }
    }, [markNotificationAsRead, onClose]);

    // Marcar todas como leídas al abrir
    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            // Marcar como leídas después de 2 segundos
            const timer = setTimeout(() => {
                markAllNotificationsAsRead();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, unreadCount, markAllNotificationsAsRead]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={onClose}
            />

            {/* Panel de notificaciones */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Bell className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Notificaciones</h2>
                            {unreadCount > 0 && (
                                <span className="bg-white text-purple-600 text-xs font-bold px-2 py-1 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="flex gap-2">
                        {['all', 'unread', 'agent', 'system'].map((filterType) => (
                            <button
                                key={filterType}
                                onClick={() => setFilter(filterType)}
                                className={`
                                    px-3 py-1 rounded-full text-sm font-medium transition-all
                                    ${filter === filterType 
                                        ? 'bg-white text-purple-600' 
                                        : 'bg-white/20 text-white hover:bg-white/30'}
                                `}
                            >
                                {filterType === 'all' && 'Todas'}
                                {filterType === 'unread' && `No leídas (${unreadCount})`}
                                {filterType === 'agent' && 'Agente IA'}
                                {filterType === 'system' && 'Sistema'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions Bar */}
                {notifications.length > 0 && (
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <button
                            onClick={markAllNotificationsAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            <Check className="w-4 h-4" />
                            Marcar todas como leídas
                        </button>
                        <button
                            onClick={clearAllNotifications}
                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Limpiar todo
                        </button>
                    </div>
                )}

                {/* Lista de notificaciones */}
                <div className="flex-1 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-center">
                                No hay notificaciones {filter !== 'all' && `de tipo "${filter}"`}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                                <div key={date}>
                                    {/* Fecha */}
                                    <div className="px-4 py-2 bg-gray-50">
                                        <p className="text-sm font-medium text-gray-600">
                                            {format(new Date(date), "d 'de' MMMM", { locale: es })}
                                        </p>
                                    </div>

                                    {/* Notificaciones del día */}
                                    {dateNotifications.map((notification) => {
                                        const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
                                        const Icon = config.icon;

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`
                                                    p-4 hover:bg-gray-50 cursor-pointer transition-colors
                                                    ${!notification.read ? 'bg-blue-50/50' : ''}
                                                `}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icono */}
                                                    <div className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                                        ${config.bgColor}
                                                    `}>
                                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                                    </div>

                                                    {/* Contenido */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">
                                                                    {notification.title || config.title}
                                                                </p>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {notification.message}
                                                                </p>
                                                                {notification.metadata && (
                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                        {notification.metadata.channel && (
                                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                                {notification.metadata.channel}
                                                                            </span>
                                                                        )}
                                                                        {notification.metadata.count && (
                                                                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                                                                                {notification.metadata.count} items
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                                addSuffix: true,
                                                                locale: es
                                                            })}
                                                        </p>
                                                    </div>

                                                    {/* Acción de eliminar */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con estadísticas */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            {filteredNotifications.length} notificaciones
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Bot className="w-4 h-4 text-purple-600" />
                                <span className="text-gray-600">
                                    {notifications.filter(n => n.type.includes('agent')).length} del agente
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-gray-600">
                                    {notifications.filter(n => n.priority === 'high').length} importantes
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
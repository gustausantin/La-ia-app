// src/components/NotificationCenter.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function NotificationCenter({ restaurant }) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]); // ← siempre array

  useEffect(() => {
    if (!restaurant?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!isMounted) return;

      if (error) {
        console.error("Notif error:", error);
        setNotifications([]);
      } else {
        setNotifications(Array.isArray(data) ? data : []); // ← guardia
      }
      setLoading(false);
    })();

    return () => { isMounted = false; };
  }, [restaurant?.id]);

  if (loading) return <div>Cargando notificaciones…</div>;

  const list = Array.isArray(notifications) ? notifications : [];

  // Separar leídas y no leídas con fallbacks seguros
  const unread = list.filter(n => n && !n.read);
  const read = list.filter(n => n && n.read);

  return (
    <div>
      <h3>Notificaciones ({unread.length} sin leer)</h3>
      {/* Content - Solo mostrar si hay notificaciones */}
            <div className="flex-1 p-6">
                {notifications && notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.slice(0, 10).map((notification) => {
                            const Icon = getNotificationIcon(notification.type);
                            const timeAgo = formatNotificationTime(notification.timestamp);

                            return (
                                <div
                                    key={notification.id}
                                    className={`p-4 rounded-lg border transition-all duration-200 hover:bg-gray-50 cursor-pointer ${
                                        notification.read
                                            ? 'bg-white border-gray-200'
                                            : 'bg-blue-50 border-blue-200'
                                    }`}
                                    onClick={() => markNotificationAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${getNotificationBg(notification.type)}`}>
                                            <Icon className={`w-4 h-4 ${getNotificationColor(notification.type)}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                    {notification.message}
                                                </p>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    {timeAgo}
                                                </span>
                                            </div>
                                            {notification.priority === 'high' && (
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                                    Urgente
                                                </span>
                                            )}
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="text-gray-300 opacity-50">
                            <Bell className="w-8 h-8 mx-auto mb-2" />
                        </div>
                    </div>
                )}
    </div>
  );
}
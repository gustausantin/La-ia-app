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
      {list.length === 0 ? (
        <div>No hay notificaciones</div>
      ) : (
        <ul>
          {list.map(n => (
            <li key={n.id}>
              <strong>{n.title || n.type}</strong> — {n.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
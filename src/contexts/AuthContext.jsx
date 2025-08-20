import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

// IMPORTANTE: null para que el hook avise si falta el Provider
const AuthContext = createContext(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [agentStatus, setAgentStatus] = useState({
    active: true,
    activeConversations: 0,
    pendingActions: 0,
    channels: {
      vapi: true,
      whatsapp: true,
      email: true,
      instagram: false,
      facebook: false,
    },
  });

  // ====== DEFENSAS CONTRA BUCLES ======
  const bootedRef = useRef(false); // evita doble init por StrictMode
  const subRef = useRef(null); // para desuscribir bien
  const lastSignInUserRef = useRef(null); // evita SIGNED_IN repetidos

  const withTimeout = (p, ms = 8000, label = "OP") =>
    Promise.race([
      p,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`TIMEOUT_${label}`)), ms),
      ),
    ]);

  // --------- DATA FETCHERS (no tocan isReady) ----------
  const fetchRestaurantInfo = async (userId) => {
    console.log("🔍 Fetching restaurant info for user:", userId);
    if (!userId) {
      console.warn("⚠️ No userId provided");
      setRestaurant(null);
      setRestaurantId(null);
      return;
    }
    try {
      const { data: mappingData, error: mappingError } = await withTimeout(
        supabase
          .from("user_restaurant_mapping")
          .select(
            `
            role,
            permissions,
            restaurant:restaurant_id (
              id, name, email, phone, address, city, postal_code, country,
              timezone, currency, logo_url, website, active, trial_end_at,
              subscription_status, agent_config, settings, created_at, updated_at,
              ui_cuisine_type
            )
          `,
          )
          .eq("auth_user_id", userId)
          .maybeSingle(), // <- evita error duro si no hay fila
        8000,
        "MAPPING",
      );

      if (mappingData?.restaurant) {
        console.log("✅ Restaurant via mapping:", mappingData.restaurant.name);
        setRestaurant(mappingData.restaurant);
        setRestaurantId(mappingData.restaurant.id);
        return;
      }

      if (mappingError && mappingError.code !== "PGRST116") {
        console.error("❌ DB error (mapping):", mappingError);
      }

      console.log("📋 No mapping; trying direct...");
      const { data: restaurantData, error: restaurantError } =
        await withTimeout(
          supabase
            .from("restaurants")
            .select("*")
            .eq("auth_user_id", userId)
            .maybeSingle(),
          8000,
          "DIRECT",
        );

      if (restaurantData) {
        console.log("✅ Restaurant direct:", restaurantData.name);
        setRestaurant(restaurantData);
        setRestaurantId(restaurantData.id);
      } else {
        if (restaurantError && restaurantError.code !== "PGRST116") {
          console.error("❌ DB error (direct):", restaurantError);
        }
        console.log("🏪 No restaurant found");
        setRestaurant(null);
        setRestaurantId(null);
      }
    } catch (err) {
      console.error("❌ fetchRestaurantInfo error:", err?.message || err);
      setRestaurant(null);
      setRestaurantId(null);
    } finally {
      console.log("✅ fetchRestaurantInfo FINISHED");
    }
  };

  const loadUserData = async (u) => {
    console.log("🔄 Loading user data for:", u.email);
    setLoading(true);
    try {
      setUser(u);
      setIsAuthenticated(true);
      await fetchRestaurantInfo(u.id);
    } catch (err) {
      console.error("❌ Error in loadUserData:", err);
    } finally {
      setLoading(false);
      setIsReady(true); // <- GARANTÍA de salida
      console.log("✅ loadUserData completed (isReady=true)");
    }
  };

  // --------- SESIÓN ----------
  const initSession = async () => {
    console.log("🚀 Initializing auth...");
    setIsReady(false);
    setLoading(true);
    try {
      const {
        data: { session },
        error,
      } = await withTimeout(supabase.auth.getSession(), 8000, "GET_SESSION");
      if (error) throw error;

      if (session?.user) {
        console.log("✅ Session found:", session.user.email);
        await loadUserData(session.user); // fija isReady en su finally
      } else {
        console.log("❌ No session found");
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
      }
    } catch (err) {
      console.error("❌ Error in initSession:", err?.message || err);
      setUser(null);
      setIsAuthenticated(false);
      setRestaurant(null);
      setRestaurantId(null);
    } finally {
      setLoading(false);
      setIsReady(true); // <- SIEMPRE salimos de "cargando"
      console.log("✅ initSession completed (isReady=true)");
    }
  };

  // --------- EFFECT PRINCIPAL ----------
  useEffect(() => {
    if (bootedRef.current) return; // evita doble boot en dev
    bootedRef.current = true;

    (async () => {
      await initSession();
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 Auth state changed:", event);

      // Evitar ruido
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;

      if (event === "SIGNED_IN" && session?.user) {
        // Evita llamar dos veces con el mismo usuario
        if (lastSignInUserRef.current === session.user.id) {
          console.log("↩️ SIGNED_IN duplicado ignorado");
          return;
        }
        lastSignInUserRef.current = session.user.id;
        setIsReady(false);
        await loadUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        lastSignInUserRef.current = null;
        setUser(null);
        setIsAuthenticated(false);
        setRestaurant(null);
        setRestaurantId(null);
        setLoading(false);
        setIsReady(true);
        console.log("👋 User signed out (isReady=true)");
      }
    });

    subRef.current = subscription;
    return () => subRef.current?.unsubscribe();
  }, []);

  // --------- AUTH HELPERS ----------
  const login = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("¡Bienvenido de vuelta!");
      return { success: true };
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "Error al iniciar sesión");
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            restaurant_name: userData.restaurantName,
            owner_name: userData.ownerName,
          },
        },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        toast.success(
          "¡Registro exitoso! Revisa tu email para confirmar tu cuenta.",
        );
        return { success: true, needsConfirmation: true };
      } else {
        toast.success("¡Cuenta creada exitosamente!");
        return { success: true, needsConfirmation: false };
      }
    } catch (error) {
      console.error("❌ Register error:", error);
      toast.error(error.message || "Error en el registro");
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 Cerrando sesión...");
      await supabase.auth.signOut();
      console.log("✅ Sesión cerrada correctamente");
      toast.success("Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  // --------- NOTIFS ----------
  const addNotification = (n) => {
    const newN = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...n,
    };
    setNotifications((prev) => [newN, ...prev].slice(0, 50));
  };
  const markNotificationAsRead = (id) =>
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  const clearNotifications = () => setNotifications([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    user,
    restaurant,
    restaurantId,
    restaurantInfo: restaurant,
    isAuthenticated,
    isReady,
    loading,
    notifications,
    agentStatus,
    unreadCount,
    login,
    register,
    logout,
    signOut: logout,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead: clearNotifications,
    clearNotifications,
    fetchRestaurantInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

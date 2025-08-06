// lib/supabase.js - Configuración avanzada para Son-IA
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

// Configuración de variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Configuración avanzada del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: "sonia-auth-token",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-application-name": "Son-IA",
    },
  },
  db: {
    schema: "public",
  },
});

// ============================================
// HELPERS DE CONEXIÓN Y ESTADO
// ============================================

// Test de conexión mejorado
export const testConnection = async () => {
  const startTime = Date.now();

  try {
    // Primero verificar si hay sesión activa
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("⏳ No hay sesión activa, saltando test de conexión");
      return { connected: false, error: "No authenticated session" };
    }

    const { data, error } = await supabase
      .from("restaurants")
      .select("name")
      .limit(1)
      .single();

    if (error) throw error;

    const responseTime = Date.now() - startTime;
    console.log(`✅ Supabase connected successfully (${responseTime}ms)`);

    // Test adicional de real-time
    const channel = supabase.channel("test-channel");
    await channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("✅ Real-time connection working");
        channel.unsubscribe();
      }
    });

    return { connected: true, responseTime };
  } catch (error) {
    console.error("❌ Supabase connection failed:", error.message);
    return { connected: false, error: error.message };
  }
};

// Monitor de estado de conexión
export const connectionMonitor = {
  isOnline: true,
  listeners: new Set(),
  intervalId: null,

  start() {
    // Solo iniciar si hay sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.log("⏳ Monitor de conexión esperando autenticación");
        return;
      }

      // Verificar cada 30 segundos
      this.intervalId = setInterval(async () => {
        const { connected } = await testConnection();
        if (connected !== this.isOnline) {
          this.isOnline = connected;
          this.notifyListeners(connected);
        }
      }, 30000);
    });
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notifyListeners(isOnline) {
    this.listeners.forEach((callback) => callback(isOnline));
  },
};

// ============================================
// HELPERS PARA QUERIES COMUNES
// ============================================

// Helper para queries con reintentos
export const queryWithRetry = async (queryFn, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn();
      if (result.error) throw result.error;
      return result;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError;
};

// Helper para queries paginadas
export const paginatedQuery = async (
  table,
  {
    select = "*",
    filters = {},
    orderBy = "created_at",
    orderAscending = false,
    pageSize = 50,
    page = 0,
  },
) => {
  let query = supabase.from(table).select(select, { count: "exact" });

  // Aplicar filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });

  // Ordenamiento y paginación
  query = query.order(orderBy, { ascending: orderAscending });
  query = query.range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data,
    totalCount: count,
    pageCount: Math.ceil(count / pageSize),
    currentPage: page,
    hasMore: (page + 1) * pageSize < count,
  };
};

// ============================================
// FUNCIONES ESPECÍFICAS DEL AGENTE IA
// ============================================

export const agentQueries = {
  // Obtener conversaciones activas del agente
  async getActiveConversations(restaurantId) {
    return queryWithRetry(() =>
      supabase
        .from("conversations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("state", "active")
        .order("started_at", { ascending: false }),
    );
  },

  // Marcar conversación como procesada
  async markConversationProcessed(conversationId) {
    return supabase
      .from("conversations")
      .update({
        state: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  },

  // Obtener métricas del agente
  async getAgentMetrics(restaurantId, date = new Date()) {
    const dateStr = date.toISOString().split("T")[0];

    return supabase
      .from("agent_metrics")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("date", dateStr)
      .single();
  },

  // Crear reserva desde el agente
  async createReservationFromAgent(reservationData) {
    const enrichedData = {
      ...reservationData,
      source: "agent",
      created_at: new Date().toISOString(),
    };

    return supabase.from("reservations").insert(enrichedData).select().single();
  },
};

// ============================================
// HELPERS DE REAL-TIME
// ============================================

export class RealtimeSubscription {
  constructor(channel, table, filters = {}, callback) {
    this.channel = channel;
    this.table = table;
    this.filters = filters;
    this.callback = callback;
    this.subscription = null;
  }

  subscribe() {
    let query = supabase.channel(this.channel).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: this.table,
        filter: this.buildFilter(),
      },
      (payload) => {
        console.log(`Realtime event on ${this.table}:`, payload);
        this.callback(payload);
      },
    );

    this.subscription = query.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`✅ Subscribed to ${this.table} changes`);
      }
    });

    return this;
  }

  buildFilter() {
    // Construir string de filtro para real-time
    return Object.entries(this.filters)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join("&");
  }

  unsubscribe() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      console.log(`🔴 Unsubscribed from ${this.table} changes`);
    }
  }
}

// Helper para subscripciones múltiples
export const subscribeToMultiple = (subscriptions) => {
  const activeSubscriptions = subscriptions.map((sub) => sub.subscribe());

  return () => {
    activeSubscriptions.forEach((sub) => sub.unsubscribe());
  };
};

// ============================================
// INTERCEPTORES Y MANEJO DE ERRORES
// ============================================

// Wrapper para manejar errores globalmente
export const handleSupabaseError = (error, customMessage) => {
  console.error("Supabase Error:", error);

  let userMessage = customMessage || "Ha ocurrido un error";

  // Mensajes de error específicos
  if (error.code === "PGRST301") {
    userMessage = "No tienes permisos para realizar esta acción";
  } else if (error.code === "23505") {
    userMessage = "Este registro ya existe";
  } else if (error.code === "42P01") {
    userMessage = "Error de configuración en la base de datos";
  } else if (error.message?.includes("JWT")) {
    userMessage = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente";
  }

  toast.error(userMessage);

  return {
    error: true,
    message: userMessage,
    details: error,
  };
};

// Wrapper para queries con loading y error handling
export const executeQuery = async (queryFn, options = {}) => {
  const {
    loadingMessage = "Cargando...",
    successMessage = null,
    errorMessage = "Error al cargar datos",
    showToast = true,
  } = options;

  let loadingToast;

  if (showToast && loadingMessage) {
    loadingToast = toast.loading(loadingMessage);
  }

  try {
    const result = await queryFn();

    if (result.error) {
      throw result.error;
    }

    if (showToast) {
      toast.dismiss(loadingToast);
      if (successMessage) {
        toast.success(successMessage);
      }
    }

    return { data: result.data, error: null };
  } catch (error) {
    if (showToast) {
      toast.dismiss(loadingToast);
    }

    return handleSupabaseError(error, errorMessage);
  }
};

// ============================================
// UTILIDADES ADICIONALES
// ============================================

// Helper para subir archivos
export const uploadFile = async (bucket, path, file, options = {}) => {
  const {
    onProgress,
    maxSize = 5 * 1024 * 1024, // 5MB por defecto
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  } = options;

  // Validaciones
  if (file.size > maxSize) {
    throw new Error(`El archivo no debe superar ${maxSize / 1024 / 1024}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido. Usa: ${allowedTypes.join(", ")}`,
    );
  }

  return executeQuery(
    () =>
      supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        onUploadProgress: onProgress,
      }),
    {
      loadingMessage: "Subiendo archivo...",
      successMessage: "Archivo subido correctamente",
      errorMessage: "Error al subir el archivo",
    },
  );
};

// Helper para obtener URL pública de archivo
export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper para gestión de sesiones
export const sessionHelpers = {
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  },

  async getSessionInfo() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return null;

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const minutesUntilExpiry = Math.floor((expiresAt - now) / 1000 / 60);

    return {
      ...session,
      expiresAt,
      minutesUntilExpiry,
      isExpiringSoon: minutesUntilExpiry < 10,
    };
  },
};

// ============================================
// INICIALIZACIÓN
// ============================================

// Iniciar monitor de conexión automáticamente
if (typeof window !== "undefined") {
  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      console.log("🔐 Usuario autenticado, iniciando monitor de conexión");

      // Iniciar monitor
      connectionMonitor.start();

      // Test inicial de conexión
      setTimeout(() => {
        testConnection().then(({ connected, responseTime }) => {
          if (connected) {
            console.log(`🚀 Son-IA conectado a Supabase (${responseTime}ms)`);
          }
        });
      }, 1000);
    } else if (event === "SIGNED_OUT") {
      console.log("🔒 Usuario cerró sesión, deteniendo monitor");
      connectionMonitor.stop();
    }
  });

  // Log inicial sin test de conexión
  console.log("🚀 Son-IA: Cliente Supabase inicializado");
}

// Exportar todo como un objeto para fácil acceso
export default {
  client: supabase,
  testConnection,
  connectionMonitor,
  queryWithRetry,
  paginatedQuery,
  agentQueries,
  RealtimeSubscription,
  subscribeToMultiple,
  handleSupabaseError,
  executeQuery,
  uploadFile,
  getPublicUrl,
  sessionHelpers,
};

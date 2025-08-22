// DESARROLLO - Configuración para desarrollo local
export const config = {
  NODE_ENV: 'development',
  APP_ENV: 'development',
  
  // Supabase Configuration (Development)
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'your_dev_supabase_url_here',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_dev_supabase_anon_key_here',
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  SERVER_PORT: 3001,
  
  // Debug & Logging
  DEBUG: true,
  LOG_LEVEL: 'debug',
  
  // Feature Flags
  ENABLE_DEBUG_PANEL: true,
  ENABLE_MOCK_DATA: true,
  ENABLE_2FA: false,
  
  // Session
  SESSION_TIMEOUT: 3600000, // 1 hour
  
  // Analytics & Monitoring
  SENTRY_DSN: null,
  ANALYTICS_ID: null
};


import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

// CARGAR VARIABLES CORRECTAMENTE para ES6 modules
config();

// Verificar inmediatamente que las variables están cargadas
console.log('🔍 Variables del servidor:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Falta');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta');

// Si faltan, añadirlas directamente como fallback
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://ktsqwvhqamedpmzkzjaz.supabase.co';
  console.log('✅ SUPABASE_URL añadida manualmente');
}

if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzY3NzEsImV4cCI6MjA2OTk1Mjc3MX0.Y-zMa2F5a7UVT-efldv0sZjLAgmCfeEmhxfP7kgGzNY';
  console.log('✅ SUPABASE_ANON_KEY añadida manualmente');
}

// Service Role Key para operaciones administrativas (bypass RLS)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3F3dmhxYW1lZHBtemt6amF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM3Njc3MSwiZXhwIjoyMDY5OTUyNzcxfQ.ckmlr_TAFJ9iFtLztRhrRPnagZiNLm6XYeo1faVx-BU';
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY añadida manualmente');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import after env is loaded to avoid issues
const registerModule = await import('./src/api/register.js');
const registerHandler = registerModule.default;

// API Routes
app.post('/api/register', (req, res) => {
  registerHandler(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Función para encontrar puerto disponible
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = app.listen(startPort, '0.0.0.0', () => {
      const port = server.address().port;
      server.close();
      resolve(port);
    });
    
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Iniciar servidor con puerto dinámico
const startServer = async () => {
  try {
    const PORT = await findAvailablePort(5000);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API Server running on http://0.0.0.0:${PORT}`);
      if (PORT !== 5000) {
        console.log(`ℹ️ Puerto 5000 ocupado, usando puerto ${PORT}`);
      }
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

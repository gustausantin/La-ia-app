
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { securityMiddleware } from './src/middleware/security.js';
import nodemailer from 'nodemailer';
import { startRealtimeEmailListener } from './src/services/realtimeEmailService.js';

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

// 🛡️ SEGURIDAD EMPRESARIAL - Aplicar PRIMERO
securityMiddleware(app);

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

// ========================================
// EMAIL SENDING ENDPOINT
// Usado por Supabase Edge Function para enviar emails vía SMTP
// ========================================
app.post('/api/send-email', async (req, res) => {
  try {
    // Verificar autorización (solo Edge Functions pueden llamar a esto)
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    
    if (authHeader !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { from, replyTo, to, subject, html } = req.body;

    // Configurar transporter SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER || 'noreply@la-ia.site',
        pass: process.env.SMTP_PASSWORD, // Debe estar en .env
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from,
      replyTo,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log('✅ Email enviado correctamente:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
    });

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from React build (for production)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - send all non-API requests to React app
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Send React app for all other routes
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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

// Iniciar servidor en puerto fijo
const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API Server running on http://0.0.0.0:${PORT}`);
  
  // 📧 Iniciar listener de notificaciones por email vía Realtime
  console.log('📧 Iniciando sistema de notificaciones por email...');
  startRealtimeEmailListener();
});

// Manejar errores de puerto
app.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

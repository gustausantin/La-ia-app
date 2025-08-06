
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import registerHandler from './src/api/register.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/register', (req, res) => {
  registerHandler(req, res);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on http://0.0.0.0:${PORT}`);
});

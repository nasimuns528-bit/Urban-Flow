import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { testConnection } from './config/db.js';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import hotspotRoutes from './routes/hotspots.js';
import taskRoutes from './routes/tasks.js';
import analyticsRoutes from './routes/analytics.js';
import wardRoutes from './routes/wards.js';
import weatherRoutes from './routes/weather.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure public/uploads exists
const uploadsPath = path.resolve(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Static files
app.use(express.static(path.resolve(__dirname, '../public')));
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isDbConnected = await testConnection();
  res.json({
    status: 'online',
    system: 'UrbanFlow: Localised Flood and Drainage Response',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'MySQL 8.x Connected' : 'MySQL Offline / Pending Init'
  });
});

// Single Page Application fallback
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal municipal server error'
  });
});

// Start Express Server
app.listen(PORT, async () => {
  console.log('===========================================================');
  console.log(`🌊 UrbanFlow Application Server active on http://localhost:${PORT}`);
  console.log(`🏙️ Localised Flood and Drainage Response Platform`);
  console.log('===========================================================');
  await testConnection();
});

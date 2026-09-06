require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./src/routes/userRoutes');
const sarvamRoutes = require('./src/routes/sarvamRoutes');
const sosRoutes = require('./src/routes/sosRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded profile photo avatars statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Ignore favicon 404 noise
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root landing route serving interactive browser test console
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/test.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/test.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ResQMesh User Backend',
    time: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ResQMesh User Backend API v1',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/sarvam', sarvamRoutes);
app.use('/api/v1/sos', sosRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const http = require('http');

  const startServerOnPort = (port) => {
    const server = http.createServer(app);
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && port === 5000) {
        console.warn(`⚠️ Port 5000 is busy. Switching to http://localhost:5001...`);
        startServerOnPort(5001);
      } else {
        console.error('❌ Server error:', err.message);
      }
    });
    server.listen(port, () => {
      console.log(`🚀 ResQMesh User Backend running on http://localhost:${port}`);
      console.log(`🇮🇳 Sarvam AI Integration Ready | SQLite Database Active`);
    });
  };

  startServerOnPort(PORT);
}

module.exports = app;

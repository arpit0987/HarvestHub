const express = require('express');
const cors = require('cors');
const path = require('node:path');

// Ensure DB is initialized
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fields', require('./routes/fields'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/rotations', require('./routes/rotations'));
app.use('/api/operations', require('./routes/operations'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/ai', require('./routes/ai'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'HarvestHub: Farm Management & Crop Planning API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files
const clientPath = path.resolve(__dirname, '../../client');
app.use(express.static(clientPath));

// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌾 HarvestHub Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

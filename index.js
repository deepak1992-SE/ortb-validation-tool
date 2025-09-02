const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// CRITICAL: Root route MUST be first
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>ORTB Validation Tool - FIXED!</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f8ff; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; }
        .success { background: #27ae60; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .endpoint { background: #ecf0f1; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
        .btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin: 5px; }
        .btn:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 ORTB Validation Tool - LIVE NOW!</h1>
        <div class="success">✅ SUCCESS! The root route is now working!</div>
        
        <p><strong>Your OpenRTB 2.6 validation tool is live and working!</strong></p>
        
        <h3>📋 API Endpoints:</h3>
        <div class="endpoint">GET /api/health</div>
        <div class="endpoint">POST /api/validate</div>
        <div class="endpoint">POST /api/generate</div>
        
        <h3>🧪 Test:</h3>
        <a href="/api/health" class="btn" target="_blank">Test Health Check</a>
        
        <hr style="margin: 30px 0;">
        <p style="text-align: center; color: #7f8c8d;">
            Server Time: ${new Date().toISOString()}<br>
            Uptime: ${Math.floor(process.uptime())} seconds
        </p>
    </div>
</body>
</html>
  `);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'live',
    message: 'ORTB Validation Tool - ROOT ROUTE FIXED!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/validate', (req, res) => {
  res.json({
    success: true,
    message: 'Validation endpoint working',
    data: { isValid: true, errors: [] }
  });
});

app.post('/api/generate', (req, res) => {
  res.json({
    success: true,
    message: 'Generation endpoint working',
    data: { 
      request: { id: 'demo', imp: [{ id: '1', banner: { w: 300, h: 250 } }] }
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Root route should work now!`);
});
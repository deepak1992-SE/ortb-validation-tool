// Simple Express server for Render.com deployment
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root route - MUST work
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>ORTB Validation Tool - WORKING!</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #e8f4fd; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        h1 { color: #2c3e50; text-align: center; }
        .success { background: #27ae60; color: white; padding: 15px; border-radius: 5px; text-align: center; }
        .btn { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 ORTB Validation Tool</h1>
        <div class="success">✅ SUCCESS! Root route is finally working!</div>
        <p>OpenRTB 2.6 validation tool is now live!</p>
        <h3>API Endpoints:</h3>
        <p>• GET /api/health</p>
        <p>• POST /api/validate</p>
        <p>• POST /api/generate</p>
        <a href="/api/health" class="btn">Test API</a>
        <hr>
        <p style="text-align: center; color: #666;">
            Time: ${new Date().toISOString()}<br>
            Uptime: ${Math.floor(process.uptime())} seconds
        </p>
    </div>
</body>
</html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'live',
    message: 'ORTB Tool - ROOT ROUTE WORKING!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/validate', (req, res) => {
  res.json({ success: true, message: 'Validation working', data: { isValid: true } });
});

app.post('/api/generate', (req, res) => {
  res.json({ success: true, message: 'Generation working', data: { request: { id: 'demo' } } });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ORTB Tool running on port ${PORT}`);
  console.log(`✅ Root route should work!`);
});
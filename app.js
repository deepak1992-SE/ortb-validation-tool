const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route - MUST be first
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>ORTB Validation Tool - WORKING!</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
            h1 { color: #333; }
            .status { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 ORTB Validation Tool - WORKING!</h1>
            <div class="status">✅ Server is LIVE and the root route is working!</div>
            
            <p>Your OpenRTB 2.6 validation and sample generation tool is now live!</p>
            
            <h2>📋 Available API Endpoints</h2>
            <div class="endpoint">GET /api/health - Server health check</div>
            <div class="endpoint">POST /api/validate - Validate ORTB requests</div>
            <div class="endpoint">POST /api/generate - Generate ORTB samples</div>
            
            <h2>🧪 Test the API</h2>
            <a href="/api/health" class="btn" target="_blank">Test Health Check</a>
            
            <h2>📚 Documentation</h2>
            <p>Visit the <a href="https://github.com/deepak1992-SE/ortb-validation-tool" target="_blank">GitHub Repository</a> for complete documentation.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center;">
                <p>Server uptime: ${Math.floor(process.uptime())} seconds</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'live',
    version: '1.0.0',
    uptime: process.uptime(),
    message: 'ORTB Validation Tool is LIVE and WORKING!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/generate', (req, res) => {
  const mockSample = {
    id: "demo-001",
    imp: [{
      id: "1",
      banner: { w: 300, h: 250 },
      bidfloor: 0.5,
      bidfloorcur: "USD"
    }],
    site: {
      id: "demo-site",
      domain: "example.com"
    },
    at: 1
  };
  
  res.json({
    success: true,
    data: {
      request: mockSample,
      metadata: {
        generatedAt: new Date().toISOString(),
        requestId: `demo-${Date.now()}`
      }
    }
  });
});

app.post('/api/validate', (req, res) => {
  const { request } = req.body || {};
  const errors = [];
  
  if (!request?.id) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Request ID is required',
      field: 'id'
    });
  }
  
  if (!request?.imp || request.imp.length === 0) {
    errors.push({
      code: 'MISSING_IMP',
      message: 'At least one impression is required',
      field: 'imp'
    });
  }
  
  const isValid = errors.length === 0;
  
  res.json({
    success: true,
    data: {
      isValid,
      errors,
      complianceScore: isValid ? 100 : 60,
      requestId: `val-${Date.now()}`
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ORTB Validation Tool LIVE on port ${PORT}`);
  console.log(`🌐 Server is running and ready!`);
});

module.exports = app;
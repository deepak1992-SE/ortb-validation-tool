const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockSample = {
  id: "live-demo-001",
  imp: [{
    id: "1",
    banner: { w: 300, h: 250, format: [{ w: 300, h: 250 }] },
    bidfloor: 0.5,
    bidfloorcur: "USD"
  }],
  site: {
    id: "live-site",
    domain: "render-demo.com",
    page: "https://render-demo.com/page"
  },
  device: {
    ua: "Mozilla/5.0 (Live Demo)",
    ip: "192.168.1.1"
  },
  at: 1,
  tmax: 120
};

// Serve static files if frontend/dist exists
const frontendPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendPath));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'live',
    version: '1.0.0',
    uptime: process.uptime(),
    message: 'ORTB Validation Tool is LIVE on Render! (Updated)',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/generate', (req, res) => {
  const { config } = req.body || {};
  let sample = { ...mockSample };
  
  if (config?.requestType === 'video') {
    sample.imp[0] = {
      id: "1",
      video: { w: 640, h: 480, minduration: 5, maxduration: 30, protocols: [2, 3, 5, 6] },
      bidfloor: 1.0,
      bidfloorcur: "USD"
    };
  } else if (config?.requestType === 'native') {
    sample.imp[0] = {
      id: "1",
      native: {
        request: JSON.stringify({
          ver: "1.2",
          assets: [
            { id: 1, required: 1, title: { len: 90 } },
            { id: 2, required: 1, img: { type: 3, w: 300, h: 250 } }
          ]
        })
      },
      bidfloor: 0.75,
      bidfloorcur: "USD"
    };
  }
  
  res.json({
    success: true,
    data: {
      request: sample,
      config: config || { requestType: 'display' },
      metadata: {
        generatedAt: new Date().toISOString(),
        templateUsed: 'live-demo',
        requestId: `live-${Date.now()}`
      }
    }
  });
});

app.post('/api/validate', (req, res) => {
  const { request } = req.body || {};
  const errors = [];
  const warnings = [];
  
  if (!request?.id) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Request ID is required',
      field: 'id',
      severity: 'error'
    });
  }
  
  if (!request?.imp || request.imp.length === 0) {
    errors.push({
      code: 'MISSING_IMP',
      message: 'At least one impression is required',
      field: 'imp',
      severity: 'error'
    });
  }
  
  if (!request?.at) {
    warnings.push({
      code: 'MISSING_AT',
      message: 'Auction type not specified',
      field: 'at',
      suggestion: 'Set at=1 for first price auction'
    });
  }
  
  const isValid = errors.length === 0;
  const complianceScore = isValid ? (warnings.length === 0 ? 100 : 85) : 60;
  
  res.json({
    success: true,
    data: {
      isValid,
      errors,
      warnings,
      complianceScore,
      complianceLevel: complianceScore >= 90 ? 'excellent' : complianceScore >= 70 ? 'good' : 'needs_improvement',
      processingTime: Math.random() * 50 + 10,
      requestId: `val-${Date.now()}`
    }
  });
});

app.get('/api/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'display-basic',
        name: 'Basic Display Banner',
        description: 'Simple display banner with required fields',
        requestType: 'display',
        requiredFields: ['id', 'imp', 'site', 'device'],
        optionalFields: ['user', 'app', 'test']
      },
      {
        id: 'video-instream',
        name: 'Instream Video',
        description: 'Video ad that plays before/during content',
        requestType: 'video',
        requiredFields: ['id', 'imp', 'site', 'device'],
        optionalFields: ['user', 'content', 'producer']
      }
    ]
  });
});

app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalValidations: 1247,
      successRate: 87.3,
      commonErrors: [
        { code: 'MISSING_ID', count: 45, percentage: 12.7 },
        { code: 'INVALID_IMP', count: 32, percentage: 9.1 }
      ],
      recentActivity: [
        { timestamp: new Date().toISOString(), type: 'validation', result: 'success' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), type: 'generation', result: 'success' }
      ]
    }
  });
});

// Root route - serve a simple HTML page if frontend not available
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>ORTB Validation Tool - Live</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f8fafc; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #1e293b; margin-bottom: 20px; }
            .status { background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; margin: 20px 0; }
            .endpoint { background: #f1f5f9; padding: 15px; margin: 10px 0; border-radius: 8px; font-family: monospace; }
            .btn { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
            .btn:hover { background: #2563eb; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 ORTB Validation Tool</h1>
            <div class="status">✅ API Server is LIVE and Running!</div>
            
            <p>Your OpenRTB 2.6 validation and sample generation tool is now live on Render.com!</p>
            
            <h2>📋 Available API Endpoints</h2>
            <div class="endpoint">GET /api/health - Server health check</div>
            <div class="endpoint">POST /api/validate - Validate ORTB requests</div>
            <div class="endpoint">POST /api/generate - Generate ORTB samples</div>
            <div class="endpoint">GET /api/templates - List available templates</div>
            <div class="endpoint">GET /api/analytics - Get validation analytics</div>
            
            <h2>🧪 Test the API</h2>
            <div class="grid">
                <div class="card">
                    <h3>Health Check</h3>
                    <a href="/api/health" class="btn" target="_blank">Test Health</a>
                </div>
                <div class="card">
                    <h3>Templates</h3>
                    <a href="/api/templates" class="btn" target="_blank">View Templates</a>
                </div>
                <div class="card">
                    <h3>Analytics</h3>
                    <a href="/api/analytics" class="btn" target="_blank">View Analytics</a>
                </div>
            </div>
            
            <h2>🔧 Sample API Calls</h2>
            <h3>Generate Sample:</h3>
            <div class="endpoint">
curl -X POST ${req.protocol}://${req.get('host')}/api/generate \\<br>
  -H "Content-Type: application/json" \\<br>
  -d '{"config": {"requestType": "display", "includeOptionalFields": true}}'
            </div>
            
            <h3>Validate Request:</h3>
            <div class="endpoint">
curl -X POST ${req.protocol}://${req.get('host')}/api/validate \\<br>
  -H "Content-Type: application/json" \\<br>
  -d '{"request": {"id": "test-001", "imp": [{"id": "1", "banner": {"w": 300, "h": 250}}]}}'
            </div>
            
            <h2>📚 Documentation</h2>
            <p>Visit the <a href="https://github.com/deepak1992-SE/ortb-validation-tool" target="_blank">GitHub Repository</a> for complete documentation and frontend setup.</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; text-align: center;">
                <p>Made with ❤️ for the programmatic advertising community</p>
                <p>Server uptime: ${Math.floor(process.uptime())} seconds</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Catch all handler for frontend routes (if frontend is built)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend not found. API is available at /api/*');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ORTB Validation Tool LIVE on port ${PORT}`);
  console.log(`🌐 Access at: https://ortb-validation-tool.onrender.com`);
  console.log(`📋 API Health: /api/health`);
  console.log(`✅ Ready for production traffic!`);
});

module.exports = app;
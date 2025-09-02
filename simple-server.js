const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Mock data
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
    domain: "example.com",
    page: "https://example.com/page"
  },
  device: {
    ua: "Mozilla/5.0 (Demo)",
    ip: "192.168.1.1"
  },
  at: 1,
  tmax: 120
};

// API Routes - very simple
app.get('/api/health', (req, res) => {
  res.json({
    status: 'live',
    message: 'ORTB Validation Tool is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/validate', (req, res) => {
  const { request } = req.body || {};
  const errors = [];
  
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
  
  const isValid = errors.length === 0;
  
  res.json({
    success: true,
    data: {
      isValid,
      errors,
      warnings: [],
      complianceScore: isValid ? 100 : 60,
      complianceLevel: isValid ? 'excellent' : 'needs_improvement',
      processingTime: 25,
      requestId: `val-${Date.now()}`
    }
  });
});

app.post('/api/generate', (req, res) => {
  const { config } = req.body || {};
  let sample = { ...mockSample };
  
  if (config?.requestType === 'video') {
    sample.imp[0] = {
      id: "1",
      video: { w: 640, h: 480, minduration: 5, maxduration: 30 },
      bidfloor: 1.0,
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
        templateUsed: 'demo',
        requestId: `gen-${Date.now()}`
      }
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
        description: 'Simple display banner',
        requestType: 'display',
        requiredFields: ['id', 'imp'],
        optionalFields: ['site', 'device']
      }
    ]
  });
});

app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalValidations: 100,
      successRate: 85.0,
      commonErrors: [],
      recentActivity: []
    }
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>ORTB Validation Tool</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .success { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ORTB Validation Tool</h1>
        <div class="success">✅ Server is running successfully!</div>
        <p>API endpoints are available at /api/*</p>
        <p><a href="/api/health">Test API Health</a></p>
    </div>
</body>
</html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple ORTB server running on port ${PORT}`);
});

module.exports = app;
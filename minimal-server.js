const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

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
    domain: "example.com"
  },
  device: {
    ua: "Mozilla/5.0 (Demo)",
    ip: "192.168.1.1"
  },
  at: 1
};

// Helper functions
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendHTML(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(html);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  // API Routes
  if (pathname === '/api/health') {
    sendJSON(res, {
      status: 'live',
      message: 'ORTB Validation Tool - Minimal Server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    return;
  }
  
  if (pathname === '/api/validate' && req.method === 'POST') {
    const body = await parseBody(req);
    const { request } = body;
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
    
    sendJSON(res, {
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
    return;
  }
  
  if (pathname === '/api/generate' && req.method === 'POST') {
    const body = await parseBody(req);
    const { config } = body;
    let sample = { ...mockSample };
    
    if (config?.requestType === 'video') {
      sample.imp[0] = {
        id: "1",
        video: { w: 640, h: 480, minduration: 5, maxduration: 30 },
        bidfloor: 1.0,
        bidfloorcur: "USD"
      };
    }
    
    sendJSON(res, {
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
    return;
  }
  
  if (pathname === '/api/templates') {
    sendJSON(res, {
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
    return;
  }
  
  if (pathname === '/api/analytics') {
    sendJSON(res, {
      success: true,
      data: {
        totalValidations: 100,
        successRate: 85.0,
        commonErrors: [],
        recentActivity: []
      }
    });
    return;
  }
  
  // Serve static files from frontend/dist
  const frontendPath = path.join(__dirname, 'frontend', 'dist');
  
  if (pathname === '/') {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveFile(res, indexPath);
      return;
    }
  }
  
  // Try to serve static file
  const filePath = path.join(frontendPath, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }
  
  // SPA fallback - serve index.html for all other routes
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
    return;
  }
  
  // Final fallback - simple HTML
  sendHTML(res, `
<!DOCTYPE html>
<html>
<head>
    <title>ORTB Validation Tool</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .endpoint { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace; }
        a { color: #2196F3; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ORTB Validation Tool</h1>
        <div class="success">✅ Minimal Server Running Successfully!</div>
        <p>Your OpenRTB 2.6 validation tool is now live with a minimal Node.js server.</p>
        
        <h3>Available API Endpoints:</h3>
        <div class="endpoint">GET /api/health</div>
        <div class="endpoint">POST /api/validate</div>
        <div class="endpoint">POST /api/generate</div>
        <div class="endpoint">GET /api/templates</div>
        <div class="endpoint">GET /api/analytics</div>
        
        <p><a href="/api/health">🔍 Test API Health</a></p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          Server uptime: ${Math.floor(process.uptime())} seconds<br>
          No Express.js dependencies - Pure Node.js HTTP server
        </p>
    </div>
</body>
</html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal ORTB server running on port ${PORT}`);
  console.log(`🌐 No Express.js - Pure Node.js HTTP server`);
  console.log(`📋 API Health: /api/health`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
  });
});
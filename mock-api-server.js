const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockSample = {
  id: "mock-request-001",
  imp: [{
    id: "1",
    banner: {
      w: 300,
      h: 250,
      format: [{ w: 300, h: 250 }]
    },
    bidfloor: 0.5,
    bidfloorcur: "USD"
  }],
  site: {
    id: "mock-site",
    domain: "example.com",
    page: "https://example.com/page"
  },
  device: {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ip: "192.168.1.1"
  },
  at: 1,
  tmax: 120
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.post('/api/generate', (req, res) => {
  const { config } = req.body;
  
  // Generate different samples based on request type
  let sample = { ...mockSample };
  
  if (config.requestType === 'video') {
    sample.imp[0] = {
      id: "1",
      video: {
        w: 640,
        h: 480,
        minduration: 5,
        maxduration: 30,
        protocols: [2, 3, 5, 6]
      },
      bidfloor: 1.0,
      bidfloorcur: "USD"
    };
  } else if (config.requestType === 'native') {
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
  } else if (config.requestType === 'audio') {
    sample.imp[0] = {
      id: "1",
      audio: {
        minduration: 15,
        maxduration: 30,
        protocols: [2, 3]
      },
      bidfloor: 0.25,
      bidfloorcur: "USD"
    };
  }
  
  // Add optional fields if requested
  if (config.includeOptionalFields || config.complexity === 'comprehensive') {
    sample.user = {
      id: "user-123",
      yob: 1985,
      gender: "M"
    };
    sample.device.geo = {
      country: "USA",
      region: "CA",
      city: "San Francisco"
    };
  }
  
  res.json({
    success: true,
    data: {
      request: sample,
      config: config,
      metadata: {
        generatedAt: new Date().toISOString(),
        templateUsed: config.templateId || 'default',
        requestId: `gen-${Date.now()}`
      }
    }
  });
});

app.post('/api/validate', (req, res) => {
  const { request } = req.body;
  
  // Simple validation logic
  const errors = [];
  const warnings = [];
  
  if (!request.id) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Request ID is required',
      field: 'id',
      severity: 'error'
    });
  }
  
  if (!request.imp || request.imp.length === 0) {
    errors.push({
      code: 'MISSING_IMP',
      message: 'At least one impression is required',
      field: 'imp',
      severity: 'error'
    });
  }
  
  if (!request.at) {
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
      processingTime: Math.random() * 100 + 20,
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
      },
      {
        id: 'native-feed',
        name: 'Native Feed Ad',
        description: 'Native ad for social media feeds',
        requestType: 'native',
        requiredFields: ['id', 'imp', 'app', 'device'],
        optionalFields: ['user', 'geo']
      }
    ]
  });
});

app.post('/api/generate/from-template', (req, res) => {
  const { templateId, customFields } = req.body;
  
  let sample = { ...mockSample };
  
  // Modify sample based on template
  if (templateId === 'video-instream') {
    sample.imp[0] = {
      id: "1",
      video: {
        w: 640,
        h: 480,
        minduration: 15,
        maxduration: 30,
        protocols: [2, 3, 5, 6],
        linearity: 1
      },
      bidfloor: 2.0,
      bidfloorcur: "USD"
    };
  }
  
  // Apply custom fields
  if (customFields) {
    sample = { ...sample, ...customFields };
  }
  
  res.json({
    success: true,
    data: {
      request: sample,
      config: { requestType: 'display', templateId },
      metadata: {
        generatedAt: new Date().toISOString(),
        templateUsed: templateId,
        requestId: `tpl-${Date.now()}`
      }
    }
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
        { code: 'INVALID_IMP', count: 32, percentage: 9.1 },
        { code: 'MISSING_DEVICE', count: 28, percentage: 7.9 }
      ],
      recentActivity: [
        { timestamp: new Date().toISOString(), type: 'validation', result: 'success' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), type: 'generation', result: 'success' },
        { timestamp: new Date(Date.now() - 120000).toISOString(), type: 'validation', result: 'error' }
      ]
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ORTB API Server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/validate`);
  console.log(`   POST /api/generate`);
  console.log(`   GET  /api/templates`);
  console.log(`   POST /api/generate/from-template`);
  console.log(`   GET  /api/analytics`);
  console.log(`\n✅ Server ready for production!`);
});
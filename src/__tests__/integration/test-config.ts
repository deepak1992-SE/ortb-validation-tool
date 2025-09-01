import { beforeAll, afterAll } from 'vitest';

// Global test configuration for integration tests
export const integrationTestConfig = {
  timeout: 30000, // 30 seconds for integration tests
  retries: 2,
  testEnvironment: 'node'
};

// Test data and fixtures
export const testFixtures = {
  // Official IAB OpenRTB 2.6 sample requests for compliance testing
  iabSamples: {
    display: {
      id: 'iab-display-sample',
      imp: [{
        id: '1',
        banner: {
          w: 300,
          h: 250,
          format: [{ w: 300, h: 250 }],
          btype: [1, 3],
          battr: [1, 2, 3, 4, 5, 6, 7, 12]
        },
        bidfloor: 0.5,
        bidfloorcur: 'USD'
      }],
      site: {
        id: 'site123',
        domain: 'example.com',
        page: 'https://example.com/page1'
      },
      device: {
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip: '192.168.1.1'
      },
      at: 1,
      tmax: 120
    },
    
    video: {
      id: 'iab-video-sample',
      imp: [{
        id: '1',
        video: {
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          protocols: [2, 3],
          w: 640,
          h: 480,
          startdelay: 0,
          placement: 1,
          linearity: 1
        },
        bidfloor: 2.0,
        bidfloorcur: 'USD'
      }],
      site: {
        id: 'video-site',
        domain: 'videosite.com'
      },
      device: {
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip: '192.168.1.1'
      },
      at: 1
    }
  },

  // Invalid samples for negative testing
  invalidSamples: {
    missingRequiredFields: {
      id: 'invalid-missing-at',
      imp: [{
        id: '1',
        banner: { w: 300, h: 250 }
      }]
      // Missing 'at' field
    },
    
    duplicateImpressionIds: {
      id: 'invalid-duplicate-imp',
      imp: [
        { id: '1', banner: { w: 300, h: 250 } },
        { id: '1', banner: { w: 728, h: 90 } } // Duplicate ID
      ],
      at: 1
    },
    
    mutuallyExclusiveFields: {
      id: 'invalid-site-app',
      imp: [{ id: '1', banner: { w: 300, h: 250 } }],
      site: { id: 'site1', domain: 'example.com' },
      app: { id: 'app1', bundle: 'com.example.app' }, // Should not have both
      at: 1
    }
  },

  // Edge case samples
  edgeCases: {
    maxImpressions: {
      id: 'edge-max-impressions',
      imp: Array(10).fill(null).map((_, i) => ({
        id: `${i + 1}`,
        banner: { w: 300, h: 250 }
      })),
      at: 1
    },
    
    unicodeContent: {
      id: 'edge-unicode',
      imp: [{ id: '1', banner: { w: 300, h: 250 } }],
      site: {
        id: 'unicode-site',
        name: '测试网站 🌟',
        domain: 'test-中文.com'
      },
      at: 1
    },
    
    preciseNumbers: {
      id: 'edge-precision',
      imp: [{
        id: '1',
        banner: { w: 300, h: 250 },
        bidfloor: 1.23456789,
        bidfloorcur: 'USD'
      }],
      device: {
        geo: {
          lat: 40.7128123456,
          lon: -74.0060987654
        }
      },
      at: 1
    }
  }
};

// Test utilities
export const testUtils = {
  // Wait for async operations to complete
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random test data
  generateRandomId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Validate test environment
  validateTestEnvironment: () => {
    const requiredEnvVars = ['NODE_ENV'];
    const missing = requiredEnvVars.filter(env => !process.env[env]);
    if (missing.length > 0) {
      console.warn(`Missing environment variables: ${missing.join(', ')}`);
    }
  },
  
  // Clean up test artifacts
  cleanupTestArtifacts: async () => {
    // Clean up any temporary files, database entries, etc.
    // This will be called after each test suite
  }
};

// Global setup for integration tests
beforeAll(async () => {
  console.log('Setting up integration test environment...');
  testUtils.validateTestEnvironment();
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Initialize any required services or connections
  // This could include database connections, external service mocks, etc.
});

// Global cleanup for integration tests
afterAll(async () => {
  console.log('Cleaning up integration test environment...');
  await testUtils.cleanupTestArtifacts();
});

// Export configuration for vitest
export default integrationTestConfig;
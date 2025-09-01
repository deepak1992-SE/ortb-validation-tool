/**
 * Server Startup Test
 * Tests that the API server can be created and configured properly
 */

import { describe, it, expect } from 'vitest';
import { createAPIServer } from '../server';

describe('API Server Startup', () => {
  it('should create server with default configuration', () => {
    const server = createAPIServer();
    expect(server).toBeDefined();
    
    const config = server.getConfig();
    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.auth.required).toBe(false);
  });

  it('should create server with custom configuration', () => {
    const server = createAPIServer({
      port: 8080,
      host: '127.0.0.1',
      auth: { required: true, apiKeys: ['test-key'] },
      rateLimit: { windowMs: 60000, max: 50, message: 'Custom rate limit' }
    });
    
    const config = server.getConfig();
    expect(config.port).toBe(8080);
    expect(config.host).toBe('127.0.0.1');
    expect(config.auth.required).toBe(true);
    expect(config.auth.apiKeys).toEqual(['test-key']);
    expect(config.rateLimit.max).toBe(50);
  });

  it('should have Express app instance', () => {
    const server = createAPIServer();
    const app = server.getApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('should merge configurations correctly', () => {
    const server = createAPIServer({
      port: 9000,
      // Only specify port, other values should use defaults
    });
    
    const config = server.getConfig();
    expect(config.port).toBe(9000);
    expect(config.host).toBe('0.0.0.0'); // Default
    expect(config.auth.required).toBe(false); // Default
    expect(config.rateLimit.max).toBe(100); // Default
  });
});
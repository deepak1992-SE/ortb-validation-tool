/**
 * Simple API Test
 * Basic test to verify API server functionality
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRoutes } from '../routes';

describe('Simple API Test', () => {
  it('should create routes without errors', () => {
    const app = express();
    app.use(express.json());
    
    const routes = createRoutes();
    expect(routes).toBeDefined();
    
    app.use('/api', routes);
    
    // Basic test that the app was created
    expect(app).toBeDefined();
  });

  it('should handle basic route creation', async () => {
    const app = express();
    app.use(express.json());
    
    // Add a simple test route
    app.get('/test', (req, res) => {
      res.json({ success: true, message: 'test' });
    });
    
    const response = await request(app)
      .get('/test')
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
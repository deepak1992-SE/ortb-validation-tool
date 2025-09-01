#!/usr/bin/env node
/**
 * API Server CLI
 * Command line interface for starting the API server
 */

import { startAPIServer } from './server';
import { APIConfig } from './types';

// Parse command line arguments
const args = process.argv.slice(2);
const config: Partial<APIConfig> = {};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--port':
    case '-p':
      const portArg = args[++i];
      config.port = portArg ? parseInt(portArg) || 3000 : 3000;
      break;
    case '--host':
    case '-h':
      config.host = args[++i] || '0.0.0.0';
      break;
    case '--auth':
      const authArg = args[++i];
      config.auth = { required: true, apiKeys: authArg?.split(',') || [] };
      break;
    case '--no-auth':
      config.auth = { required: false, apiKeys: [] };
      break;
    case '--rate-limit':
      const limitArg = args[++i];
      const limit = limitArg ? parseInt(limitArg) : 0;
      if (limit) {
        config.rateLimit = { windowMs: 15 * 60 * 1000, max: limit, message: 'Rate limit exceeded' };
      }
      break;
    case '--cors-origin':
      config.cors = { origin: args[++i] || '*', credentials: false };
      break;
    case '--help':
      console.log(`
ORTB Validation Tool API Server

Usage: npm run api [options]

Options:
  -p, --port <port>           Server port (default: 3000)
  -h, --host <host>           Server host (default: 0.0.0.0)
  --auth <api-keys>           Enable authentication with comma-separated API keys
  --no-auth                   Disable authentication (default)
  --rate-limit <requests>     Rate limit per 15 minutes (default: 100)
  --cors-origin <origin>      CORS origin (default: *)
  --help                      Show this help message

Examples:
  npm run api                                    # Start with defaults
  npm run api -- --port 8080                    # Start on port 8080
  npm run api -- --auth key1,key2,key3          # Start with authentication
  npm run api -- --rate-limit 200               # Set rate limit to 200 requests
  npm run api -- --cors-origin https://app.com  # Set specific CORS origin

Environment Variables:
  PORT                        Server port
  HOST                        Server host
  API_KEYS                    Comma-separated API keys
  RATE_LIMIT                  Rate limit per 15 minutes
  CORS_ORIGIN                 CORS origin
`);
      process.exit(0);
      break;
  }
}

// Override with environment variables
if (process.env.PORT) {
  config.port = parseInt(process.env.PORT);
}
if (process.env.HOST) {
  config.host = process.env.HOST;
}
if (process.env.API_KEYS) {
  config.auth = { required: true, apiKeys: process.env.API_KEYS.split(',') };
}
if (process.env.RATE_LIMIT) {
  const limit = parseInt(process.env.RATE_LIMIT);
  if (limit) {
    config.rateLimit = { windowMs: 15 * 60 * 1000, max: limit, message: 'Rate limit exceeded' };
  }
}
if (process.env.CORS_ORIGIN) {
  config.cors = { origin: process.env.CORS_ORIGIN, credentials: false };
}

// Start the server
async function main() {
  try {
    console.log('🚀 Starting ORTB Validation Tool API Server...');
    console.log('📋 Configuration:', JSON.stringify(config, null, 2));
    
    await startAPIServer(config);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}
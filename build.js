#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building ORTB Validation Tool...');

try {
  // Check if frontend directory exists
  const frontendDir = path.join(__dirname, 'frontend');
  if (!fs.existsSync(frontendDir)) {
    console.log('❌ Frontend directory not found');
    process.exit(1);
  }

  console.log('📦 Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });

  console.log('🏗️ Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
  console.log('📁 Frontend built to: frontend/dist');
  
  // Verify build output
  const distDir = path.join(frontendDir, 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    console.log(`📋 Built files: ${files.join(', ')}`);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
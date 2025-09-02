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
    console.log('📁 Available directories:', fs.readdirSync(__dirname));
    process.exit(1);
  }

  console.log('📦 Installing frontend dependencies...');
  process.chdir(frontendDir);
  execSync('npm install', { stdio: 'inherit' });

  console.log('🏗️ Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
  
  // Verify build output
  const distDir = path.join(frontendDir, 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    console.log(`📋 Built files: ${files.join(', ')}`);
    console.log('📁 Frontend built to: frontend/dist');
  } else {
    console.log('⚠️ Warning: dist directory not found after build');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
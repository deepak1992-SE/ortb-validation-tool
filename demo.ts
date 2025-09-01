#!/usr/bin/env ts-node

/**
 * ORTB Validation Tool Demo
 * 
 * This script demonstrates the core functionality of the ORTB validation tool.
 * Run with: npx ts-node demo.ts
 */

import { ORTBValidationService } from './src/services/validation-service';
import { DefaultSampleService } from './src/services/sample-service';
import { ORTBExportService } from './src/services/export-service';
import { ORTBRequest } from './src/models';

async function runDemo() {
  console.log('🚀 ORTB Validation Tool Demo');
  console.log('=' .repeat(50));

  // Initialize services
  const validationService = new ORTBValidationService();
  const sampleService = new DefaultSampleService();
  const exportService = new ORTBExportService();

  console.log('\n📋 1. Testing IAB Compliant Sample Validation');
  console.log('-'.repeat(30));

  // Test with a valid IAB sample
  const validSample: ORTBRequest = {
    id: 'demo-request-001',
    imp: [{
      id: '1',
      banner: {
        w: 300,
        h: 250,
        format: [{ w: 300, h: 250 }]
      },
      bidfloor: 0.5,
      bidfloorcur: 'USD'
    }],
    site: {
      id: 'demo-site',
      domain: 'example.com',
      page: 'https://example.com/page'
    },
    device: {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.1'
    },
    at: 1,
    tmax: 120
  };

  try {
    const validationResult = await validationService.validateSingle(validSample);
    console.log(`✅ Validation Result: ${validationResult.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`📊 Errors: ${validationResult.errors.length}`);
    console.log(`📈 Compliance Score: ${validationResult.complianceScore || 'N/A'}`);
    
    if (validationResult.errors.length > 0) {
      console.log('❌ Errors found:');
      validationResult.errors.forEach(error => {
        console.log(`   - ${error.code}: ${error.message}`);
      });
    }
  } catch (error) {
    console.log(`❌ Validation failed: ${error}`);
  }

  console.log('\n📋 2. Testing Invalid Sample Detection');
  console.log('-'.repeat(30));

  // Test with an invalid sample (missing required 'at' field)
  const invalidSample = {
    id: 'demo-invalid-001',
    imp: [{
      id: '1',
      banner: { w: 300, h: 250 }
    }]
    // Missing required 'at' field
  } as ORTBRequest;

  try {
    const invalidResult = await validationService.validateSingle(invalidSample);
    console.log(`🔍 Validation Result: ${invalidResult.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`📊 Errors: ${invalidResult.errors.length}`);
    
    if (invalidResult.errors.length > 0) {
      console.log('❌ Errors found:');
      invalidResult.errors.forEach(error => {
        console.log(`   - ${error.code}: ${error.message}`);
      });
    }
  } catch (error) {
    console.log(`❌ Validation failed: ${error}`);
  }

  console.log('\n📋 3. Testing Sample Generation');
  console.log('-'.repeat(30));

  try {
    const generatedSample = await sampleService.generateSample({
      requestType: 'display',
      includeOptionalFields: false
    });

    if (generatedSample) {
      console.log('✅ Sample generated successfully');
      console.log(`📝 Sample ID: ${generatedSample.id}`);
      console.log(`🎯 Ad Type: Display Banner`);
      console.log(`📊 Impressions: ${generatedSample.imp?.length || 0}`);
      
      // Validate the generated sample
      const genValidation = await validationService.validateSingle(generatedSample);
      console.log(`✅ Generated sample validation: ${genValidation.isValid ? 'VALID' : 'INVALID'}`);
    } else {
      console.log('❌ Sample generation returned null/undefined');
    }
  } catch (error) {
    console.log(`❌ Sample generation failed: ${error}`);
  }

  console.log('\n📋 4. Testing Batch Validation');
  console.log('-'.repeat(30));

  const batchSamples = [validSample, invalidSample];

  try {
    const batchResult = await validationService.validateBatch(batchSamples);
    console.log(`📦 Batch processed: ${batchResult.results.length} requests`);
    console.log(`✅ Valid requests: ${batchResult.summary.validRequests}`);
    console.log(`❌ Invalid requests: ${batchResult.summary.invalidRequests}`);
    console.log(`📈 Overall compliance: ${batchResult.overallComplianceScore.toFixed(1)}%`);
  } catch (error) {
    console.log(`❌ Batch validation failed: ${error}`);
  }

  console.log('\n📋 5. Testing Export Functionality');
  console.log('-'.repeat(30));

  try {
    const validationResult = await validationService.validateSingle(validSample);
    const exportResult = await exportService.exportValidationResult(validationResult, 'json');
    
    if (exportResult && exportResult.data) {
      console.log('✅ Export successful');
      console.log(`📄 Format: ${exportResult.format}`);
      console.log(`📊 Data size: ${exportResult.data.length} characters`);
      
      // Show a preview of the exported data
      const preview = exportResult.data.substring(0, 200) + '...';
      console.log(`📝 Preview: ${preview}`);
    } else {
      console.log('❌ Export returned no data');
    }
  } catch (error) {
    console.log(`❌ Export failed: ${error}`);
  }

  console.log('\n📋 6. Testing Available Templates');
  console.log('-'.repeat(30));

  try {
    const templates = await sampleService.getAvailableTemplates();
    console.log(`📚 Available templates: ${templates.length}`);
    
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.requestType})`);
    });
  } catch (error) {
    console.log(`❌ Template listing failed: ${error}`);
  }

  console.log('\n🎉 Demo Complete!');
  console.log('=' .repeat(50));
  console.log('\n💡 Next Steps:');
  console.log('   • Run integration tests: npm run test:integration');
  console.log('   • Start API server: npm run api (after fixing TS errors)');
  console.log('   • Run all tests: npm test');
  console.log('   • Check test coverage: npm run test:coverage');
}

// Run the demo
if (require.main === module) {
  runDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

export { runDemo };
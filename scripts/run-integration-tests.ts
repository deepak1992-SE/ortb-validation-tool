#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
}

interface IntegrationTestReport {
  timestamp: Date;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  overallCoverage: number;
  suiteResults: TestResult[];
  complianceStatus: 'PASSED' | 'FAILED' | 'PARTIAL';
  recommendations: string[];
}

class IntegrationTestRunner {
  private results: TestResult[] = [];
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'test-reports', 'integration');
  }

  async run(): Promise<void> {
    console.log('🚀 Starting ORTB Validation Tool Integration Tests');
    console.log('=' .repeat(60));

    await this.setupOutputDirectory();
    
    // Run test suites in order
    const testSuites = [
      { name: 'User Workflows', path: 'src/__tests__/integration/user-workflows.test.ts' },
      { name: 'IAB Compliance', path: 'src/__tests__/integration/iab-compliance.test.ts' },
      { name: 'Export Data Integrity', path: 'src/__tests__/integration/export-data-integrity.test.ts' },
      { name: 'End-to-End Scenarios', path: 'src/__tests__/integration/end-to-end-scenarios.test.ts' }
    ];

    for (const suite of testSuites) {
      await this.runTestSuite(suite.name, suite.path);
    }

    // Generate comprehensive report
    const report = await this.generateReport();
    await this.saveReport(report);
    await this.displaySummary(report);
  }

  private async setupOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  private async runTestSuite(suiteName: string, testPath: string): Promise<void> {
    console.log(`\n📋 Running ${suiteName} Tests...`);
    console.log('-'.repeat(40));

    const startTime = Date.now();
    
    try {
      // Run the test suite with coverage
      const command = `npx vitest ${testPath} --run --reporter=json --coverage.enabled=true`;
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse test results
      const result = this.parseTestOutput(output, suiteName, duration);
      this.results.push(result);

      console.log(`✅ ${suiteName}: ${result.passed} passed, ${result.failed} failed (${duration}ms)`);

    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Handle test failures
      const result: TestResult = {
        suite: suiteName,
        passed: 0,
        failed: 1,
        duration,
        coverage: 0
      };

      this.results.push(result);
      console.log(`❌ ${suiteName}: Test suite failed (${duration}ms)`);
      console.error('Error:', error.message);
    }
  }

  private parseTestOutput(output: string, suiteName: string, duration: number): TestResult {
    try {
      // Parse JSON output from vitest
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        const testResult = JSON.parse(jsonLine);
        return {
          suite: suiteName,
          passed: testResult.numPassedTests || 0,
          failed: testResult.numFailedTests || 0,
          duration,
          coverage: testResult.coverageMap?.pct || 0
        };
      }
    } catch (error) {
      console.warn(`Failed to parse test output for ${suiteName}:`, error);
    }

    // Fallback result
    return {
      suite: suiteName,
      passed: 0,
      failed: 1,
      duration,
      coverage: 0
    };
  }

  private async generateReport(): Promise<IntegrationTestReport> {
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const overallCoverage = this.results.reduce((sum, r) => sum + (r.coverage || 0), 0) / this.results.length;

    // Determine compliance status
    let complianceStatus: 'PASSED' | 'FAILED' | 'PARTIAL' = 'PASSED';
    if (totalFailed > 0) {
      complianceStatus = totalPassed > 0 ? 'PARTIAL' : 'FAILED';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date(),
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      overallCoverage,
      suiteResults: this.results,
      complianceStatus,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for failed tests
    const failedSuites = this.results.filter(r => r.failed > 0);
    if (failedSuites.length > 0) {
      recommendations.push(`Address failing tests in: ${failedSuites.map(s => s.suite).join(', ')}`);
    }

    // Check for low coverage
    const lowCoverageSuites = this.results.filter(r => (r.coverage || 0) < 80);
    if (lowCoverageSuites.length > 0) {
      recommendations.push(`Improve test coverage for: ${lowCoverageSuites.map(s => s.suite).join(', ')}`);
    }

    // Check for slow tests
    const slowSuites = this.results.filter(r => r.duration > 10000); // > 10 seconds
    if (slowSuites.length > 0) {
      recommendations.push(`Optimize performance for slow test suites: ${slowSuites.map(s => s.suite).join(', ')}`);
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('All integration tests are passing successfully!');
      recommendations.push('Consider adding more edge case tests to improve coverage');
      recommendations.push('Monitor test performance and optimize as needed');
    }

    return recommendations;
  }

  private async saveReport(report: IntegrationTestReport): Promise<void> {
    const reportPath = path.join(this.outputDir, `integration-test-report-${Date.now()}.json`);
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📊 Report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to save report:', error);
    }

    // Also save a latest report
    const latestReportPath = path.join(this.outputDir, 'latest-integration-report.json');
    try {
      await fs.writeFile(latestReportPath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save latest report:', error);
    }
  }

  private async displaySummary(report: IntegrationTestReport): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📈 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🕐 Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`⏱️  Total Duration: ${report.totalDuration}ms`);
    console.log(`📈 Overall Coverage: ${report.overallCoverage.toFixed(1)}%`);
    console.log(`🎯 Compliance Status: ${report.complianceStatus}`);

    console.log('\n📋 Suite Results:');
    report.suiteResults.forEach(suite => {
      const status = suite.failed === 0 ? '✅' : '❌';
      console.log(`  ${status} ${suite.suite}: ${suite.passed}/${suite.passed + suite.failed} (${suite.duration}ms)`);
    });

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });

    console.log('\n' + '='.repeat(60));
    
    // Exit with appropriate code
    if (report.complianceStatus === 'FAILED') {
      console.log('❌ Integration tests failed!');
      process.exit(1);
    } else if (report.complianceStatus === 'PARTIAL') {
      console.log('⚠️  Some integration tests failed!');
      process.exit(1);
    } else {
      console.log('🎉 All integration tests passed!');
      process.exit(0);
    }
  }
}

// Run the integration tests if this script is executed directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.run().catch(error => {
    console.error('Integration test runner failed:', error);
    process.exit(1);
  });
}

export { IntegrationTestRunner };
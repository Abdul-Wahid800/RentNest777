const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const UiUxTestSuite = require('./uiUxTests');
const FunctionalTestSuite = require('./functionalTests');
const UnitTestSuite = require('./unitTests');
const ValidationTestSuite = require('./validationTests');
const VulnerabilityTestSuite = require('./vulnerabilityTests');

const resultsDir = path.join(__dirname, 'reports');

class ComprehensiveTestRunner {
  constructor() {
    this.allResults = {
      uiUx: [],
      functional: [],
      unit: [],
      validation: [],
      vulnerability: []
    };
    this.startTime = Date.now();
  }

  async ensureReportsDir() {
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  }

  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('   🚀 RENTNEST E2E TEST SUITE - COMPLETE EXECUTION');
    console.log('='.repeat(60));

    await this.ensureReportsDir();

    // UI/UX Tests
    const uiUxSuite = new UiUxTestSuite();
    this.allResults.uiUx = await uiUxSuite.runTests();

    // Functional Tests
    const functionalSuite = new FunctionalTestSuite();
    this.allResults.functional = await functionalSuite.runTests();

    // Unit Tests
    const unitSuite = new UnitTestSuite();
    this.allResults.unit = await unitSuite.runTests();

    // Validation Tests
    const validationSuite = new ValidationTestSuite();
    this.allResults.validation = await validationSuite.runTests();

    // Vulnerability Tests
    const vulnerabilitySuite = new VulnerabilityTestSuite();
    this.allResults.vulnerability = await vulnerabilitySuite.runTests();

    const totalDuration = Date.now() - this.startTime;
    this.generateReports(totalDuration);
  }

  generateReports(totalDuration) {
    console.log('\n' + '='.repeat(60));
    console.log('   📊 GENERATING TEST REPORTS...');
    console.log('='.repeat(60) + '\n');

    const summary = this.createSummary(totalDuration);
    this.generateExcelReport(summary);
    this.generateCsvReport(summary);
    this.generateJsonReport(summary);
    this.generateDeployabilityStatus(summary);

    console.log('✅ All reports generated successfully!\n');
  }

  createSummary(totalDuration) {
    const uiUxPass = this.allResults.uiUx.filter(t => t.status === 'PASS').length;
    const functionalPass = this.allResults.functional.filter(t => t.status === 'PASS').length;
    const unitPass = this.allResults.unit.filter(t => t.status === 'PASS').length;
    const validationPass = this.allResults.validation.filter(t => t.status === 'PASS').length;
    const vulnerabilityPass = this.allResults.vulnerability.filter(t => t.status === 'PASS').length;

    const totalTests = this.allResults.uiUx.length + this.allResults.functional.length + this.allResults.unit.length + this.allResults.validation.length + this.allResults.vulnerability.length;
    const totalPass = uiUxPass + functionalPass + unitPass + validationPass + vulnerabilityPass;
    const totalFail = totalTests - totalPass;
    const passPercentage = ((totalPass / totalTests) * 100).toFixed(2);

    return {
      totalTests,
      totalPass,
      totalFail,
      passPercentage,
      duration: totalDuration,
      uiUx: {
        count: this.allResults.uiUx.length,
        pass: uiUxPass,
        fail: this.allResults.uiUx.length - uiUxPass
      },
      functional: {
        count: this.allResults.functional.length,
        pass: functionalPass,
        fail: this.allResults.functional.length - functionalPass
      },
      unit: {
        count: this.allResults.unit.length,
        pass: unitPass,
        fail: this.allResults.unit.length - unitPass
      },
      validation: {
        count: this.allResults.validation.length,
        pass: validationPass,
        fail: this.allResults.validation.length - validationPass
      },
      vulnerability: {
        count: this.allResults.vulnerability.length,
        pass: vulnerabilityPass,
        fail: this.allResults.vulnerability.length - vulnerabilityPass
      },
      timestamp: new Date().toISOString()
    };
  }

  generateExcelReport(summary) {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Test Execution Summary', ''],
      ['Total Test Cases', summary.totalTests],
      ['Total Passed', summary.totalPass],
      ['Total Failed', summary.totalFail],
      ['Pass Rate (%)', summary.passPercentage],
      ['Total Duration (ms)', summary.duration],
      ['Execution Time', new Date(summary.timestamp).toLocaleString()],
      [''],
      ['Category', 'Total', 'Passed', 'Failed', 'Pass %'],
      ['UI/UX', summary.uiUx.count, summary.uiUx.pass, summary.uiUx.fail, ((summary.uiUx.pass / summary.uiUx.count) * 100).toFixed(2)],
      ['Functional', summary.functional.count, summary.functional.pass, summary.functional.fail, ((summary.functional.pass / summary.functional.count) * 100).toFixed(2)],
      ['Unit', summary.unit.count, summary.unit.pass, summary.unit.fail, ((summary.unit.pass / summary.unit.count) * 100).toFixed(2)],
      ['Validation', summary.validation.count, summary.validation.pass, summary.validation.fail, ((summary.validation.pass / summary.validation.count) * 100).toFixed(2)],
      ['Vulnerability', summary.vulnerability.count, summary.vulnerability.pass, summary.vulnerability.fail, ((summary.vulnerability.pass / summary.vulnerability.count) * 100).toFixed(2)]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // UI/UX Sheet
    const uiUxData = [['Test ID', 'Test Name', 'Status', 'Duration (ms)']];
    this.allResults.uiUx.forEach(t => uiUxData.push([t.id, t.name, t.status, t.duration]));
    const uiUxSheet = XLSX.utils.aoa_to_sheet(uiUxData);
    XLSX.utils.book_append_sheet(workbook, uiUxSheet, 'UI_UX_Tests');

    // Functional Sheet
    const functionalData = [['Test ID', 'Test Name', 'Status', 'Duration (ms)']];
    this.allResults.functional.forEach(t => functionalData.push([t.id, t.name, t.status, t.duration]));
    const functionalSheet = XLSX.utils.aoa_to_sheet(functionalData);
    XLSX.utils.book_append_sheet(workbook, functionalSheet, 'Functional Tests');

    // Unit Sheet
    const unitData = [['Test ID', 'Test Name', 'Status', 'Duration (ms)']];
    this.allResults.unit.forEach(t => unitData.push([t.id, t.name, t.status, t.duration]));
    const unitSheet = XLSX.utils.aoa_to_sheet(unitData);
    XLSX.utils.book_append_sheet(workbook, unitSheet, 'Unit Tests');

    // Validation Sheet
    const validationData = [['Test ID', 'Test Name', 'Status', 'Duration (ms)']];
    this.allResults.validation.forEach(t => validationData.push([t.id, t.name, t.status, t.duration]));
    const validationSheet = XLSX.utils.aoa_to_sheet(validationData);
    XLSX.utils.book_append_sheet(workbook, validationSheet, 'Validation Tests');

    // Vulnerability Sheet
    const vulnerabilityData = [['Test ID', 'Test Name', 'Status', 'Duration (ms)']];
    this.allResults.vulnerability.forEach(t => vulnerabilityData.push([t.id, t.name, t.status, t.duration]));
    const vulnerabilitySheet = XLSX.utils.aoa_to_sheet(vulnerabilityData);
    XLSX.utils.book_append_sheet(workbook, vulnerabilitySheet, 'Vulnerability Tests');

    const reportPath = path.join(resultsDir, 'comprehensive-test-report.xlsx');
    XLSX.writeFile(workbook, reportPath);
    console.log('📊 Excel Report:', reportPath);
  }

  generateCsvReport(summary) {
    let csvContent = 'Test Execution Summary\n';
    csvContent += `Timestamp,${summary.timestamp}\n`;
    csvContent += `Total Tests,${summary.totalTests}\n`;
    csvContent += `Total Passed,${summary.totalPass}\n`;
    csvContent += `Total Failed,${summary.totalFail}\n`;
    csvContent += `Pass Rate (%),${ summary.passPercentage}\n`;
    csvContent += `Total Duration (ms),${summary.duration}\n\n`;

    csvContent += 'Category,Total,Passed,Failed,Pass %\n';
    csvContent += `UI/UX,${summary.uiUx.count},${summary.uiUx.pass},${summary.uiUx.fail},${((summary.uiUx.pass / summary.uiUx.count) * 100).toFixed(2)}\n`;
    csvContent += `Functional,${summary.functional.count},${summary.functional.pass},${summary.functional.fail},${((summary.functional.pass / summary.functional.count) * 100).toFixed(2)}\n`;
    csvContent += `Unit,${summary.unit.count},${summary.unit.pass},${summary.unit.fail},${((summary.unit.pass / summary.unit.count) * 100).toFixed(2)}\n`;
    csvContent += `Validation,${summary.validation.count},${summary.validation.pass},${summary.validation.fail},${((summary.validation.pass / summary.validation.count) * 100).toFixed(2)}\n`;
    csvContent += `Vulnerability,${summary.vulnerability.count},${summary.vulnerability.pass},${summary.vulnerability.fail},${((summary.vulnerability.pass / summary.vulnerability.count) * 100).toFixed(2)}\n\n`;

    csvContent += 'All Test Cases\nTest ID,Category,Test Name,Status,Duration (ms)\n';
    this.allResults.uiUx.forEach(t => csvContent += `${t.id},UI/UX,${t.name},${t.status},${t.duration}\n`);
    this.allResults.functional.forEach(t => csvContent += `${t.id},Functional,${t.name},${t.status},${t.duration}\n`);
    this.allResults.unit.forEach(t => csvContent += `${t.id},Unit,${t.name},${t.status},${t.duration}\n`);
    this.allResults.validation.forEach(t => csvContent += `${t.id},Validation,${t.name},${t.status},${t.duration}\n`);
    this.allResults.vulnerability.forEach(t => csvContent += `${t.id},Vulnerability,${t.name},${t.status},${t.duration}\n`);

    const reportPath = path.join(resultsDir, 'comprehensive-test-report.csv');
    fs.writeFileSync(reportPath, csvContent, 'utf8');
    console.log('📄 CSV Report:', reportPath);
  }

  generateJsonReport(summary) {
    const jsonReport = {
      executionSummary: summary,
      testResults: {
        uiUx: this.allResults.uiUx,
        functional: this.allResults.functional,
        unit: this.allResults.unit,
        validation: this.allResults.validation,
        vulnerability: this.allResults.vulnerability
      }
    };

    const reportPath = path.join(resultsDir, 'comprehensive-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2), 'utf8');
    console.log('📋 JSON Report:', reportPath);
  }

  generateDeployabilityStatus(summary) {
    const passPercentage = parseFloat(summary.passPercentage);
    let deployableStatus = 'NOT_READY';
    let deployabilityScore = 0;

    if (passPercentage === 100) {
      deployableStatus = 'READY_FOR_PRODUCTION';
      deployabilityScore = 100;
    } else if (passPercentage >= 95) {
      deployableStatus = 'READY_WITH_MINOR_ISSUES';
      deployabilityScore = 95;
    } else if (passPercentage >= 85) {
      deployableStatus = 'READY_FOR_STAGING';
      deployabilityScore = 85;
    } else if (passPercentage >= 70) {
      deployableStatus = 'NEEDS_FIXES';
      deployabilityScore = 70;
    }

    const deployabilityReport = {
      deployableStatus,
      deployabilityScore,
      passRate: passPercentage,
      totalTestsPassed: summary.totalPass,
      totalTestsFailed: summary.totalFail,
      recommendations: this.getDeploymentRecommendations(deployableStatus, summary),
      checkPoints: {
        functionalityComplete: summary.functional.pass === summary.functional.count,
        uiUxOptimized: summary.uiUx.pass === summary.uiUx.count,
        unitTestsPassed: summary.unit.pass === summary.unit.count,
        validationPassed: summary.validation.pass === summary.validation.count,
        securityValidated: summary.vulnerability.pass === summary.vulnerability.count
      },
      generatedAt: new Date().toISOString()
    };

    const reportPath = path.join(resultsDir, 'deployability-status.json');
    fs.writeFileSync(reportPath, JSON.stringify(deployabilityReport, null, 2), 'utf8');
    console.log('🚀 Deployability Status:', reportPath);
    console.log(`   Status: ${deployableStatus}`);
    console.log(`   Score: ${deployabilityScore}%`);
  }

  getDeploymentRecommendations(status, summary) {
    const recommendations = [];

    if (summary.functional.fail > 0) {
      recommendations.push('⚠️  Fix functional test failures before deployment');
    }
    if (summary.validation.fail > 0) {
      recommendations.push('⚠️  Address validation test failures');
    }
    if (summary.vulnerability.fail > 0) {
      recommendations.push('⚠️  Address vulnerability/security test failures');
    }
    if (summary.uiUx.fail > 0) {
      recommendations.push('⚠️  Review UI/UX inconsistencies');
    }
    if (summary.unit.fail > 0) {
      recommendations.push('⚠️  Fix unit test failures');
    }
    if (summary.totalFail === 0) {
      recommendations.push('✅ All tests passed - safe to deploy');
    }

    return recommendations;
  }
}

// Run tests
const runner = new ComprehensiveTestRunner();
runner.runAllTests()
  .then(() => {
    console.log('✅ Test execution completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  });

module.exports = ComprehensiveTestRunner;

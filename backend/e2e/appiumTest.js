const wd = require('wd');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const resultsDir = path.join(__dirname, 'reports');
const reportCsv = path.join(resultsDir, 'mobile-e2e-report.csv');
const reportXlsx = path.join(resultsDir, 'mobile-e2e-report.xlsx');
const reportRows = [['Test Name', 'Status', 'Duration(ms)', 'Error']];

function ensureReportsDir() {
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
}

function appendReport(row) {
  reportRows.push([row.testName, row.status, row.durationMs, row.error || '']);
}

function writeReports() {
  const csvContent = reportRows.map(row => row.map(cell => String(cell).replace(/\n/g, ' ')).join(',')).join('\n');
  fs.writeFileSync(reportCsv, csvContent, 'utf8');
  const worksheet = XLSX.utils.aoa_to_sheet(reportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mobile E2E');
  XLSX.writeFile(workbook, reportXlsx);
}

async function runTest() {
  ensureReportsDir();

  const client = wd.promiseChainRemote('http://localhost:4723/wd/hub');

  const desiredCaps = {
    platformName: 'Android',
    automationName: 'UiAutomator2',
    appPackage: 'host.exp.exponent',
    appActivity: 'com.expediagroup.devlauncher.MainActivity',
    deviceName: 'Android Emulator',
    noReset: true,
    newCommandTimeout: 300,
  };

  let startTime = Date.now();

  try {
    await client.init(desiredCaps);
    await client.sleep(5000);
    appendReport({ testName: 'Launch Mobile App', status: 'PASS', durationMs: Date.now() - startTime });

    startTime = Date.now();
    const emailField = await client.elementByAccessibilityId('auth-email');
    await emailField.sendKeys('test@example.com');
    const passwordField = await client.elementByAccessibilityId('auth-password');
    await passwordField.sendKeys('password123');
    const submitButton = await client.elementByAccessibilityId('auth-submit');
    await submitButton.click();

    await client.sleep(8000);
    appendReport({ testName: 'Mobile Login Flow', status: 'PASS', durationMs: Date.now() - startTime });

  } catch (error) {
    appendReport({ testName: 'Mobile E2E', status: 'FAIL', durationMs: Date.now() - startTime, error: error.message.replace(/\n/g, ' ') });
    writeReports();
    throw error;
  } finally {
    await client.quit();
    writeReports();
  }
}

runTest()
  .then(() => console.log('Mobile E2E completed. Reports written to', reportCsv, 'and', reportXlsx))
  .catch(err => {
    console.error('Mobile E2E failed:', err);
    process.exit(1);
  });

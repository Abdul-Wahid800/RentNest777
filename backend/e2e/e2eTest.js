const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const resultsDir = path.join(__dirname, 'reports');
const reportCsv = path.join(resultsDir, 'web-e2e-report.csv');
const reportXlsx = path.join(resultsDir, 'web-e2e-report.xlsx');
const reportRows = [['Test Name', 'Status', 'Duration(ms)', 'Error']];

async function setupDriver() {
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--disable-gpu', '--window-size=1280,1024');

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}

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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Web E2E');
  XLSX.writeFile(workbook, reportXlsx);
}

async function runTest() {
  ensureReportsDir();

  const driver = await setupDriver();
  let startTime = Date.now();

  try {
    await driver.get('http://localhost:19006');
    await driver.wait(until.titleContains('RentNest'), 10000);
    appendReport({ testName: 'Launch Web App', status: 'PASS', durationMs: Date.now() - startTime });

    startTime = Date.now();
    await driver.wait(until.elementLocated(By.css('[data-testid="auth-tab-login"]')), 10000);
    await driver.findElement(By.css('[data-testid="auth-email"]')).sendKeys('test@example.com');
    await driver.findElement(By.css('[data-testid="auth-password"]')).sendKeys('password123');
    await driver.findElement(By.css('[data-testid="auth-submit"]')).click();

    await driver.wait(until.urlContains('/'), 10000);
    appendReport({ testName: 'Login Flow', status: 'PASS', durationMs: Date.now() - startTime });

  } catch (error) {
    appendReport({ testName: 'Web E2E', status: 'FAIL', durationMs: Date.now() - startTime, error: error.message.replace(/\n/g, ' ') });
    writeReports();
    throw error;
  } finally {
    await driver.quit();
    writeReports();
  }
}

runTest()
  .then(() => console.log('Web E2E completed. Reports written to', reportCsv, 'and', reportXlsx))
  .catch(err => {
    console.error('Web E2E failed:', err);
    process.exit(1);
  });

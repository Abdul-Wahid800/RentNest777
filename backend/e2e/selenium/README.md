# Selenium Web E2E Testing

Comprehensive end-to-end testing for the RentNest web application using Selenium WebDriver.

## Test Coverage

**48 Web E2E Tests** covering:

### Authentication (7 tests)
- App launch and page rendering
- Login page display
- Valid credential login
- Invalid credential handling
- User registration flow
- OTP verification
- Session management

### Discovery & Search (6 tests)
- Discover page loading
- Search functionality
- Category filtering
- Radius filtering
- Sort functionality
- Item scrolling

### Item Details (6 tests)
- Item detail page rendering
- Owner profile display
- Trust score badge
- Security deposit info
- Image gallery
- Verified badge

### Booking Flow (5 tests)
- Booking initiation
- Date selection
- Cost calculation
- Booking confirmation
- Booking success

### User Management (4 tests)
- Profile page display
- Edit profile functionality
- Add item form
- Item management

### Chat & Messaging (4 tests)
- Chat initiation
- Message sending
- Inbox display
- Real-time updates

### UI/UX (4 tests)
- Theme toggle
- Responsive design
- Accessibility
- Performance metrics

### Navigation (4 tests)
- Bottom navigation
- Header navigation
- Deep linking
- Back navigation

### Data Validation (4 tests)
- Email validation
- Password validation
- Phone validation
- Image upload

### Error Handling (4 tests)
- Network error handling
- Invalid data handling
- Timeout handling
- API error handling

### Security (4 tests)
- SQL Injection prevention
- XSS prevention
- Token validation
- Data encryption

## Installation

```bash
npm install selenium-webdriver xlsx
```

## Running Tests

```bash
# Ensure Expo web server is running on port 19006
npm run test:web

# Or run directly
node e2e/selenium/webE2eTests.js
```

## Configuration

- **Base URL**: http://localhost:19006
- **Browser**: Chrome (headless mode)
- **Timeout**: 5 seconds (implicit)
- **Execution**: Sequential

## Test Results

Reports are generated in `e2e/reports/`:

- **selenium-web-e2e-report.xlsx** - Comprehensive Excel report with:
  - Summary statistics
  - Detailed results by test
  - Category-wise breakdown
  - Pass/fail metrics
  - Execution times

## Report Analysis

### Summary Sheet
- Total tests executed
- Pass/fail counts
- Pass rate percentage
- Average duration
- Category breakdown

### Detailed Results Sheet
- Individual test results
- Execution times
- Error messages (if any)
- Timestamps

### Category Sheets
- Tests grouped by category
- Per-category statistics
- Individual test outcomes

## Best Practices

1. **Wait for Elements**: Tests use explicit waits for element visibility
2. **Error Handling**: Try-catch blocks for graceful failure reporting
3. **Clean Setup**: Driver setup before tests, cleanup after
4. **Clear Assertions**: Each test has a single responsibility
5. **Detailed Logging**: Console output for real-time monitoring

## Troubleshooting

### ChromeDriver Issues
- Ensure Chrome/Chromium is installed
- Update ChromeDriver to match Chrome version
- Run with `--headless=new` flag

### Port Conflicts
- Verify Expo server runs on port 19006
- Check for other services using port 19006

### Timeout Issues
- Increase implicit wait timeout
- Check network connectivity
- Verify element selectors

## Performance Metrics

- **Average test duration**: 50-200ms
- **Total suite execution**: ~10-15 minutes
- **Report generation**: <1 second
- **Memory usage**: <500MB

## CI/CD Integration

```yaml
- name: Run Selenium Web Tests
  run: npm run test:web
  
- name: Upload Excel Report
  uses: actions/upload-artifact@v2
  with:
    name: web-e2e-report
    path: e2e/reports/selenium-web-e2e-report.xlsx
```

## Support

For issues or questions about Selenium tests, check:
- Test output in terminal
- Excel report for detailed results
- Error messages in report sheets

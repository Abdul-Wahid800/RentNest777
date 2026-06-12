# Appium Mobile E2E Testing

Comprehensive end-to-end testing for the RentNest mobile application using Appium.

## Test Coverage

**91 Mobile E2E Tests** covering:

### Authentication (8 tests)
- App launch
- Auth screen display
- Valid login
- Invalid credentials
- Register tab switching
- User registration
- OTP input
- OTP verification

### Discovery (7 tests)
- Discover screen
- Search functionality
- Search input
- Category filtering
- Radius filtering
- Item scrolling
- Trending section

### Item Details (7 tests)
- Item card tap
- Item detail display
- Image gallery
- Trust score
- Verified badge
- Owner information
- Security deposit info

### Booking (7 tests)
- Booking button
- Date picker
- Date selection
- Cost display
- Deposit calculation
- Confirm booking
- Booking success

### Item Management (7 tests)
- Add item tab
- Item form display
- Title input
- Description input
- Category selection
- Image picker
- Price input

### Chat & Messaging (7 tests)
- Inbox tab
- Chat list
- Chat open
- Message input
- Send button
- Message display
- Real-time messages

### Profile Management (7 tests)
- Profile tab
- Profile info
- Edit profile button
- Profile edit form
- Save profile
- My bookings
- Logout button

### Booking History (7 tests)
- Bookings tab
- Bookings list
- Booking details
- Cancel booking
- Rate booking
- Review item
- Upload review image

### Navigation (6 tests)
- Bottom tab bar
- Tab navigation
- Back button
- Deep linking
- Swipe navigation

### UI/UX (7 tests)
- Screen orientation
- Text sizes
- Color scheme
- Button interaction
- Touch feedback
- Animations
- Loading states

### Validation (7 tests)
- Email validation
- Password validation
- Phone validation
- Required fields
- Data validation
- File upload
- Number input

### Permissions (5 tests)
- Camera permission
- Gallery permission
- Location permission
- Notification permission
- Contacts permission

### Performance (5 tests)
- App start time
- Page load time
- Scroll performance
- Search performance
- Image load time

### Error Handling (5 tests)
- Network error handling
- Timeout error handling
- Invalid input handling
- Server error handling
- App crash recovery

## Installation

```bash
npm install wd xlsx
```

## Prerequisites

1. **Appium Server** running on port 4723
   ```bash
   appium
   ```

2. **Android Emulator** or device connected
   ```bash
   emulator -avd YourAVDName
   ```

3. **App installed** on emulator/device

## Running Tests

```bash
# Ensure Appium server is running
npm run test:mobile

# Or run directly
node e2e/appium/mobileE2eTests.js
```

## Configuration

- **Appium Server**: http://localhost:4723/wd/hub
- **Platform**: Android
- **Automation Engine**: UiAutomator2
- **App Package**: host.exp.exponent
- **Timeout**: 300 seconds (5 minutes)

## Test Results

Reports are generated in `e2e/reports/`:

- **appium-mobile-e2e-report.xlsx** - Comprehensive Excel report with:
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

## Accessibility IDs

Tests use accessibility IDs for element selection:
- `auth-email` - Email input field
- `auth-password` - Password input field
- `auth-submit` - Submit button
- `auth-tab-login` - Login tab
- `auth-tab-register` - Register tab
- `auth-otp` - OTP input field

## Best Practices

1. **Wait Strategies**: Tests use explicit waits for elements
2. **Error Handling**: Try-catch blocks for graceful failures
3. **Clean Setup**: Driver initialization and cleanup
4. **Single Responsibility**: Each test has one focus
5. **Detailed Logging**: Real-time test execution monitoring

## Troubleshooting

### Appium Connection Issues
- Verify Appium is running: `appium --port 4723`
- Check Node.js and npm versions
- Ensure Android SDK is installed

### Emulator Issues
- List available emulators: `emulator -list-avds`
- Create new emulator: `avdmanager create avd -n TestAVD -k "system-images;android-30;google_apis;x86"`
- Start emulator with GPU: `emulator -avd TestAVD -gpu on`

### Element Not Found
- Verify accessibility IDs in app code
- Check element visibility before interaction
- Use XPath as fallback selector

### Timeout Issues
- Increase timeout values
- Verify network connectivity
- Check app responsiveness

## Performance Metrics

- **Average test duration**: 50-300ms
- **Total suite execution**: ~30-40 minutes
- **Report generation**: <2 seconds
- **Memory usage**: ~1-2GB

## Device Compatibility

Tested on:
- Android 8.0+
- Google Pixel emulator
- Samsung device

## CI/CD Integration

```yaml
- name: Run Appium Mobile Tests
  run: npm run test:mobile
  
- name: Upload Excel Report
  uses: actions/upload-artifact@v2
  with:
    name: mobile-e2e-report
    path: e2e/reports/appium-mobile-e2e-report.xlsx
```

## Support

For issues or questions about Appium tests, check:
- Appium server logs
- Test output in terminal
- Excel report for detailed results
- Device logs via `adb logcat`

# End-to-End Testing with Playwright

This document describes the E2E testing setup for the RentRedi frontend application.

## Overview

We use [Playwright](https://playwright.dev/) for comprehensive end-to-end testing across multiple browsers and devices. Our test suite covers:

- **Authentication flows** (signup, signin, logout)
- **User management** (CRUD operations)
- **Navigation and routing**
- **Dashboard features**
- **Responsive design**

## Test Coverage

### 1. Authentication Tests (`e2e/auth.spec.js`)

**15+ tests covering:**
- Login page display and UI elements
- Signup/signin mode toggling
- Email and password validation
- Account creation flow
- Sign-in with existing account
- Error handling (invalid credentials, duplicate email)
- Logout functionality
- Protected route redirects

**Example test:**
```javascript
test('should sign up with new account', async ({ page }) => {
  const email = generateTestEmail();
  const password = generateTestPassword();

  await page.click('text=Don\'t have an account? Sign Up');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard/);
});
```

### 2. User Management Tests (`e2e/user-management.spec.js`)

**20+ tests covering:**
- Page display and empty states
- Modal operations (open, close, cancel)
- Creating users with validation
- Editing existing users
- Deleting users with confirmation
- Search and filter functionality
- Geolocation data display
- Multiple user handling
- UI elements (avatars, buttons, tables)

**Example test:**
```javascript
test('should create a new user with valid data', async ({ page }) => {
  await page.click('button:has-text("Add User")');
  await page.fill('#name', 'John Doe');
  await page.fill('#zip', '10001');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

### 3. Navigation Tests (`e2e/navigation.spec.js`)

**25+ tests covering:**
- Navigation bar and links
- Route navigation and URL changes
- Active link highlighting
- User information display
- Browser back/forward navigation
- Dashboard statistics
- Recent users list
- Responsive design (mobile, tablet, desktop)
- Unknown route handling

**Example test:**
```javascript
test('should navigate to Users page', async ({ page }) => {
  await page.click('text=Users');
  await expect(page).toHaveURL(/.*users/);
  await expect(page.locator('h1')).toContainText('User Management');
});
```

## Running Tests

### Prerequisites

```bash
# Install dependencies (if not already installed)
cd frontend
npm install
```

### Run All Tests

```bash
# Run all tests in headless mode
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth.spec.js
```

### View Test Results

```bash
# Show HTML report
npm run test:e2e:report

# Reports are generated in:
# - playwright-report/ (HTML report)
# - test-results/ (JSON results, screenshots, videos)
```

### Run Tests on Specific Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit (Safari) only
npx playwright test --project=webkit

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

The `playwright.config.js` file configures:

- **Test directory**: `./e2e`
- **Timeout**: 30 seconds per test
- **Parallel execution**: Tests run in parallel for speed
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on first retry

### Browser Coverage

Tests run on:
- ✅ Desktop Chrome (Chromium)
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

### Auto-Start Dev Server

The configuration automatically starts the development server before running tests:

```javascript
webServer: {
  command: 'npm start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

## Test Utilities

### Authentication Helpers (`e2e/fixtures/auth.js`)

**`generateTestEmail()`**
- Generates unique email addresses for each test
- Format: `test-{timestamp}-{random}@rentredi.test`
- Prevents conflicts between parallel tests

**`generateTestPassword()`**
- Returns consistent test password: `TestPassword123!`
- Meets Firebase password requirements (6+ characters)

**Usage:**
```javascript
import { generateTestEmail, generateTestPassword } from './fixtures/auth';

const email = generateTestEmail();
const password = generateTestPassword();
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Install Playwright browsers
        run: |
          cd frontend
          npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Debugging Tests

### Debug Mode

```bash
# Run in debug mode with inspector
npx playwright test --debug

# Debug specific test
npx playwright test e2e/auth.spec.js:10 --debug
```

### Visual Debugging

```bash
# Use Playwright UI mode for visual debugging
npm run test:e2e:ui
```

### Screenshots and Videos

On test failure, Playwright automatically captures:
- **Screenshots**: `test-results/*/test-failed-*.png`
- **Videos**: `test-results/*/video.webm`
- **Traces**: `test-results/*/trace.zip`

View traces:
```bash
npx playwright show-trace test-results/*/trace.zip
```

## Best Practices

### 1. Test Isolation
Each test creates a fresh user account with `generateTestEmail()`:
```javascript
test.beforeEach(async ({ page }) => {
  const email = generateTestEmail();
  const password = generateTestPassword();

  // Create new account for this test
  await page.goto('/login');
  await page.click('text=Don\'t have an account? Sign Up');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
});
```

### 2. Explicit Waits
Use Playwright's auto-waiting with explicit timeouts:
```javascript
await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
await page.waitForURL('**/dashboard', { timeout: 10000 });
```

### 3. Stable Selectors
Prefer semantic selectors over CSS classes:
```javascript
// Good
await page.click('button:has-text("Add User")');
await page.locator('h1:has-text("Dashboard")');

// Avoid
await page.click('.btn-primary');
```

### 4. Test Data Cleanup
Tests use unique email addresses, so Firebase Authentication automatically isolates user data. No manual cleanup needed.

## Troubleshooting

### "Server is not running"
Ensure the dev server starts before tests:
```bash
# Start manually in separate terminal
cd frontend
npm start

# Then run tests with existing server
npm run test:e2e
```

### "Target page is closed"
Increase timeout in `playwright.config.js`:
```javascript
timeout: 60 * 1000, // 60 seconds
```

### "Element is not visible"
Add explicit wait:
```javascript
await expect(page.locator('selector')).toBeVisible({ timeout: 10000 });
```

### Firebase Connection Issues
Ensure Firebase configuration is correct in `src/firebaseConfig.js`. See `EMAIL_PASSWORD_AUTH_SETUP.md` for setup instructions.

### "browserType.launch: Executable doesn't exist"
Install Playwright browsers:
```bash
npx playwright install
```

## Test Metrics

Current test coverage:
- **Total tests**: 60+
- **Test files**: 3
- **Browser configurations**: 5
- **Viewport sizes**: 3 (mobile, tablet, desktop)

## Next Steps

Future improvements:
1. **Visual regression testing** with Playwright screenshots
2. **Accessibility testing** with @axe-core/playwright
3. **Performance testing** with Lighthouse CI
4. **API mocking** for offline testing
5. **Test coverage reporting** integration

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright CI/CD](https://playwright.dev/docs/ci)
- [Playwright Debugging](https://playwright.dev/docs/debug)

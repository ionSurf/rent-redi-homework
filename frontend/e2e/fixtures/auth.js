import { test as base } from '@playwright/test';

/**
 * Test fixtures for authenticated sessions
 *
 * Usage:
 *   test.use({ storageState: 'auth.json' });
 */

// Generate a unique test email
export function generateTestEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@rentredi.test`;
}

// Generate a test password
export function generateTestPassword() {
  return 'TestPassword123!';
}

// Test user credentials
export const TEST_USER = {
  email: 'playwright-test@rentredi.test',
  password: 'PlaywrightTest123!'
};

/**
 * Extended test with authenticated user
 */
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Try to sign up first (in case user doesn't exist)
    const signupButton = page.locator('button:has-text("Sign Up")');
    if (await signupButton.isVisible()) {
      await signupButton.click();
    } else {
      await page.click('button[type="submit"]');
    }

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Use the authenticated page
    await use(page);

    // Cleanup: logout
    await page.click('button:has-text("Logout")');
  },
});

export { expect } from '@playwright/test';

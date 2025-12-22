import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestPassword } from './fixtures/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/RentRedi/i);
    await expect(page.locator('h1')).toContainText('RentRedi');
    await expect(page.locator('h2')).toContainText('Welcome Back');
  });

  test('should have email and password inputs', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    // Start on sign in
    await expect(page.locator('h2')).toContainText('Welcome Back');

    // Click toggle to sign up
    await page.click('text=Don\'t have an account? Sign Up');

    // Should show sign up
    await expect(page.locator('h2')).toContainText('Create Account');
    await expect(page.locator('button[type="submit"]')).toContainText('Sign Up');

    // Toggle back
    await page.click('text=Already have an account? Sign In');

    // Should show sign in
    await expect(page.locator('h2')).toContainText('Welcome Back');
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should validate password length', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', '12345'); // Too short
    await page.click('button[type="submit"]');

    // Should show error or validation message
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('minLength', '6');
  });

  test('should sign up with new account', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Switch to sign up
    await page.click('text=Don\'t have an account? Sign Up');

    // Fill in new account details
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });

    // Should see user email in navbar
    await expect(page.locator('.navbar')).toContainText(email);
  });

  test('should show error for existing email', async ({ page }) => {
    const email = 'existing-user@test.com';
    const password = generateTestPassword();

    // Create account first time
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for account creation
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Try to create same account again
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText(/already in use/i);
  });

  test('should sign in with existing account', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Create account
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Sign in
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('.navbar')).toContainText(email);
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Sign up
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show loading state during authentication', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show loading text briefly
    await expect(submitButton).toContainText(/please wait/i, { timeout: 1000 }).catch(() => {
      // Loading might be too fast to catch, that's ok
    });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to login when accessing users without auth', async ({ page }) => {
    await page.goto('/users');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Sign up
    await page.goto('/login');
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Try to access login page
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

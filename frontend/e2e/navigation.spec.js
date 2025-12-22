import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestPassword } from './fixtures/auth';

test.describe('Navigation and Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Create account and login
    const email = generateTestEmail();
    const password = generateTestPassword();

    await page.goto('/login');
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display navigation bar', async ({ page }) => {
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('.navbar-brand:has-text("RentRedi")')).toBeVisible();
  });

  test('should show Dashboard and Users links in navbar', async ({ page }) => {
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
    await expect(page.locator('text=Users').first()).toBeVisible();
  });

  test('should navigate to Dashboard', async ({ page }) => {
    // Go to users first
    await page.click('text=Users');
    await expect(page).toHaveURL(/.*users/);

    // Navigate back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1:has-text("Landlord Dashboard")')).toBeVisible();
  });

  test('should navigate to Users page', async ({ page }) => {
    await page.click('text=Users');

    await expect(page).toHaveURL(/.*users/);
    await expect(page.locator('h1:has-text("User Management")')).toBeVisible();
  });

  test('should highlight active navigation link', async ({ page }) => {
    // Dashboard should be active by default
    await expect(page.locator('.nav-link.active:has-text("Dashboard")')).toBeVisible();

    // Click Users
    await page.click('text=Users');
    await expect(page.locator('.nav-link.active:has-text("Users")')).toBeVisible();

    // Dashboard should not be active
    const dashboardLink = page.locator('.nav-link:has-text("Dashboard")');
    await expect(dashboardLink).not.toHaveClass(/active/);
  });

  test('should display user email in navbar', async ({ page }) => {
    const userEmail = await page.locator('.user-email').textContent();
    expect(userEmail).toBeTruthy();
    expect(userEmail).toContain('@');
  });

  test('should display user avatar', async ({ page }) => {
    await expect(page.locator('.user-avatar')).toBeVisible();

    // Avatar should contain first letter of email
    const avatar = await page.locator('.user-avatar').textContent();
    expect(avatar).toBeTruthy();
    expect(avatar.length).toBeGreaterThan(0);
  });

  test('should show logout button', async ({ page }) => {
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should handle browser back button', async ({ page }) => {
    // Navigate to users
    await page.click('text=Users');
    await expect(page).toHaveURL(/.*users/);

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*dashboard/);

    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*users/);
  });

  test('should redirect root path to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe('Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    await page.goto('/login');
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard title and description', async ({ page }) => {
    await expect(page.locator('h1:has-text("Landlord Dashboard")')).toBeVisible();
    await expect(page.locator('text=Overview of your tenant management system')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Should show stat cards for Total Users, ZIP Codes, Time Zones
    await expect(page.locator('.stat-card')).toHaveCount(3);
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Unique ZIP Codes')).toBeVisible();
    await expect(page.locator('text=Time Zones')).toBeVisible();
  });

  test('should show zero counts for empty dashboard', async ({ page }) => {
    // Initially, all counts should be 0
    const statValues = await page.locator('.stat-content h3').allTextContents();

    // All should be "0" initially
    statValues.forEach(value => {
      expect(parseInt(value)).toBe(0);
    });
  });

  test('should display recent users section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Recent Users")')).toBeVisible();
  });

  test('should show empty state when no users', async ({ page }) => {
    const emptyState = page.locator('text=No users yet');
    await expect(emptyState).toBeVisible();
  });

  test('should update statistics when user is added', async ({ page }) => {
    // Navigate to users page
    await page.click('text=Users');

    // Add a user
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Dashboard Test User');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go back to dashboard
    await page.click('text=Dashboard');

    // Stats should update
    const totalUsers = await page.locator('.stat-card').first().locator('h3').textContent();
    expect(parseInt(totalUsers)).toBeGreaterThan(0);
  });

  test('should display recent users list', async ({ page }) => {
    // Navigate to users and add a user
    await page.click('text=Users');
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Recent User Test');
    await page.fill('#zip', '90210');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go back to dashboard
    await page.click('text=Dashboard');

    // Recent user should appear
    await expect(page.locator('text=Recent User Test')).toBeVisible({ timeout: 5000 });
  });

  test('should show user details in recent users', async ({ page }) => {
    // Add a user
    await page.click('text=Users');
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Details Test');
    await page.fill('#zip', '60601');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go to dashboard
    await page.click('text=Dashboard');

    // Should show name, ZIP, and timezone
    await expect(page.locator('text=Details Test')).toBeVisible();
    await expect(page.locator('text=60601')).toBeVisible();
  });

  test('should have statistics icons', async ({ page }) => {
    // Check that stat cards have SVG icons
    const svgCount = await page.locator('.stat-icon svg').count();
    expect(svgCount).toBe(3);
  });

  test('should have user avatars in recent users', async ({ page }) => {
    // Add a user
    await page.click('text=Users');
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Avatar Dashboard Test');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go to dashboard
    await page.click('text=Dashboard');

    // Should show avatar
    await expect(page.locator('.user-avatar')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    await page.goto('/login');
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

    // Navigation should still be visible
    await expect(page.locator('.navbar')).toBeVisible();

    // Should be able to navigate
    await page.click('text=Users');
    await expect(page).toHaveURL(/.*users/);
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

    // All elements should be visible
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('.stat-card')).toHaveCount(3);
  });

  test('should have readable text on all viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Text should be visible and readable
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.navbar-brand')).toBeVisible();
    }
  });
});

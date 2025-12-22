import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestPassword } from './fixtures/auth';

test.describe('User Management - CRUD Operations', () => {
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

    // Navigate to users page
    await page.click('text=Users');
    await page.waitForURL('**/users');
  });

  test('should display user management page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('User Management');
    await expect(page.locator('button:has-text("Add User")')).toBeVisible();
  });

  test('should show empty state when no users exist', async ({ page }) => {
    // Check for empty state or users table
    const hasEmptyState = await page.locator('text=No users yet').isVisible().catch(() => false);
    const hasUsersTable = await page.locator('.users-table').isVisible().catch(() => false);

    expect(hasEmptyState || hasUsersTable).toBeTruthy();
  });

  test('should open add user modal', async ({ page }) => {
    await page.click('button:has-text("Add User")');

    // Modal should be visible
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.locator('h2:has-text("Add New User")')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#zip')).toBeVisible();
  });

  test('should close modal with cancel button', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await expect(page.locator('.modal-content')).toBeVisible();

    await page.click('button:has-text("Cancel")');

    // Modal should close
    await expect(page.locator('.modal-content')).not.toBeVisible();
  });

  test('should close modal by clicking overlay', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await expect(page.locator('.modal-content')).toBeVisible();

    // Click overlay
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

    // Modal should close
    await expect(page.locator('.modal-content')).not.toBeVisible();
  });

  test('should create a new user with valid data', async ({ page }) => {
    await page.click('button:has-text("Add User")');

    // Fill in user details
    await page.fill('#name', 'John Doe');
    await page.fill('#zip', '10001');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create User")');

    // Modal should close
    await expect(page.locator('.modal-content')).not.toBeVisible({ timeout: 10000 });

    // User should appear in the list
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=10001')).toBeVisible();
  });

  test('should show validation error for short name', async ({ page }) => {
    await page.click('button:has-text("Add User")');

    await page.fill('#name', 'J'); // Too short
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should show validation error for invalid ZIP code', async ({ page }) => {
    await page.click('button:has-text("Add User")');

    await page.fill('#name', 'John Doe');
    await page.fill('#zip', '123'); // Too short
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should search/filter users', async ({ page }) => {
    // Create two users first
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Alice Smith');
    await page.fill('#zip', '90210');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Bob Jones');
    await page.fill('#zip', '60601');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Search for Alice
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Alice');

    // Should show only Alice
    await expect(page.locator('text=Alice Smith')).toBeVisible();
    await expect(page.locator('text=Bob Jones')).not.toBeVisible();

    // Clear search
    await searchInput.clear();

    // Both should be visible
    await expect(page.locator('text=Alice Smith')).toBeVisible();
    await expect(page.locator('text=Bob Jones')).toBeVisible();
  });

  test('should edit an existing user', async ({ page }) => {
    // Create a user first
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Original Name');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Click edit button
    await page.click('[title="Edit"]').first();

    // Modal should open with existing data
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.locator('#name')).toHaveValue('Original Name');
    await expect(page.locator('#zip')).toHaveValue('10001');

    // Update name
    await page.fill('#name', 'Updated Name');
    await page.click('button[type="submit"]:has-text("Update User")');

    // Should see updated name
    await expect(page.locator('text=Updated Name')).toBeVisible({ timeout: 10000 });
  });

  test('should delete a user', async ({ page }) => {
    // Create a user first
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'To Be Deleted');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify user exists
    await expect(page.locator('text=To Be Deleted')).toBeVisible();

    // Click delete button and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.click('[title="Delete"]').first();

    // User should be removed
    await expect(page.locator('text=To Be Deleted')).not.toBeVisible({ timeout: 10000 });
  });

  test('should cancel delete operation', async ({ page }) => {
    // Create a user first
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Should Not Delete');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Click delete but cancel
    page.on('dialog', dialog => dialog.dismiss());
    await page.click('[title="Delete"]').first();

    // User should still be visible
    await expect(page.locator('text=Should Not Delete')).toBeVisible();
  });

  test('should display user geolocation data', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Location Test');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');

    // Wait for user to be created with geolocation
    await page.waitForTimeout(3000);

    // Should display location data (latitude, longitude, timezone)
    const hasLocationData = await page.locator('text=/\\d+\\.\\d+.*,.*\\d+\\.\\d+/').isVisible().catch(() => false);

    // Location data should be visible in the table
    expect(hasLocationData).toBeTruthy();
  });

  test('should handle multiple users', async ({ page }) => {
    // Create 3 users
    const users = [
      { name: 'User One', zip: '10001' },
      { name: 'User Two', zip: '90210' },
      { name: 'User Three', zip: '60601' }
    ];

    for (const user of users) {
      await page.click('button:has-text("Add User")');
      await page.fill('#name', user.name);
      await page.fill('#zip', user.zip);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    // All users should be visible
    for (const user of users) {
      await expect(page.locator(`text=${user.name}`)).toBeVisible();
    }
  });

  test('should show proper error message for invalid ZIP in backend', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Test User');
    await page.fill('#zip', '00000'); // Invalid ZIP that passes client validation
    await page.click('button[type="submit"]');

    // Should show error from backend
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Management - UI/UX', () => {
  test.beforeEach(async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    await page.goto('/login');
    await page.click('text=Don\'t have an account? Sign Up');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.click('text=Users');
    await page.waitForURL('**/users');
  });

  test('should have responsive table headers', async ({ page }) => {
    const headers = ['Name', 'ZIP Code', 'Location', 'Time Zone', 'Actions'];

    for (const header of headers) {
      await expect(page.locator(`.table-header :has-text("${header}")`)).toBeVisible();
    }
  });

  test('should display user avatars with initials', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Avatar Test');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should show avatar with first letter
    await expect(page.locator('.user-avatar-small:has-text("A")')).toBeVisible();
  });

  test('should show action buttons with hover states', async ({ page }) => {
    await page.click('button:has-text("Add User")');
    await page.fill('#name', 'Hover Test');
    await page.fill('#zip', '10001');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Edit and delete buttons should be visible
    await expect(page.locator('[title="Edit"]').first()).toBeVisible();
    await expect(page.locator('[title="Delete"]').first()).toBeVisible();
  });
});

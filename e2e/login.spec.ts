import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('customer can view login screen', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check if the title exists
    const title = page.locator('text=Welcome to Quicky');
    await expect(title).toBeVisible();

    // Check for email and password inputs
    const emailInput = page.locator('input[placeholder="Email"]');
    const passwordInput = page.locator('input[placeholder="Password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('store can view login screen', async ({ page }) => {
    // Navigate to the store app web entry (assuming a different port or path)
    // Here we'll simulate reaching the store app's login.
    await page.goto('/store');
    
    const title = page.locator('text=Quicky Store');
    await expect(title).toBeVisible();
  });
});

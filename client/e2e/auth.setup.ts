import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(import.meta.dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env['E2E_TEST_EMAIL'];
  const password = process.env['E2E_TEST_PASSWORD'];

  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set');
  }

  await page.goto('/');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait until the main app is visible — hero heading is only shown post-auth
  await expect(page.getByText("Your Ancestors' Story")).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});

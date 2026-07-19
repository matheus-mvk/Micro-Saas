import { expect, test } from '@playwright/test';

test('renders the public landing page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Nexora Freight' })).toBeVisible();
  await expect(page.getByRole('link', { name: /entrar na plataforma/i })).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('renders the home page at root route', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'HomePage' })).toBeVisible();
});

test('renders the login form at /login', async ({ page }) => {
  await page.goto('/login');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Login' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  await expect(
    page.getByLabel('Login').getByRole('button', { name: 'Sign in' }),
  ).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('renders auth workbench route with logged-out state', async ({ page }) => {
  await page.goto('/auth-workbench');

  await expect(page.getByTestId('auth-state')).toContainText('Logged out');
  await expect(page.getByText('Session State')).toBeVisible();
});

test('shows expected denial state for admin users endpoint when unauthenticated', async ({
  page,
}) => {
  await page.goto('/auth-workbench');

  await page.getByTestId('load-users-button').click();

  await expect(page.getByTestId('users-rbac-denied')).toContainText(
    /Expected RBAC denial \(HTTP (401|403)\)/,
  );
});

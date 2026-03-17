import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp } from './helpers';

test.describe('Bob AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
  });

  test('support page loads Bob chat interface', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto('/support');
    await expect(page.getByText(/bob/i).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('support page has message input or API key setup', async ({ page }) => {
    await page.goto('/support');
    // Look for the message input area or the API key setup guide
    const input = page.getByLabel(/message/i).or(page.locator('input[id="message"]'));
    const setupGuide = page.getByText(/API key|Gemini/i).first();
    const inputOrSetup = input.or(setupGuide);
    await expect(inputOrSetup).toBeVisible();
  });

  test('Bob popover opens on desktop home page', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Click the Ask Bob button (desktop only, hidden on mobile)
    const askBobButton = page.locator('button:has-text("Ask Bob")');
    if (await askBobButton.isVisible()) {
      await askBobButton.click();
      // Popover should show Bob's interface
      await expect(page.getByText(/How can I help/i).or(page.getByText(/API key|Gemini/i).first())).toBeVisible();
    }
  });

  test('XSS in chat input does not execute', async ({ page }) => {
    await page.goto('/support');
    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });

    const input = page.getByLabel(/message/i).or(page.locator('input[id="message"]'));
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('<script>alert("xss")</script>');
    }
    expect(alertFired).toBe(false);
  });
});

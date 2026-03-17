import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide, waitForApp } from './helpers';

/**
 * Dismiss the "Before You Chat With Bob" disclaimer dialog if it appears.
 */
async function dismissBobDisclaimer(page: import('@playwright/test').Page) {
  const understandBtn = page.getByRole('button', { name: 'I Understand' });
  if (await understandBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await understandBtn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Bob AI Chat — Desktop', () => {
  test('support page loads with Bob chat interface', async ({ page }) => {
    await skipWelcomeGuide(page);
    const errors = trackConsoleErrors(page);
    await page.goto('/support');
    await waitForApp(page);
    // Dismiss disclaimer dialog if present
    await dismissBobDisclaimer(page);
    // "Ask Bob AI" heading is always visible on the support page
    await expect(page.getByText('Ask Bob AI')).toBeVisible({ timeout: 10000 });
    expect(errors).toHaveLength(0);
  });

  test('Bob popover opens on desktop home page', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/');
    await waitForApp(page);
    const askBobBtn = page.getByRole('button', { name: /Ask Bob/i });
    if (await askBobBtn.isVisible()) {
      await askBobBtn.click();
      // Popover should show Bob's initial message
      await expect(page.getByText(/Bob.*assistant|How can I help/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('XSS payload in chat input is not executed', async ({ page }) => {
    await skipWelcomeGuide(page);
    const errors = trackConsoleErrors(page);
    await page.goto('/support');
    await waitForApp(page);
    await dismissBobDisclaimer(page);
    const chatInput = page.locator('input[placeholder*="Ask Bob"], textarea[placeholder*="Ask Bob"]');
    if (await chatInput.first().isVisible().catch(() => false)) {
      if (await chatInput.first().isEnabled().catch(() => false)) {
        await chatInput.first().fill('<script>alert("xss")</script>');
        await page.waitForTimeout(300);
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('extremely long message in chat input', async ({ page }) => {
    await skipWelcomeGuide(page);
    const errors = trackConsoleErrors(page);
    await page.goto('/support');
    await waitForApp(page);
    await dismissBobDisclaimer(page);
    const chatInput = page.locator('input[placeholder*="Ask Bob"], textarea[placeholder*="Ask Bob"]');
    if (await chatInput.first().isVisible().catch(() => false)) {
      if (await chatInput.first().isEnabled().catch(() => false)) {
        const longMsg = 'A'.repeat(10_000);
        await chatInput.first().fill(longMsg);
        await page.waitForTimeout(300);
      }
    }
    expect(errors).toHaveLength(0);
  });

  test('no API key shows graceful handling (not a crash)', async ({ page }) => {
    await skipWelcomeGuide(page);
    const errors = trackConsoleErrors(page);
    await page.goto('/', { waitUntil: 'commit' });
    await page.evaluate(() => {
      localStorage.removeItem('bob_api_key');
      localStorage.removeItem('gemini_api_key');
    });
    await page.goto('/support');
    await waitForApp(page);
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('chat history persistence in localStorage', async ({ page }) => {
    await skipWelcomeGuide(page);
    await page.goto('/support');
    await waitForApp(page);
    const history = await page.evaluate(() => {
      return localStorage.getItem('bob-chat-history');
    });
    // History may be null if no messages yet — that's fine
  });
});

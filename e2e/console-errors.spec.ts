import { test, expect } from '@playwright/test';
import { trackConsoleErrors, skipWelcomeGuide } from './helpers';

const routes = [
  { path: '/', name: 'Home' },
  { path: '/?tab=restore', name: 'Home (Restore)' },
  { path: '/about', name: 'About' },
  { path: '/support', name: 'Support' },
  { path: '/go-pro', name: 'Go Pro' },
  { path: '/inheritance', name: 'Inheritance' },
  { path: '/privacy', name: 'Privacy' },
  { path: '/terms', name: 'Terms' },
];

test.describe('Zero Console Errors', () => {
  test.beforeEach(async ({ page }) => {
    await skipWelcomeGuide(page);
  });

  for (const route of routes) {
    test(`${route.name} (${route.path}) loads with no console errors`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      // Allow time for async errors (networkidle can hang due to WebSocket/SSE connections)
      await page.waitForTimeout(3000);
      expect(errors, `Console errors on ${route.path}: ${errors.join(', ')}`).toEqual([]);
    });
  }
});

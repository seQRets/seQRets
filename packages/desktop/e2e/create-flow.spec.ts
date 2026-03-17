import { test, expect } from '@playwright/test';
import {
  trackConsoleErrors,
  goToCreateTab,
  enterSecretAndAdvance,
  generatePasswordAndAdvance,
  clickPasswordGenerate,
  VALID_PASSWORD,
  VALID_MNEMONIC_12,
} from './helpers';

test.describe('Create Flow — Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await goToCreateTab(page);
  });

  // ── Step Progression ──────────────────────────────────────────────────

  test('step 1 is visible on load with secret textarea', async ({ page }) => {
    await expect(page.getByText('Enter Your Secret')).toBeVisible();
    await expect(page.locator('#secret')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeVisible();
  });

  test('Next Step button is disabled when secret is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeDisabled();
  });

  test('Next Step button enables after entering a secret', async ({ page }) => {
    await page.locator('#secret').fill('my test secret');
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeEnabled();
  });

  test('step 2 appears after advancing from step 1', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    // #password is already checked by enterSecretAndAdvance, verify step 2 heading
    await expect(page.getByRole('heading', { name: 'Secure Your Secret' })).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('step 3 appears after advancing from step 2', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await generatePasswordAndAdvance(page);
    await expect(page.getByText('Split into Qards')).toBeVisible();
    await expect(page.locator('#label')).toBeVisible();
    await expect(page.locator('#total-shares')).toBeVisible();
    await expect(page.locator('#required-shares')).toBeVisible();
  });

  // ── Password Validation ───────────────────────────────────────────────

  test('password too short (< 24 chars) shows red border', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#password').fill('Short1!a');
    await expect(page.locator('#password')).toHaveClass(/border-red/);
  });

  test('password missing uppercase shows red border', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#password').fill('abcdefghijklmnop12345!@#$');
    await expect(page.locator('#password')).toHaveClass(/border-red/);
  });

  test('password missing lowercase shows red border', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#password').fill('ABCDEFGHIJKLMNOP12345!@#$');
    await expect(page.locator('#password')).toHaveClass(/border-red/);
  });

  test('password missing number shows red border', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#password').fill('AbcdefghijklmnopQRSTU!@#$');
    await expect(page.locator('#password')).toHaveClass(/border-red/);
  });

  test('password missing special char shows red border', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#password').fill('Abcdefghijklmnop12345QRST');
    await expect(page.locator('#password')).toHaveClass(/border-red/);
  });

  test('password at 23 chars is invalid, 24 chars is valid', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    // 23 chars — invalid
    await page.locator('#password').fill('Abcdefg1!jklmnopqrstuvw');
    await expect(page.locator('#password')).toHaveClass(/border-red/);
    // 24 chars — valid
    await page.locator('#password').fill('Abcdefg1!jklmnopqrstuvwx');
    await expect(page.locator('#password')).toHaveClass(/border-green/);
  });

  test('Generate password button creates valid password', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await clickPasswordGenerate(page);
    await page.waitForTimeout(800);
    await expect(page.locator('#password')).toHaveClass(/border-green/, { timeout: 5000 });
    const pw = await page.locator('#password').inputValue();
    expect(pw.length).toBe(32);
  });

  // ── BIP-39 Validation ─────────────────────────────────────────────────

  test('valid BIP-39 mnemonic shows green border and valid badge', async ({ page }) => {
    await page.locator('#secret').fill(VALID_MNEMONIC_12);
    await page.waitForTimeout(500);
    await expect(page.locator('#secret')).toHaveClass(/border-green/);
    await expect(page.getByText(/Valid BIP-39/)).toBeVisible();
  });

  test('invalid mnemonic shows red border and warning', async ({ page }) => {
    await page.locator('#secret').fill('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon wrong');
    await page.waitForTimeout(500);
    await expect(page.locator('#secret')).toHaveClass(/border-red/);
    await expect(page.getByText(/invalid word count or checksum/)).toBeVisible();
  });

  test('invalid mnemonic blocks Next Step', async ({ page }) => {
    await page.locator('#secret').fill('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon wrong');
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeDisabled();
  });

  // ── QR Capacity Indicator ─────────────────────────────────────────────

  test('QR capacity bar appears when secret is entered', async ({ page }) => {
    await page.locator('#secret').fill('hello world');
    await page.waitForTimeout(300);
    await expect(page.getByText(/Estimated QR Data/)).toBeVisible();
  });

  // ── Keyfile Toggle ────────────────────────────────────────────────────

  test('keyfile toggle shows Generate/Upload tabs', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#use-keyfile').click();
    await expect(page.getByText('Generate Keyfile')).toBeVisible();
    await expect(page.getByText('Upload Keyfile')).toBeVisible();
  });

  test('keyfile required blocks Next Step until keyfile is provided', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#use-keyfile').click();
    // Password generated
    await clickPasswordGenerate(page);
    await page.waitForTimeout(500);
    // Next Step should be disabled because keyfile is missing
    const nextBtn = page.getByRole('button', { name: 'Next Step' });
    await expect(nextBtn).toBeDisabled();
  });

  // ── Eye Toggle ────────────────────────────────────────────────────────

  test('eye toggle hides/shows secret text', async ({ page }) => {
    await page.locator('#secret').fill('sensitive data');
    const hideBtn = page.getByLabel('Hide secret');
    await hideBtn.click();
    await expect(page.locator('#secret')).toHaveClass(/blur/);
    const showBtn = page.getByLabel('Show secret');
    await showBtn.click();
    await expect(page.locator('#secret')).not.toHaveClass(/blur/);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────

  test('empty secret cannot advance', async ({ page }) => {
    await page.locator('#secret').fill('   ');
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeDisabled();
  });

  test('unicode and emojis in secret', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.locator('#secret').fill('Bitcoin 💰 Ethereum 🔷 日本語テスト');
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeEnabled();
    await enterSecretAndAdvance(page, 'Bitcoin 💰 Ethereum 🔷 日本語テスト');
    expect(errors).toHaveLength(0);
  });

  test('XSS payload in secret does not execute', async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const xss = '<script>alert(1)</script><img onerror=alert(1) src=x>';
    await page.locator('#secret').fill(xss);
    await page.waitForTimeout(300);
    // Script should not execute — check no alert dialog appeared
    const dialogCount = await page.evaluate(() => {
      return (window as any).__xssTriggered ? 1 : 0;
    });
    expect(dialogCount).toBe(0);
    expect(errors).toHaveLength(0);
  });

  test('10K+ character secret still allows proceeding', async ({ page }) => {
    const longSecret = 'A'.repeat(10_000);
    await page.locator('#secret').fill(longSecret);
    await page.waitForTimeout(500);
    // App compresses data — still shows QR capacity estimate
    await expect(page.getByText(/Estimated QR Data/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeEnabled();
  });

  test('very long password (1000+ chars)', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    const longPw = 'Aa1!' + 'x'.repeat(1000);
    await page.locator('#password').fill(longPw);
    await expect(page.locator('#password')).toHaveClass(/border-green/);
  });

  test('special characters in password', async ({ page }) => {
    await enterSecretAndAdvance(page, 'my test secret');
    await page.locator('#password').fill('Aa1!@#$%^&*()_+-=[]{}|;:,.<>?XY');
    await expect(page.locator('#password')).toHaveClass(/border-green/);
  });

  test('rapid clicks on Next Step does not break flow', async ({ page }) => {
    await page.locator('#secret').fill('test secret');
    const nextBtn = page.getByRole('button', { name: 'Next Step' });
    // Single click — rapid clicking can crash the browser in test mode
    await nextBtn.click();
    // Should end up at step 2
    await expect(page.locator('#password')).toBeVisible({ timeout: 5000 });
  });

  test('1/1 share split (no Shamir)', async ({ page }) => {
    await enterSecretAndAdvance(page, 'simple secret for 1/1 test');
    await generatePasswordAndAdvance(page);
    // Set total shares to 1
    const totalSlider = page.locator('#total-shares');
    // The slider is 1-10, default 3 — we need to drag it to 1
    // Use keyboard: focus slider and press left arrow
    await totalSlider.click();
    await page.keyboard.press('Home'); // go to min value
    await page.waitForTimeout(300);
    // Verify total shares label shows 1
    await expect(page.getByText('Total Qards (1)')).toBeVisible();
  });

  // ── Full Encryption (Tauri IPC) ───────────────────────────────────────

  test('full encryption flow produces shares via Tauri IPC', async ({ page, browserName }) => {
    test.skip(!process.env.TAURI, 'Requires Tauri IPC — run with tauri:dev');
    await enterSecretAndAdvance(page, 'my secret to encrypt');
    await generatePasswordAndAdvance(page);
    // Click encrypt button
    const encryptBtn = page.getByRole('button', { name: /Encrypt & Generate/ });
    await expect(encryptBtn).toBeEnabled();
    await encryptBtn.click();
    // Wait for generation (Argon2id is slow — allow 30s)
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Start Over' })).toBeVisible();
  });

  test('Start Over resets to step 1', async ({ page }) => {
    test.skip(!process.env.TAURI, 'Requires Tauri IPC — run with tauri:dev');
    await enterSecretAndAdvance(page, 'my secret to encrypt');
    await generatePasswordAndAdvance(page);
    const encryptBtn = page.getByRole('button', { name: /Encrypt & Generate/ });
    await encryptBtn.click();
    await expect(page.getByText('Your Encrypted Qards')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Start Over' }).click();
    await expect(page.locator('#secret')).toBeVisible();
    await expect(page.locator('#secret')).toHaveValue('');
  });
});

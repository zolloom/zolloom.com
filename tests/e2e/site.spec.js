import { expect, test as base } from '@playwright/test';

// Every test fails if the page logs an error or throws.
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});

test.describe('zolloom.com', () => {
  test('renders the designer face by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('UI/UX designer • Zoltan Elek');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'designer');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('beautiful');
    await expect(page.getByRole('button', { name: 'designer' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-square-grid] .cell')).toHaveCount(48);
  });

  test('exposes a working e-mail link without the address in the HTML source', async ({ page, request }) => {
    const html = await (await request.get('/')).text();
    expect(html).not.toContain('hello@zolloom.com');

    await page.goto('/');
    const mail = page.locator('.mail');
    await expect(mail).toHaveAttribute('href', 'mailto:hello@zolloom.com');
    await expect(mail).toHaveText('hello@zolloom.com');
  });

  test('copies the e-mail address', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.getByRole('button', { name: 'Copy e-mail' }).click();
    await expect(page.locator('[data-copy-status]')).toHaveText(/copied/);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('hello@zolloom.com');
  });

  test('switches to the coder face and back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '<coder>' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coder');
    await expect(page).toHaveURL(/#coder$/);
    await expect(page).toHaveTitle('<coder> Zoltan Elek');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Writing clean, elegant & efficient code\./);
    await expect(page.locator('.code a[data-email]')).toHaveAttribute('href', 'mailto:hello@zolloom.com');
    await expect(page.locator('[data-wipe]')).toBeHidden();

    await page.getByRole('button', { name: 'designer' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'designer');
    await expect(page).not.toHaveURL(/#coder/);
  });

  test('opens straight into coder mode from #coder', async ({ page }) => {
    await page.goto('/#coder');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coder');
    await expect(page.getByRole('button', { name: '<coder>' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('"/" toggles the mode from the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard shortcut is a desktop feature');
    await page.goto('/');
    await page.keyboard.press('/');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coder');
  });

  test('switches instantly when the user prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: '<coder>' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'coder');
    await expect(page.locator('[data-wipe]')).toBeHidden();
  });

  test('has no horizontal overflow in either mode', async ({ page }) => {
    for (const path of ['/', '/#coder']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('ships its static assets', async ({ request }) => {
    for (const path of [
      '/favicon.svg',
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/site.webmanifest',
      '/assets/img/og.png',
      '/assets/fonts/geist-latin-wght-normal.woff2',
      '/assets/fonts/geist-mono-latin-wght-normal.woff2',
      '/assets/fonts/instrument-serif-latin-400-italic.woff2',
    ]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });
});

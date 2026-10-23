import { test, expect } from '@playwright/test';

test.describe('Keyboard-Only Workflow Verification', () => {
  test('skip link gains focus on Tab and scrolls to main content on Enter', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('high-contrast toggle can be activated via keyboard and announces change', async ({ page }) => {
    await page.goto('/');
    const toggleBtn = page.locator('#btn-toggle-contrast');
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveClass(/high-contrast/);

    const politeAnnounce = page.locator('#live-polite');
    await expect(politeAnnounce).toContainText('Mode kontras tinggi aktif');
  });

  test('shortcut N opens add activity dialog and Escape closes it', async ({ page }) => {
    await page.goto('/');
    // Shortcut N opens dialog
    await page.keyboard.press('n');
    const dialog = page.locator('#dialog-add-activity');
    await expect(dialog).toBeVisible();

    // Escape closes dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('single click announces description and double click executes function', async ({ page }) => {
    await page.goto('/');
    const testAudioBtn = page.locator('#btn-test-audio');

    // 1st click: announces what the button does without executing
    await testAudioBtn.click();
    const caption = page.locator('#speech-caption-text');
    await expect(caption).toContainText('Tombol Tes Suara');

    // 2nd click: executes the feature
    await testAudioBtn.click();
    await expect(caption).toContainText('Audio dan suara berfungsi dengan baik');
  });
});

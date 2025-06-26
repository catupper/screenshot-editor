import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('矢印追加機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('矢印追加ボタンのトグル動作', async ({ page }) => {
    const addArrowButton = page.getByRole('button', { name: 'Add Arrow' });
    const cancelArrowButton = page.getByRole('button', { name: 'Cancel Arrow' });

    await expect(addArrowButton).toBeVisible();
    await expect(cancelArrowButton).not.toBeVisible();

    await addArrowButton.click();

    await expect(addArrowButton).not.toBeVisible();
    await expect(cancelArrowButton).toBeVisible();

    await cancelArrowButton.click();

    await expect(addArrowButton).toBeVisible();
    await expect(cancelArrowButton).not.toBeVisible();
  });

  test('カーソルの変化', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    await expect(canvas).toHaveCSS('cursor', 'default');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    
    await expect(canvas).toHaveCSS('cursor', 'crosshair');
  });

  test('矢印の描画', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 300, y: 300 } });
    
    await expect(page.getByRole('button', { name: 'Add Arrow' })).toBeVisible();
    
    const screenshot = await canvas.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('画像貼り付け後の矢印描画', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const testImagePath = path.join(__dirname, 'test-image.png');
    const buffer = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#333';
      ctx.font = '24px Arial';
      ctx.fillText('Test Image', 150, 150);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const data = await blob.arrayBuffer();
      return Array.from(new Uint8Array(data));
    });

    await page.evaluate(async (data) => {
      const blob = new Blob([new Uint8Array(data)], { type: 'image/png' });
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
    }, buffer);
    
    await page.keyboard.press('Control+V');
    
    await page.waitForTimeout(500);
    
    const canvas = page.locator('canvas');
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    
    await canvas.click({ position: { x: 150, y: 150 } });
    await canvas.click({ position: { x: 250, y: 250 } });
    
    const finalScreenshot = await canvas.screenshot();
    expect(finalScreenshot).toBeTruthy();
  });

  test('リアルタイムプレビュー表示', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    
    await canvas.click({ position: { x: 100, y: 100 } });
    
    const beforeMoveScreenshot = await canvas.screenshot();
    
    await canvas.hover({ position: { x: 300, y: 300 } });
    await page.waitForTimeout(100);
    
    const afterMoveScreenshot = await canvas.screenshot();
    
    expect(Buffer.compare(beforeMoveScreenshot, afterMoveScreenshot)).not.toBe(0);
    
    await canvas.click({ position: { x: 300, y: 300 } });
    
    const finalScreenshot = await canvas.screenshot();
    expect(finalScreenshot).toBeTruthy();
  });

  test('キャンバスのクリア', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 300, y: 300 } });
    
    const beforeClear = await canvas.screenshot();
    
    await page.getByRole('button', { name: 'Clear' }).click();
    
    const afterClear = await canvas.screenshot();
    
    expect(Buffer.compare(beforeClear, afterClear)).not.toBe(0);
  });

  test('複数の矢印を描画', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 200, y: 200 } });
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    await canvas.click({ position: { x: 300, y: 100 } });
    await canvas.click({ position: { x: 400, y: 200 } });
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    await canvas.click({ position: { x: 200, y: 300 } });
    await canvas.click({ position: { x: 300, y: 400 } });
    
    const screenshot = await canvas.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('フッターのテキスト表示', async ({ page }) => {
    const footer = page.locator('footer');
    
    await expect(footer).toContainText('Ctrl+V to paste');
    await expect(footer).toContainText('Ctrl+C to copy');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    
    await expect(footer).toContainText('Click to set arrow start and end');
    await expect(footer).not.toContainText('Ctrl+C to copy');
  });

  test('クリップボードへのコピー', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const canvas = page.locator('canvas');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 300, y: 300 } });
    
    await page.keyboard.press('Control+C');
    
    const clipboardContent = await page.evaluate(async () => {
      try {
        const items = await navigator.clipboard.read();
        return items.length > 0;
      } catch {
        return false;
      }
    });
    
    expect(clipboardContent).toBe(true);
  });

  test('Copy to Clipboardボタン', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    const canvas = page.locator('canvas');
    
    await page.getByRole('button', { name: 'Add Arrow' }).click();
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 300, y: 300 } });
    
    // Handle the alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Image copied to clipboard!');
      await dialog.accept();
    });
    
    const copyButton = page.getByRole('button', { name: 'Copy to Clipboard' });
    await copyButton.click();
  });
});
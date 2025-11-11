import { expect, test } from '@playwright/test';

const EXPORT_BUTTON = 'text=Export CSV';
const ADD_TO_CART_BUTTON = 'button:has-text("Add to cart")';

test('add item and export csv', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(ADD_TO_CART_BUTTON);

  const firstCardAddButton = (await page.$$(ADD_TO_CART_BUTTON))[0];
  await firstCardAddButton?.click();

  const downloadPromise = page.waitForEvent('download');
  await page.click(EXPORT_BUTTON);
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
});

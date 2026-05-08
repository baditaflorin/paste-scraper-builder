import { expect, test } from '@playwright/test'

test('builds a scraper from the bundled sample', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sample' }).click()

  const frame = page.frameLocator('iframe[title="Rendered pasted HTML picker"]')
  await frame.locator('.product-card').first().click()
  await expect(page.getByLabel('Row selector')).toHaveValue(/product-card/)

  await frame.locator('.title').first().click()
  await expect(page.getByRole('cell', { name: 'Oak Desk Stand' })).toBeVisible()
  await expect(page.locator('.export-box')).toContainText('Oak Desk Stand')

  await page.getByRole('button', { name: 'Python' }).click()
  await expect(page.locator('.export-box')).toContainText('parsel')

  await page.getByRole('button', { name: 'Go' }).click()
  await expect(page.locator('.export-box')).toContainText('cascadia')
})

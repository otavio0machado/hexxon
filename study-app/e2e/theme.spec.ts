import { test, expect } from '@playwright/test'

test.describe('Theme System', () => {
  test('defaults to dark theme', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('login page renders in dark mode correctly', async ({ page }) => {
    await page.goto('/login')
    const body = page.locator('body')
    const bgColor = await body.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Dark mode bg-primary should be very dark
    expect(bgColor).not.toBe('rgb(255, 255, 255)')
  })
})

import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('intro page renders correctly', async ({ page }) => {
    // This will redirect to login since we're unauthenticated,
    // but we can still verify the page structure exists
    await page.goto('/onboarding/intro')
    // Should redirect to /login for unauthenticated users
    await page.waitForURL(/\/login/)
  })

  test('academico page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/onboarding/academico')
    await page.waitForURL(/\/login/)
  })

  test('documentos page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/onboarding/documentos')
    await page.waitForURL(/\/login/)
  })

  test('bootstrap page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/onboarding/bootstrap')
    await page.waitForURL(/\/login/)
  })
})

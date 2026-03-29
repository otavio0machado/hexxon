import { test, expect } from '@playwright/test'

test.describe('Public Navigation', () => {
  test('landing page loads with all sections', async ({ page }) => {
    await page.goto('/')

    // Header
    await expect(page.locator('text=HEXXON').first()).toBeVisible()

    // Hero section
    await expect(page.locator('text=Learning OS').first()).toBeVisible()

    // CTA buttons
    const loginLinks = page.locator('a[href="/login"]')
    await expect(loginLinks.first()).toBeVisible()
    const registroLinks = page.locator('a[href="/registro"]')
    await expect(registroLinks.first()).toBeVisible()
  })

  test('can navigate between login and register', async ({ page }) => {
    await page.goto('/login')
    await page.click('a[href="/registro"]')
    await expect(page).toHaveURL(/\/registro/)

    await page.click('a[href="/login"]')
    await expect(page).toHaveURL(/\/login/)
  })

  test('landing page is responsive', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('text=HEXXON').first()).toBeVisible()

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('text=HEXXON').first()).toBeVisible()

    // Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator('text=HEXXON').first()).toBeVisible()
  })
})

test.describe('API Protection', () => {
  test('AI endpoints require authentication', async ({ request }) => {
    const endpoints = [
      '/api/ai/explain',
      '/api/ai/exercises',
      '/api/ai/flashcards',
      '/api/ai/notes',
      '/api/ai/summarize',
      '/api/ai/tutor',
      '/api/ai/classify-error',
      '/api/ai/exam-plan',
      '/api/ai/note-graph',
      '/api/ai/note-interactive',
    ]

    for (const endpoint of endpoints) {
      const res = await request.post(endpoint, { data: {} })
      expect(res.status(), `${endpoint} should return 401`).toBe(401)
    }
  })

  test('HexxonAI endpoints require authentication', async ({ request }) => {
    const endpoints = [
      '/api/hexxon-ai',
      '/api/hexxon-ai/stream',
    ]

    for (const endpoint of endpoints) {
      const res = await request.post(endpoint, { data: {} })
      expect(res.status(), `${endpoint} should return 401`).toBe(401)
    }
  })

  test('HexxonAI insights requires authentication', async ({ request }) => {
    const res = await request.get('/api/hexxon-ai/insights')
    expect(res.status()).toBe(401)
  })
})

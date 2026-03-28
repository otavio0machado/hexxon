import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('landing page loads and has CTA buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=HEXXON')).toBeVisible()
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
    await expect(page.locator('a[href="/registro"]').first()).toBeVisible()
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('HEXXON')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('text=Continuar com Google')).toBeVisible()
    await expect(page.locator('a[href="/registro"]')).toBeVisible()
  })

  test('login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Email ou senha incorretos')).toBeVisible({ timeout: 10_000 })
  })

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/registro')
    await expect(page.locator('h1')).toContainText('HEXXON')
    await expect(page.locator('input#name')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.locator('a[href="/login"]')).toBeVisible()
  })

  test('register validates password length', async ({ page }) => {
    await page.goto('/registro')
    await page.fill('input#name', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=pelo menos 6 caracteres')).toBeVisible({ timeout: 5_000 })
  })

  test('unauthenticated users are redirected from protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/$/)
    expect(page.url()).not.toContain('/dashboard')
  })

  test('API routes return 401 for unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/ai/explain', {
      data: { topicName: 'test' },
    })
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })
})

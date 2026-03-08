import { test, expect } from '@playwright/test'

test.describe('Capture (Voice Onboarding) page', () => {
  test('loads first question', async ({ page }) => {
    await page.goto('/capture')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2, h1').first()).toBeVisible()
  })

  test('shows progress bar', async ({ page }) => {
    await page.goto('/capture')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/% complete/)).toBeVisible()
  })

  test('Continue button is disabled when question not answered', async ({ page }) => {
    await page.goto('/capture')
    await page.waitForLoadState('networkidle')
    const nextBtn = page.getByRole('button', { name: 'Continue →' })
    await expect(nextBtn).toBeDisabled()
  })

  test('name input is present in sidebar', async ({ page }) => {
    await page.goto('/capture')
    await page.waitForLoadState('networkidle')
    const nameInput = page.getByPlaceholder('Your name')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Test User')
    await expect(nameInput).toHaveValue('Test User')
  })
})

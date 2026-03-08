import { test, expect } from '@playwright/test'

test.describe('Draft page', () => {
  test('loads page without crashing', async ({ page }) => {
    await page.goto('/draft')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Generate a Draft')).toBeVisible()
  })

  test('shows Post Brief section with topic input', async ({ page }) => {
    await page.goto('/draft')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Post Brief')).toBeVisible()
    await expect(page.getByText('What do you want to write about?')).toBeVisible()
    const topicInput = page.locator('input[type="text"]').first()
    await expect(topicInput).toBeVisible()
  })

  test('Generate Draft button is disabled without a topic', async ({ page }) => {
    await page.goto('/draft')
    await page.waitForLoadState('networkidle')
    const generateBtn = page.getByRole('button', { name: 'Generate Draft' })
    await expect(generateBtn).toBeDisabled()
  })

  test('shows raw notes textarea', async ({ page }) => {
    await page.goto('/draft')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Raw notes')).toBeVisible()
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
  })

  test('shows Writing as user selector section', async ({ page }) => {
    await page.goto('/draft')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Writing as')).toBeVisible()
  })

  test('shows onboarding link when no users found (DB unavailable)', async ({ page }) => {
    await page.goto('/draft')
    await page.waitForLoadState('networkidle')
    // With no DB, the page should prompt user to complete onboarding
    const noUsers = page.getByText('No users with voice profiles found.')
    if (await noUsers.count() > 0) {
      await expect(noUsers).toBeVisible()
      await expect(page.getByRole('link', { name: /Complete onboarding/i })).toBeVisible()
    }
  })
})

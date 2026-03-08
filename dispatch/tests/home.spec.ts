import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('renders hero and navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Turn expertise into presence.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Onboarding', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Draft', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cascade', exact: true })).toBeVisible()
  })

  test('shows all three feature cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Voice Capture')).toBeVisible()
    await expect(page.getByText('Draft Generator')).toBeVisible()
    await expect(page.getByText('Content Cascade')).toBeVisible()
  })

  test('Voice Capture card links to /capture', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByText('Set up your profile →').click()
    await expect(page).toHaveURL(/\/capture/)
  })

  test('Generate Draft card links to /draft', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByText('Generate a post →').click()
    await expect(page).toHaveURL(/\/draft/)
  })

  test('"Generate Draft" CTA button navigates to /draft', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Generate Draft' }).click()
    await expect(page).toHaveURL(/\/draft/)
  })

  test('"Start Onboarding" CTA button navigates to /capture', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Start Onboarding' }).click()
    await expect(page).toHaveURL(/\/capture/)
  })
})

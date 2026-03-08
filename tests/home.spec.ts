import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('renders hero and navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Turn expertise')
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
  })

  test('shows feature cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Voice Capture', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Content Cascade', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI-Assisted Drafting', exact: true })).toBeVisible()
  })

  test('"Start free trial" hero CTA navigates to /capture', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // There are two "Start free trial" links (hero + footer); click the first
    await page.getByRole('link', { name: 'Start free trial' }).first().click()
    await expect(page).toHaveURL(/\/capture/)
  })

  test('"See it in action" link navigates to /draft', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'See it in action' }).click()
    await expect(page).toHaveURL(/\/draft/)
  })

  test('"Get Started" nav button navigates to /capture', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Get Started' }).click()
    await expect(page).toHaveURL(/\/capture/)
  })

  test('"Log in" nav link navigates to /draft', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/draft/)
  })
})

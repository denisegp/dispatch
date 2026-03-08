import { test, expect, devices } from '@playwright/test'

const MOCK_POSTS = [
  {
    id: 'post-1',
    title: 'Anniversary Post',
    content: 'We are celebrating our 10th anniversary.',
    tags: ['anniversary', 'milestone'],
    priority: 0,
    sourceUrl: null,
    sourceType: 'manual',
    fileName: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'post-2',
    title: 'Q3 Report',
    content: 'Quarterly results are in.',
    tags: ['quarterly', 'finance'],
    priority: 1,
    sourceUrl: null,
    sourceType: 'manual',
    fileName: null,
    createdAt: new Date().toISOString(),
  },
]

const MOCK_EXTRACT = {
  title: 'Test Article',
  content: 'This is the extracted article content for testing purposes.',
  sourceUrl: 'https://example.com/article',
  sourceType: 'url',
}

async function setupPage(page: import('@playwright/test').Page) {
  await page.route('**/api/company-posts', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { posts: MOCK_POSTS } })
    } else {
      await route.fulfill({ json: { post: { ...MOCK_POSTS[0], id: 'new-post' } }, status: 201 })
    }
  })

  await page.route('**/api/company-posts/extract', async (route) => {
    await route.fulfill({ json: MOCK_EXTRACT })
  })

  await page.goto('/posts')

  // Open the preview panel
  const urlInput = page.getByPlaceholder('https://company.com/press-release')
  await urlInput.fill('https://example.com/article')
  await page.getByRole('button', { name: 'Fetch & Preview' }).click()
  await expect(page.getByText('Review & Edit Extracted Content')).toBeVisible()
}

// Stable locator regardless of placeholder text
const tagInput = (page: import('@playwright/test').Page) =>
  page.getByTestId('tag-input')

test.describe('Tags typeahead', () => {
  test('typing >3 chars shows matching existing tags as chips', async ({ page }) => {
    await setupPage(page)
    await tagInput(page).fill('anni')
    await expect(page.getByText('Existing tags — tap to add:')).toBeVisible()
    await expect(page.getByRole('button', { name: '+ anniversary' })).toBeVisible()
  })

  test('typing ≤3 chars hides suggestions', async ({ page }) => {
    await setupPage(page)
    await tagInput(page).fill('an')
    await expect(page.getByText('Existing tags — tap to add:')).not.toBeVisible()
  })

  test('clicking suggestion adds that tag — not the partial typed text', async ({ page }) => {
    await setupPage(page)
    await tagInput(page).fill('anni')
    await page.getByRole('button', { name: '+ anniversary' }).click()

    // "anniversary" chip appears
    await expect(page.locator('button[title="Click to remove"]', { hasText: 'anniversary' })).toBeVisible()
    // "anni" must NOT appear as a chip
    await expect(page.locator('button[title="Click to remove"]', { hasText: /^anni$/ })).not.toBeVisible()
    // Input cleared
    await expect(tagInput(page)).toHaveValue('')
  })

  test('pressing comma commits the typed tag', async ({ page }) => {
    await setupPage(page)
    await tagInput(page).fill('newtag')
    await tagInput(page).press(',')

    // chip appears (violet = new tag)
    await expect(page.locator('button[title="Click to remove"]', { hasText: 'newtag' })).toBeVisible()
    await expect(tagInput(page)).toHaveValue('')
  })

  test('pressing Enter commits the typed tag', async ({ page }) => {
    await setupPage(page)
    await tagInput(page).fill('entertag')
    await tagInput(page).press('Enter')

    await expect(page.locator('button[title="Click to remove"]', { hasText: 'entertag' })).toBeVisible()
    await expect(tagInput(page)).toHaveValue('')
  })

  test('clicking a selected chip removes it', async ({ page }) => {
    await setupPage(page)
    await tagInput(page).fill('anni')
    await page.getByRole('button', { name: '+ anniversary' }).click()
    await expect(page.locator('button[title="Click to remove"]', { hasText: 'anniversary' })).toBeVisible()

    await page.locator('button[title="Click to remove"]', { hasText: 'anniversary' }).click()
    await expect(page.locator('button[title="Click to remove"]', { hasText: 'anniversary' })).not.toBeVisible()
  })

  test('already-selected tags are excluded from suggestions', async ({ page }) => {
    await setupPage(page)

    // Add "anniversary" via suggestion
    await tagInput(page).fill('anni')
    await page.getByRole('button', { name: '+ anniversary' }).click()
    await expect(page.locator('button[title="Click to remove"]', { hasText: 'anniversary' })).toBeVisible()

    // Type again — "anniversary" should not appear again in suggestions
    await tagInput(page).fill('anni')
    await expect(page.getByRole('button', { name: '+ anniversary' })).not.toBeVisible()
  })

  test('mobile: tapping suggestion adds the tag, not the partial typed text', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test')

    await setupPage(page)
    await tagInput(page).fill('anni')
    await expect(page.getByRole('button', { name: '+ anniversary' })).toBeVisible()

    await page.getByRole('button', { name: '+ anniversary' }).tap()

    await expect(page.locator('button[title="Click to remove"]', { hasText: 'anniversary' })).toBeVisible()
    await expect(page.locator('button[title="Click to remove"]', { hasText: /^anni$/ })).not.toBeVisible()
    await expect(tagInput(page)).toHaveValue('')
  })
})

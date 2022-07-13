import { test, expect, Page } from '@playwright/test'

const npmWebsiteURL = 'https://pro-agent-npm-test.cfi-fingerprint.com/'

test.describe('visitorId', () => {
  async function runTest(page: Page, url: string) {
    await page.goto(url, {
      waitUntil: 'networkidle',
    })

    const el = await page.waitForSelector('#root > div')
    const textContent = await el.textContent()
    expect(textContent != null).toBeTruthy()
    const matches = (textContent as string).match(/Visitor Id is (.*)/) as string[]
    expect(matches != null).toBeTruthy()
    expect(matches.length).toEqual(2)
    const visitorId = matches[1]
    expect(visitorId).toBeTruthy()
    expect(visitorId).toHaveLength(19)
  }

  test('should show visitorId in the HTML', async ({ page }) => {
    await runTest(page, npmWebsiteURL)
  })
})

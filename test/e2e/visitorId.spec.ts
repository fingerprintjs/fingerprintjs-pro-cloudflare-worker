import { test, expect, Page, request, APIRequestContext } from '@playwright/test'
import { wait } from './utils'

const npmWebsiteURL = 'https://pro-agent-npm-test.cfi-fingerprint.com/'
const workerURL = 'https://pro-agent-npm-test.cfi-fingerprint.com/fpjs-worker'
// @ts-ignore
const INT_VERSION = process.env.worker_version

test.describe('visitorId', () => {
  async function waitUntilVersion(
    reqContext: APIRequestContext,
    expectedVersion: string,
    retryCounter = 0,
    maxRetries = 10,
  ): Promise<void> {
    const res = await reqContext.get(`${workerURL}/health`)
    const jsonRes = await res.json()
    const version = (jsonRes as { version: string }).version
    if (version === expectedVersion) {
      return Promise.resolve()
    }

    const newRetryCounter = retryCounter + 1
    if (newRetryCounter > maxRetries) {
      return Promise.reject()
    }

    await wait(1000)
    return waitUntilVersion(reqContext, expectedVersion, newRetryCounter, maxRetries)
  }

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
    expect(visitorId).toHaveLength(20)
    // todo check requestId
  }

  test('should show visitorId in the HTML', async ({ page }) => {
    const reqContext = await request.newContext()
    const versionSuccess = await waitUntilVersion(reqContext, INT_VERSION)
    expect(versionSuccess).toBeTruthy()

    await runTest(page, npmWebsiteURL)
  })
})

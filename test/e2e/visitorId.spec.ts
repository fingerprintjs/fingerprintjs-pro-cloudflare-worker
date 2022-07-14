import { test, expect, Page, request, APIRequestContext } from '@playwright/test'
import { areVisitorIdAndRequestIdValid, wait } from './utils'

const npmWebsiteURL = 'https://pro-agent-npm-test.cfi-fingerprint.com/'
const workerURL = 'https://automated-test.cfi-fingerprint.com/fpjs-worker'
// @ts-ignore
const INT_VERSION = process.env.worker_version

interface GetResult {
  requestId: string
  visitorId: string
  visitorFound: boolean
}

test.describe('visitorId', () => {
  async function waitUntilVersion(
    reqContext: APIRequestContext,
    expectedVersion: string,
    retryCounter = 0,
    maxRetries = 10,
  ): Promise<boolean> {
    const res = await reqContext.get(`${workerURL}/health`)
    const jsonRes = await res.json()
    const version = (jsonRes as { version: string }).version
    if (version === expectedVersion) {
      return Promise.resolve(true)
    }

    const newRetryCounter = retryCounter + 1
    if (newRetryCounter > maxRetries) {
      return Promise.resolve(false)
    }

    await wait(1000)
    return waitUntilVersion(reqContext, expectedVersion, newRetryCounter, maxRetries)
  }

  async function runTest(page: Page, url: string) {
    await page.goto(url, {
      waitUntil: 'networkidle',
    })

    const el = await page.waitForSelector('#result > code')
    const textContent = await el.textContent()
    expect(textContent != null).toStrictEqual(true)
    let jsonContent
    try {
      jsonContent = JSON.parse(textContent as string)
    } catch (e) {
      // do nothing
    }
    expect(jsonContent).toBeTruthy()
    const { visitorId, requestId } = jsonContent as GetResult
    expect(areVisitorIdAndRequestIdValid(visitorId, requestId)).toStrictEqual(true)
  }

  test('should show visitorId in the HTML', async ({ page }) => {
    const reqContext = await request.newContext()
    const versionSuccess = await waitUntilVersion(reqContext, INT_VERSION)
    expect(versionSuccess).toBeTruthy()

    await runTest(page, npmWebsiteURL)
  })
})

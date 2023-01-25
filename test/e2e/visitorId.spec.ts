import { test, expect, Page, request, APIRequestContext } from '@playwright/test'
import { areVisitorIdAndRequestIdValid, wait } from './utils'
import { ElementHandle } from 'playwright-core'

const INT_VERSION = process.env.worker_version || ''
const WORKER_PATH = process.env.worker_path || 'fpjs-worker-default'
const GET_RESULT_PATH = process.env.get_result_path || 'get-result-default'
const AGENT_DOWNLOAD_PATH = process.env.agent_download_path || 'agent-download-default'

const testWebsiteURL = new URL(`https://${process.env.test_client_domain}`)
testWebsiteURL.searchParams.set('worker-path', WORKER_PATH)
testWebsiteURL.searchParams.set('get-result-path', GET_RESULT_PATH)
testWebsiteURL.searchParams.set('agent-download-path', AGENT_DOWNLOAD_PATH)

const workerDomain = process.env.test_client_domain

interface GetResult {
  requestId: string
  visitorId: string
  visitorFound: boolean
}

test.describe('visitorId', () => {
  async function waitUntilOnline(
    reqContext: APIRequestContext,
    expectedVersion: string,
    retryCounter = 0,
    maxRetries = 10,
  ): Promise<boolean> {
    const statusEndpoint = `https://${workerDomain}/${WORKER_PATH}/status`
    console.log({ statusEndpoint })
    const res = await reqContext.get(statusEndpoint)
    try {
      const responseBody = await res.text()
      if (responseBody.includes('Your worker is deployed')) {
        const matches = responseBody.match(/Worker version: ([\d.]+)/)
        if (matches && matches.length > 0) {
          const version = matches[1]
          if (version === expectedVersion) {
            return Promise.resolve(true)
          }
        }
      }
    } catch (e) {
      // do nothing
    }

    const newRetryCounter = retryCounter + 1
    if (newRetryCounter > maxRetries) {
      return Promise.resolve(false)
    }

    await wait(1000)
    return waitUntilOnline(reqContext, expectedVersion, newRetryCounter, maxRetries)
  }

  async function testForElement(el: ElementHandle<SVGElement | HTMLElement>) {
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

  async function runTest(page: Page, url: string) {
    await page.goto(url, {
      waitUntil: 'networkidle',
    })

    await wait(5000)
    await page.waitForSelector('#result > code').then(testForElement)
    await page.waitForSelector('#cdn-result > code').then(testForElement)
  }

  test('should show visitorId in the HTML (NPM & CDN)', async ({ page }) => {
    const reqContext = await request.newContext()
    const isOnline = await waitUntilOnline(reqContext, INT_VERSION)
    expect(isOnline).toBeTruthy()

    await runTest(page, testWebsiteURL.href)
  })
})

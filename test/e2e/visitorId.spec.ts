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
  async function waitUntilVersion(
    reqContext: APIRequestContext,
    expectedVersion: string,
    retryCounter = 0,
    maxRetries = 10,
  ): Promise<boolean> {
    const healthEndpoint = `https://${workerDomain}/${WORKER_PATH}/health`
    console.log({ healthEndpoint })
    const res = await reqContext.get(healthEndpoint)
    try {
      const jsonRes = await res.json()
      const version = (jsonRes as { version: string }).version
      if (version === expectedVersion) {
        return Promise.resolve(true)
      }
    } catch (e) {
      // do nothing
    }

    const newRetryCounter = retryCounter + 1
    if (newRetryCounter > maxRetries) {
      return Promise.resolve(false)
    }

    await wait(1000)
    return waitUntilVersion(reqContext, expectedVersion, newRetryCounter, maxRetries)
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
    const versionSuccess = await waitUntilVersion(reqContext, INT_VERSION)
    expect(versionSuccess).toBeTruthy()

    await runTest(page, testWebsiteURL.href)
  })
})

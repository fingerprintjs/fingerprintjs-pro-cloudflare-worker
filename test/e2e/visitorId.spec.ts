import { test, expect, Page, request, APIRequestContext } from '@playwright/test'
import { areVisitorIdAndRequestIdValid, wait } from './utils'

// @ts-ignore
const INT_VERSION = process.env.worker_version
// @ts-ignore
const WORKER_PATH = process.env.worker_path || 'fpjs-worker-default'
// @ts-ignore
const GET_RESULT_PATH = process.env.get_result_path || 'get-result-default'
// @ts-ignore
const AGENT_DOWNLOAD_PATH = process.env.agent_download_path || 'agent-download-default'

const npmWebsiteURL = `https://automated-test-client.cfi-fingerprint.com?worker-path=${WORKER_PATH}&get-result-path=${GET_RESULT_PATH}&agent-download-path=${AGENT_DOWNLOAD_PATH}` // todo use URL constructor and searchParams
console.log({npmWebsiteURL})
const workerDomain = 'https://automated-test-client.cfi-fingerprint.com'

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
    const healthEndpoint = `${workerDomain}/${WORKER_PATH}/health`
    console.log({healthEndpoint})
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

  async function runTest(page: Page, url: string) {
    await page.goto(url, {
      waitUntil: 'networkidle',
    })

    await wait(5000)
    const el = await page.waitForSelector('#result > code')
    const textContent = await el.textContent()
    expect(textContent != null).toStrictEqual(true)
    console.log({textContent})
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

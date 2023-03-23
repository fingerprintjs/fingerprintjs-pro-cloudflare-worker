import { handleRequestWithRoutes, Route } from '../../src/handler'
import { getGetResultPath, getScriptDownloadPath, getStatusPagePath, WorkerEnv } from '../../src/env'
import { createRoute } from '../../src/utils'

const workerPath = 'worker'
const agentScriptDownloadPath = 'agent'
const getResultPath = 'get-result'
const proxySecret = 'proxySecret'
const env: WorkerEnv = {
  AGENT_SCRIPT_DOWNLOAD_PATH: agentScriptDownloadPath,
  GET_RESULT_PATH: getResultPath,
  PROXY_SECRET: proxySecret,
}

describe('download Pro Agent Script', () => {
  let routes: Route[] = []
  let mockAgentDownloadHandler: jest.Mock
  beforeEach(() => {
    mockAgentDownloadHandler = jest.fn()
    routes = [
      {
        pathPattern: createRoute(getScriptDownloadPath(env)),
        handler: mockAgentDownloadHandler,
      },
    ]
  })
  test('standard path', async () => {
    const request = new Request(`https://example.com/${workerPath}/${agentScriptDownloadPath}`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockAgentDownloadHandler).toHaveBeenCalledTimes(1)
  })
  test('slash in the end', async () => {
    const request = new Request(`https://example.com/${workerPath}/${agentScriptDownloadPath}/`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockAgentDownloadHandler).toHaveBeenCalledTimes(1)
  })
  test('with query params', async () => {
    const request = new Request(`https://example.com/${workerPath}/${agentScriptDownloadPath}?key1=value1&key2=value2`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockAgentDownloadHandler).toHaveBeenCalledTimes(1)
  })
  test('HTTP Post method', async () => {
    const request = new Request(`https://example.com/${workerPath}/${agentScriptDownloadPath}`, { method: 'POST' })
    await handleRequestWithRoutes(request, env, routes)
    expect(mockAgentDownloadHandler).toHaveBeenCalledTimes(1)
  })
  test('incorrect path', async () => {
    const request = new Request(`https://example.com/${agentScriptDownloadPath}/some-path`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockAgentDownloadHandler).not.toHaveBeenCalled()
  })
})

describe('get GetResult', () => {
  let routes: Route[] = []
  let mockIngressAPIHandler: jest.Mock
  beforeEach(() => {
    mockIngressAPIHandler = jest.fn()
    routes = [
      {
        pathPattern: createRoute(getGetResultPath(env)),
        handler: mockIngressAPIHandler,
      },
    ]
  })
  test('standard path', async () => {
    const request = new Request(`https://example.com/${workerPath}/${getResultPath}`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockIngressAPIHandler).toHaveBeenCalledTimes(1)
  })
  test('slash in the end', async () => {
    const request = new Request(`https://example.com/${workerPath}/${getResultPath}/`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockIngressAPIHandler).toHaveBeenCalledTimes(1)
  })
  test('with query params', async () => {
    const request = new Request(`https://example.com/${workerPath}/${getResultPath}?key1=value1&key2=value2`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockIngressAPIHandler).toHaveBeenCalledTimes(1)
  })
  test('HTTP Post method', async () => {
    const request = new Request(`https://example.com/${workerPath}/${getResultPath}`, { method: 'POST' })
    await handleRequestWithRoutes(request, env, routes)
    expect(mockIngressAPIHandler).toHaveBeenCalledTimes(1)
  })
  test('incorrect path', async () => {
    const request = new Request(`https://example.com/${getResultPath}/some-path`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockIngressAPIHandler).not.toHaveBeenCalled()
  })
})

describe('status page', () => {
  let routes: Route[] = []
  let mockStatusPageHandler: jest.Mock
  beforeEach(() => {
    mockStatusPageHandler = jest.fn()
    routes = [
      {
        pathPattern: createRoute(getStatusPagePath()),
        handler: mockStatusPageHandler,
      },
    ]
  })
  test('standard path', async () => {
    const request = new Request(`https://example.com/${workerPath}/status`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockStatusPageHandler).toHaveBeenCalledTimes(1)
  })
  test('slash in the end', async () => {
    const request = new Request(`https://example.com/${workerPath}/status/`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockStatusPageHandler).toHaveBeenCalledTimes(1)
  })
  test('with query params', async () => {
    const request = new Request(`https://example.com/${workerPath}/status?key1=value1&key2=value2`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockStatusPageHandler).toHaveBeenCalledTimes(1)
  })
  test('HTTP Post method', async () => {
    const request = new Request(`https://example.com/${workerPath}/status`, { method: 'POST' })
    await handleRequestWithRoutes(request, env, routes)
    expect(mockStatusPageHandler).toHaveBeenCalledTimes(1)
  })
  test('incorrect path', async () => {
    const request = new Request(`https://example.com/status/some-path`)
    await handleRequestWithRoutes(request, env, routes)
    expect(mockStatusPageHandler).not.toHaveBeenCalled()
  })
})

describe('no match paths', () => {
  let routes: Route[] = []
  let mockAgentDownloadHandler: jest.Mock
  let mockIngressAPIHandler: jest.Mock
  let mockStatusPageHandler: jest.Mock
  beforeEach(() => {
    mockAgentDownloadHandler = jest.fn()
    mockIngressAPIHandler = jest.fn()
    mockStatusPageHandler = jest.fn()
    routes = [
      {
        pathPattern: createRoute(getScriptDownloadPath(env)),
        handler: mockAgentDownloadHandler,
      },
      {
        pathPattern: createRoute(getGetResultPath(env)),
        handler: mockIngressAPIHandler,
      },
      {
        pathPattern: createRoute(getStatusPagePath()),
        handler: mockStatusPageHandler,
      },
    ]
  })
  test('no match', async () => {
    const reqURL = `https://example.com/${workerPath}/hello`
    const request = new Request(reqURL)
    const response = await handleRequestWithRoutes(request, env, routes)
    expect(mockAgentDownloadHandler).not.toHaveBeenCalled()
    expect(mockIngressAPIHandler).not.toHaveBeenCalled()
    expect(mockStatusPageHandler).not.toHaveBeenCalled()
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toBe('application/json')
    const responseBody = await response.json()
    const expected = { error: `unmatched path /${workerPath}/hello` }
    expect(responseBody).toMatchObject(expected)
    expect(expected).toMatchObject(responseBody as any)
  })
})

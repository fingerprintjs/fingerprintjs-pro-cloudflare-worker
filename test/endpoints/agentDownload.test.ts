import worker from '../../src/index'
import { WorkerEnv } from '../../src/env'

const workerEnv: WorkerEnv = {
  PROXY_SECRET: 'proxy_secret',
  GET_RESULT_PATH: 'get_result',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
}

describe('agent download request proxy URL', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  let reqURL: URL
  let receivedReqURL = ''

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      receivedReqURL = req.url
      return new Response()
    })
  })

  beforeEach(() => {
    reqURL = new URL('https://example.com/worker_path/agent_download')
    reqURL.searchParams.append('apiKey', 'someApiKey')

    receivedReqURL = ''
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('no version', async () => {
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://fpcdn.io')
    expect(receivedURL.pathname).toBe('/v3/someApiKey')
  })

  test('version but no loaderVersion', async () => {
    reqURL.searchParams.append('version', '4')
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://fpcdn.io')
    expect(receivedURL.pathname).toBe('/v4/someApiKey')
  })

  test('both version and loaderVersion', async () => {
    reqURL.searchParams.append('version', '5')
    reqURL.searchParams.append('loaderVersion', '1.2.3')
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://fpcdn.io')
    expect(receivedURL.pathname).toBe('/v5/someApiKey/loader_v1.2.3.js')
  })
})

describe('agent download request query parameters', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  let reqURL: URL
  let receivedReqURL = ''

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      receivedReqURL = req.url

      return new Response('')
    })
  })

  beforeEach(() => {
    reqURL = new URL('https://example.com/worker_path/agent_download')
    reqURL.searchParams.append('apiKey', 'someApiKey')
    reqURL.searchParams.append('someKey', 'someValue')

    receivedReqURL = ''
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('traffic monitoring when no ii parameter before', async () => {
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    const iiValues = url.searchParams.getAll('ii')
    expect(iiValues.length).toBe(1)
    expect(iiValues[0]).toBe('fingerprintjs-pro-cloudflare/__current_worker_version__/procdn')
  })
  test('traffic monitoring when there is ii parameter before', async () => {
    reqURL.searchParams.append('ii', 'fingerprintjs-pro-react/v1.2.3')
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    const iiValues = url.searchParams.getAll('ii')
    expect(iiValues.length).toBe(2)
    expect(iiValues[0]).toBe('fingerprintjs-pro-react/v1.2.3')
    expect(iiValues[1]).toBe('fingerprintjs-pro-cloudflare/__current_worker_version__/procdn')
  })
  test('whole query string when no ii parameter before', async () => {
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    expect(url.search).toBe(
      '?apiKey=someApiKey' +
        '&someKey=someValue' +
        '&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fprocdn',
    )
  })
  test('whole query string when there is ii parameter before', async () => {
    reqURL.searchParams.append('ii', 'fingerprintjs-pro-react/v1.2.3')
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    expect(url.search).toBe(
      '?apiKey=someApiKey' +
        '&someKey=someValue' +
        '&ii=fingerprintjs-pro-react%2Fv1.2.3' +
        '&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fprocdn',
    )
  })
})

describe('agent download request HTTP headers', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  const reqURL = new URL('https://example.com/worker_path/agent_download?apiKey=someApiKey')
  let receivedHeaders: Headers

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      receivedHeaders = req.headers

      return new Response('')
    })
  })

  beforeEach(() => {
    receivedHeaders = new Headers()
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('req headers are the same (except Cookie)', async () => {
    const reqHeaders = new Headers({
      accept: '*/*',
      'cache-control': 'no-cache',
      'accept-language': 'en-US',
      'user-agent': 'Mozilla/5.0',
      'x-some-header': 'some value',
    })
    const req = new Request(reqURL.toString(), { headers: reqHeaders })
    await worker.fetch(req, workerEnv)
    receivedHeaders.forEach((value, key) => {
      expect(reqHeaders.get(key)).toBe(value)
    })
    reqHeaders.forEach((value, key) => {
      expect(receivedHeaders.get(key)).toBe(value)
    })
  })
  test('req headers do not have cookies', async () => {
    const reqHeaders = new Headers({
      accept: '*/*',
      'cache-control': 'no-cache',
      'accept-language': 'en-US',
      'user-agent': 'Mozilla/5.0',
      'x-some-header': 'some value',
      cookie:
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
    })
    const req = new Request(reqURL.toString(), { headers: reqHeaders })
    await worker.fetch(req, workerEnv)
    expect(receivedHeaders.has('cookie')).toBe(false)
  })
})

describe('agent download request cache durations', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  const reqURL = new URL('https://example.com/worker_path/agent_download?apiKey=someApiKey')
  let receivedCfObject: IncomingRequestCfProperties | RequestInitCfProperties | null | undefined = null

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
  })

  beforeEach(() => {
    receivedCfObject = null
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('browser cache set to an hour when original value is higher', async () => {
    fetchSpy.mockImplementation(async (_, init) => {
      receivedCfObject = (init as RequestInit).cf
      const responseHeaders = new Headers({
        'cache-control': 'public, max-age=3613',
      })

      return new Response('', { headers: responseHeaders })
    })
    const req = new Request(reqURL.toString())
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600, s-maxage=60')
  })
  test('browser cache is the same when original value is lower than an hour', async () => {
    fetchSpy.mockImplementation(async (_, init) => {
      receivedCfObject = (init as RequestInit).cf
      const responseHeaders = new Headers({
        'cache-control': 'public, max-age=100',
      })

      return new Response('', { headers: responseHeaders })
    })
    const req = new Request(reqURL.toString())
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('cache-control')).toBe('public, max-age=100, s-maxage=60')
  })
  test('proxy cache set to a minute when original value is higher', async () => {
    fetchSpy.mockImplementation(async (_, init) => {
      receivedCfObject = (init as RequestInit).cf
      const responseHeaders = new Headers({
        'cache-control': 'public, max-age=3613, s-maxage=575500',
      })

      return new Response('', { headers: responseHeaders })
    })
    const req = new Request(reqURL.toString())
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600, s-maxage=60')
  })
  test('proxy cache is the same when original value is lower than a minute', async () => {
    fetchSpy.mockImplementation(async (_, init) => {
      receivedCfObject = (init as RequestInit).cf
      const responseHeaders = new Headers({
        'cache-control': 'public, max-age=3613, s-maxage=10',
      })

      return new Response('', { headers: responseHeaders })
    })
    const req = new Request(reqURL.toString())
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600, s-maxage=10')
  })
  test('cloudflare network cache is set to 5 mins', async () => {
    fetchSpy.mockImplementation(async (_, init) => {
      receivedCfObject = (init as RequestInit).cf
      const responseHeaders = new Headers({
        'cache-control': 'public, max-age=3613, s-maxage=575500',
      })

      return new Response('', { headers: responseHeaders })
    })
    const req = new Request(reqURL.toString())
    await worker.fetch(req, workerEnv)
    expect(receivedCfObject).toMatchObject({ cacheTtl: 300 })
    expect({ cacheTtl: 300 }).toMatchObject(receivedCfObject!)
  })
})

describe('agent download request HTTP method', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  const reqURL = new URL('https://example.com/worker_path/agent_download?apiKey=someApiKey')
  let requestMethod: string

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      requestMethod = req.method

      return new Response('')
    })
  })

  beforeEach(() => {
    requestMethod = ''
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('when method is GET', async () => {
    const req = new Request(reqURL.toString(), { method: 'GET' })
    await worker.fetch(req, workerEnv)
    expect(requestMethod).toBe('GET')
  })

  test('when method is POST', async () => {
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    expect(requestMethod).toBe('POST')
  })
})

describe('agent download response', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test("response body and content-type don't change", async () => {
    const agentScript =
      '/** FingerprintJS Pro - Copyright (c) FingerprintJS, Inc, 2022 (https://fingerprint.com) /** function hi() { console.log("hello world!!") }'
    fetchSpy.mockImplementation(async () => {
      const headers: HeadersInit = {
        'content-type': 'text/javascript; charset=utf-8',
      }
      return new Response(agentScript, { headers })
    })
    const req = new Request('https://example.com/worker_path/agent_download')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8')
    expect(await response.text()).toBe(agentScript)
  })
  test('strict-transport-security is removed', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers: HeadersInit = {
        'strict-transport-security': 'max-age=63072000',
      }
      return new Response('', { headers })
    })
    const req = new Request('https://example.com/worker_path/agent_download')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('strict-transport-security')).toBe(null)
  })
  test('other headers remain the same', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers: HeadersInit = {
        'some-header': 'some-value',
      }
      return new Response('', { headers })
    })
    const req = new Request('https://example.com/worker_path/agent_download')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('some-header')).toBe('some-value')
  })
  test('failure response', async () => {
    fetchSpy.mockImplementation(async () => {
      return new Response('some error', { status: 500, headers: { 'content-type': 'text/plain; charset=UTF-8' } })
    })
    const req = new Request('https://example.com/worker_path/agent_download')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8')
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('some error')
  })
  test('error response', async () => {
    fetchSpy.mockImplementation(async () => {
      throw new Error('some error')
    })
    const req = new Request('https://example.com/worker_path/agent_download')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.status).toBe(500)
    const responseBody = await response.json()
    // Note: toStrictEqual does not work for some reason, using double toMatchObject instead
    expect(responseBody).toMatchObject({ error: 'some error' })
    expect({ error: 'some error' }).toMatchObject(responseBody as any)
  })
})

import { WorkerEnv } from '../../src/env'
import worker from '../../src'
import { FPJSResponse } from '../../src/utils/createErrorResponse'

const workerEnv: WorkerEnv = {
  PROXY_SECRET: 'proxy_secret',
  GET_RESULT_PATH: 'get_result',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
}

describe('ingress API request proxy URL', () => {
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
    reqURL = new URL('https://example.com/worker_path/get_result')

    receivedReqURL = ''
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('no region', async () => {
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://api.fpjs.io')
  })

  test('us region', async () => {
    reqURL.searchParams.append('region', 'us')
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://api.fpjs.io')
  })

  test('eu region', async () => {
    reqURL.searchParams.append('region', 'eu')
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://eu.api.fpjs.io')
  })

  test('ap region', async () => {
    reqURL.searchParams.append('region', 'ap')
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const receivedURL = new URL(receivedReqURL)
    expect(receivedURL.origin).toBe('https://ap.api.fpjs.io')
  })
})

describe('ingress API request query parameters', () => {
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
    reqURL = new URL('https://example.com/worker_path/get_result')
    reqURL.searchParams.append('someKey', 'someValue')

    receivedReqURL = ''
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('traffic monitoring when no ii parameter before', async () => {
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    const iiValues = url.searchParams.getAll('ii')
    expect(iiValues.length).toBe(1)
    expect(iiValues[0]).toBe('fingerprintjs-pro-cloudflare/__current_worker_version__/ingress')
  })
  test('traffic monitoring when there is ii parameter before', async () => {
    reqURL.searchParams.append('ii', 'fingerprintjs-pro-react/v1.2.3')
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    const iiValues = url.searchParams.getAll('ii')
    expect(iiValues.length).toBe(2)
    expect(iiValues[0]).toBe('fingerprintjs-pro-react/v1.2.3')
    expect(iiValues[1]).toBe('fingerprintjs-pro-cloudflare/__current_worker_version__/ingress')
  })
  test('whole query string when no ii parameter before', async () => {
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    expect(url.search).toBe(
      '?someKey=someValue' + '&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fingress',
    )
  })
  test('whole query string when there is ii parameter before', async () => {
    reqURL.searchParams.append('ii', 'fingerprintjs-pro-react/v1.2.3')
    const req = new Request(reqURL.toString(), { method: 'POST' })
    await worker.fetch(req, workerEnv)
    const url = new URL(receivedReqURL)
    expect(url.search).toBe(
      '?someKey=someValue' +
        '&ii=fingerprintjs-pro-react%2Fv1.2.3' +
        '&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fingress',
    )
  })
})

describe('ingress API request headers', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  const reqURL = new URL('https://example.com/worker_path/get_result')
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

  test('req headers are the same (except Cookie) when no proxy secret', async () => {
    const workerEnv: WorkerEnv = {
      PROXY_SECRET: null,
      GET_RESULT_PATH: 'get_result',
      AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
    }
    const reqHeaders = new Headers({
      accept: '*/*',
      'cache-control': 'no-cache',
      'accept-language': 'en-US',
      'user-agent': 'Mozilla/5.0',
      'x-some-header': 'some value',
      'cf-connecting-ip': '203.0.113.195',
      'x-forwarded-for': '203.0.113.195, 2001:db8:85a3:8d3:1319:8a2e:370:7348',
    })
    const req = new Request(reqURL.toString(), { headers: reqHeaders, method: 'POST' })
    await worker.fetch(req, workerEnv)
    receivedHeaders.forEach((value, key) => {
      expect(reqHeaders.get(key)).toBe(value)
    })
    reqHeaders.forEach((value, key) => {
      expect(receivedHeaders.get(key)).toBe(value)
    })
  })
  test('req headers are correct when proxy secret is set', async () => {
    const reqHeaders = new Headers({
      accept: '*/*',
      'cache-control': 'no-cache',
      'accept-language': 'en-US',
      'user-agent': 'Mozilla/5.0',
      'x-some-header': 'some value',
      'cf-connecting-ip': '203.0.113.195',
      'x-forwarded-for': '203.0.113.195, 2001:db8:85a3:8d3:1319:8a2e:370:7348',
    })
    const req = new Request(reqURL.toString(), { headers: reqHeaders, method: 'POST' })
    await worker.fetch(req, workerEnv)
    const expectedHeaders = new Headers(reqHeaders)
    expectedHeaders.set('FPJS-Proxy-Secret', 'proxy_secret')
    expectedHeaders.set('FPJS-Proxy-Client-IP', '203.0.113.195')
    receivedHeaders.forEach((value, key) => {
      expect(expectedHeaders.get(key)).toBe(value)
    })
    expectedHeaders.forEach((value, key) => {
      expect(receivedHeaders.get(key)).toBe(value)
    })
  })
  test('req headers do not have cookies except _iidt', async () => {
    const reqHeaders = new Headers({
      accept: '*/*',
      'cache-control': 'no-cache',
      'accept-language': 'en-US',
      'user-agent': 'Mozilla/5.0',
      'x-some-header': 'some value',
      cookie:
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
    })
    const req = new Request(reqURL.toString(), { headers: reqHeaders, method: 'POST' })
    await worker.fetch(req, workerEnv)
    expect(receivedHeaders.get('cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==',
    )
  })
})

describe('ingress API request body', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  const reqURL = new URL('https://example.com/worker_path/get_result')
  let receivedBody = ''

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      receivedBody = await req.text()

      return new Response('')
    })
  })

  beforeEach(() => {
    receivedBody = ''
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('request body is not modified', async () => {
    const reqBody = 'some request body'
    const req = new Request(reqURL.toString(), { body: reqBody, method: 'POST' })
    await worker.fetch(req, workerEnv)
    expect(receivedBody).toBe(reqBody)
  })
})

describe('agent download request HTTP method', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>
  const reqURL = new URL('https://example.com/worker_path/get_result')
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

describe('ingress API response headers', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('cookies are the same except domain', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers = new Headers({
        'set-cookie':
          '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=fpjs.io;',
      })
      return new Response('', { headers })
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('set-cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=example.com; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=example.com',
    )
  })
  test('cookies are first party for the req url whose TLD is a regular TLD, the domain is derived from the req url (not origin header)', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers = new Headers({
        origin: 'https://some-other.com',
        'set-cookie':
          '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=fpjs.io;',
      })
      return new Response('', { headers })
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('set-cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=example.com; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=example.com',
    )
  })
  test('cookies are first party for the req url whose TLD has wildcard, the domain is derived from the req url (not origin header)', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers = new Headers({
        origin: 'https://some-other.com',
        'set-cookie':
          '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=fpjs.io;',
      })
      return new Response('', { headers })
    })
    const req = new Request('https://sub2.sub1.some.alces.network/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('set-cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=sub1.some.alces.network; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=sub1.some.alces.network',
    )
  })
  test('cookies are first party for the req url whose TLD has exception, the domain is derived from the req url (not origin header)', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers = new Headers({
        origin: 'https://some-other.com',
        'set-cookie':
          '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=fpjs.io;',
      })
      return new Response('', { headers })
    })
    const req = new Request('https://city.kawasaki.jp/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('set-cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=city.kawasaki.jp; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None, anotherCookie=anotherValue; Domain=city.kawasaki.jp',
    )
  })
  test('response headers are the same (except HSTS and set-cookie)', async () => {
    const responseHeaders = new Headers({
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
      'content-type': 'text/plain',
    })
    fetchSpy.mockImplementation(async () => {
      return new Response('', { headers: responseHeaders })
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    response.headers.forEach((value, key) => {
      expect(responseHeaders.get(key)).toBe(value)
    })
    responseHeaders.forEach((value, key) => {
      expect(response.headers.get(key)).toBe(value)
    })
  })
  test('strict-transport-security is removed', async () => {
    fetchSpy.mockImplementation(async () => {
      const headers = new Headers({
        'strict-transport-security': 'max-age=63072000',
      })
      return new Response('', { headers })
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('strict-transport-security')).toBe(null)
  })
})

describe('ingress API response body when successful', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('body is unchanged', async () => {
    fetchSpy.mockImplementation(async () => {
      return new Response('some text')
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(await response.text()).toBe('some text')
  })
})

describe('ingress API response when failure', () => {
  let fetchSpy: jest.MockInstance<Promise<Response>, any>

  beforeAll(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch')
  })

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('body and headers are unchanged when ingress API fails', async () => {
    const responseHeaders = new Headers({
      'access-control-allow-credentials': 'true',
      'access-control-expose-headers': 'Retry-After',
      'content-type': 'text/plain',
    })
    fetchSpy.mockImplementation(async () => {
      return new Response('some error', { status: 500, headers: responseHeaders })
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('some error')
    response.headers.forEach((value, key) => {
      expect(responseHeaders.get(key)).toBe(value)
    })
    responseHeaders.forEach((value, key) => {
      expect(response.headers.get(key)).toBe(value)
    })
  })
  test('error response when error inside the worker', async () => {
    fetchSpy.mockImplementation(async () => {
      throw new Error('some error')
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.status).toBe(500)
    const responseBody = (await response.json()) as FPJSResponse
    const expectedResponseBody: Omit<FPJSResponse, 'requestId'> = {
      v: '2',
      error: {
        code: 'IntegrationFailed',
        message: 'An error occurred with Cloudflare worker. Reason: some error',
      },
      products: {},
    }
    const requestId = responseBody.requestId
    expect(requestId).toMatch(/^\d{13}\.[a-zA-Z\d]{6}$/)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const modifiedResponseBody: Omit<FPJSResponse, 'requestId'> = (({ requestId, ...rest }) => ({ ...rest }))(
      responseBody,
    )
    // Note: toStrictEqual does not work for some reason, using double toMatchObject instead
    expect(modifiedResponseBody).toMatchObject(expectedResponseBody)
    expect(expectedResponseBody).toMatchObject(modifiedResponseBody)
  })
})

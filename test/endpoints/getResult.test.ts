import { WorkerEnv } from '../../src/env'
import worker from '../../src'
import { FPJSResponse } from '../../src/utils/createErrorResponse'

const workerEnv: WorkerEnv = {
  WORKER_PATH: 'worker_path',
  PROXY_SECRET: 'proxy_secret',
  GET_RESULT_PATH: 'get_result',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
}

describe('ingress API request and response', () => {
  const fetchSpy = jest.spyOn(globalThis, 'fetch')

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('url search, cookie filtering, proxy secret and response headers', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const headers: HeadersInit = {
        'strict-transport-security': 'max-age=63072000',
        'set-cookie':
          '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=fpjs.io; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None',
      }
      const bodyObject = {
        url: req.url,
        reqHeaders: Object.fromEntries(req.headers),
      }
      return new Response(JSON.stringify(bodyObject), { headers })
    })

    const headers = new Headers({
      cookie:
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
    })
    const req = new Request(
      'https://example.com/worker_path/get_result?ii=fingerprintjs-pro-cloudflare%2Fv1.0.0%2Fprocdn&a=b',
      { headers },
    )
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('strict-transport-security')).toBe(null)
    expect(response.headers.get('set-cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; Path=/; Domain=example.com; Expires=Fri, 19 Jan 2024 08:54:36 GMT; HttpOnly; Secure; SameSite=None',
    )
    const responseBody = (await response.json()) as any
    const url = new URL(responseBody.url)
    expect(url.origin).toBe('https://api.fpjs.io')
    expect(url.search).toBe(
      '?ii=fingerprintjs-pro-cloudflare%2Fv1.0.0%2Fprocdn&a=b&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fingress',
    )
    const reqHeaders = new Headers(responseBody.reqHeaders)
    expect(reqHeaders.get('cookie')).toBe(
      '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==',
    )
    expect(reqHeaders.get('FPJS-Proxy-Secret')).toBe('proxy_secret')
    // expect(reqHeaders.get('FPJS-Proxy-Client-IP')).toBe('127.0.0.1') todo test for client IP
  })
  test('when no proxy secret', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const bodyObject = {
        reqHeaders: Object.fromEntries(req.headers),
      }
      return new Response(JSON.stringify(bodyObject))
    })

    const headers = new Headers({
      cookie:
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
    })
    const req = new Request(
      'https://example.com/worker_path/get_result?ii=fingerprintjs-pro-cloudflare%2Fv1.0.0%2Fprocdn&a=b',
      { headers },
    )
    const workerEnv: WorkerEnv = {
      WORKER_PATH: 'worker_path',
      PROXY_SECRET: null,
      GET_RESULT_PATH: 'get_result',
      AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
    }
    const response = await worker.fetch(req, workerEnv)
    const responseBody = (await response.json()) as any
    const reqHeaders = new Headers(responseBody.reqHeaders)
    expect(reqHeaders.get('FPJS-Proxy-Secret')).toBe(null)
    expect(reqHeaders.get('FPJS-Proxy-Client-IP')).toBe(null)
  })
  // test('proxy secret client IP', async () => {
  //   fetchSpy.mockImplementation(async (input, init) => {
  //     const req = new Request(input, init)
  //     const bodyObject = {
  //       reqHeaders: Object.fromEntries(req.headers),
  //     }
  //     return new Response(JSON.stringify(bodyObject))
  //   })
  //   const mf = new Miniflare({
  //     packagePath: true,
  //     wranglerConfigPath: true,
  //     async metaProvider() {
  //       return {
  //         realIp: '100.101.102.103',
  //       }
  //     },
  //   })
  //   const response = await mf.dispatchFetch('http://localhost:8787')
  //   const responseBody = (await response.json()) as any
  //   const reqHeaders = new Headers(responseBody.reqHeaders)
  //   expect(reqHeaders.get('FPJS-Proxy-Client-IP')).toBe('100.101.102.103')
  // })
  test('eu region', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const bodyObject = {
        url: req.url,
      }
      return new Response(JSON.stringify(bodyObject))
    })
    const req = new Request(
      'https://example.com/worker_path/get_result?ii=fingerprintjs-pro-cloudflare%2Fv1.0.0%2Fprocdn&a=b&region=eu',
      {
        headers: {
          cookie:
            '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
        },
      },
    )
    const response = await worker.fetch(req, workerEnv)
    const responseBody = (await response.json()) as any
    const url = new URL(responseBody.url)
    expect(url.origin).toBe('https://eu.api.fpjs.io')
  })
  test('ap region', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const bodyObject = {
        url: req.url,
      }
      return new Response(JSON.stringify(bodyObject))
    })
    const req = new Request(
      'https://example.com/worker_path/get_result?ii=fingerprintjs-pro-cloudflare%2Fv1.0.0%2Fprocdn&a=b&region=ap',
      {
        headers: {
          cookie:
            '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
        },
      },
    )
    const response = await worker.fetch(req, workerEnv)
    const responseBody = (await response.json()) as any
    const url = new URL(responseBody.url)
    expect(url.origin).toBe('https://ap.api.fpjs.io')
  })
  test('failure response', async () => {
    fetchSpy.mockImplementation(async () => {
      return new Response('some error', { status: 500, headers: { 'content-type': 'text/plain; charset=UTF-8' } })
    })
    const req = new Request('https://example.com/worker_path/get_result')
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('content-type')).toBe('text/plain; charset=UTF-8')
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('some error')
  })
  test('error response', async () => {
    fetchSpy.mockImplementation(async () => {
      throw new Error('some error')
    })
    const req = new Request('https://example.com/worker_path/get_result', {
      headers: { origin: 'https://example.com' },
    })
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.status).toBe(500)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    const responseBody = (await response.json()) as unknown as FPJSResponse
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

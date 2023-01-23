import worker from '../../src/index'
import { WorkerEnv } from '../../src/env'

const workerEnv: WorkerEnv = {
  WORKER_PATH: 'worker_path',
  PROXY_SECRET: 'proxy_secret',
  GET_RESULT_PATH: 'get_result',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
}

describe('agent download request and response', () => {
  const fetchSpy = jest.spyOn(globalThis, 'fetch')

  afterAll(() => {
    fetchSpy.mockRestore()
  })

  test('url search, cf cache and response headers', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const headers: HeadersInit = {
        'cache-control': 'max-age=72000',
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      }
      const bodyObject = {
        url: req.url,
        cf: (init as RequestInit).cf,
      }
      return new Response(JSON.stringify(bodyObject), { headers })
    })

    const headers = new Headers({
      cookie:
        '_iidt=GlMQaHMfzYvomxCuA7Uymy7ArmjH04jPkT+enN7j/Xk8tJG+UYcQV+Qw60Ry4huw9bmDoO/smyjQp5vLCuSf8t4Jow==; auth_token=123456',
    })
    const req = new Request('https://example.com/worker_path/agent_download?apiKey=someApiKey&someKey=someValue', {
      headers,
    })
    const response = await worker.fetch(req, workerEnv)
    expect(response.headers.get('cache-control')).toBe('max-age=3600, s-maxage=3600')
    expect(response.headers.get('strict-transport-security')).toBe(null)
    expect(response.headers.get('cookie')).toBe(null)
    const responseBody = (await response.json()) as any
    const url = new URL(responseBody.url)
    expect(url.origin).toBe('https://fpcdn.io')
    expect(url.pathname).toBe('/v3/someApiKey')
    expect(url.search).toBe(
      '?apiKey=someApiKey&someKey=someValue&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fprocdn',
    )
    // Note: toStrictEqual does not work for some reason, using double toMatchObject instead
    expect(responseBody.cf).toMatchObject({ cacheTtl: 300 })
    expect({ cacheTtl: 300 }).toMatchObject(responseBody.cf)
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
  test('endpoint url when version exists', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const bodyObject = {
        url: req.url,
      }
      return new Response(JSON.stringify(bodyObject))
    })
    const req = new Request(
      'https://example.com/worker_path/agent_download?apiKey=someApiKey&version=5&someKey=someValue',
    )
    const response = await worker.fetch(req, workerEnv)
    const responseBody = (await response.json()) as any
    const url = new URL(responseBody.url)
    expect(url.origin).toBe('https://fpcdn.io')
    expect(url.pathname).toBe('/v5/someApiKey')
    expect(url.search).toBe(
      '?apiKey=someApiKey&version=5&someKey=someValue&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fprocdn',
    )
  })
  test('endpoint url when version and loaderVersion exists', async () => {
    fetchSpy.mockImplementation(async (input, init) => {
      const req = new Request(input, init)
      const bodyObject = {
        url: req.url,
      }
      return new Response(JSON.stringify(bodyObject))
    })
    const req = new Request(
      'https://example.com/worker_path/agent_download?apiKey=someApiKey&version=5&loaderVersion=1.2.3',
    )
    const response = await worker.fetch(req, workerEnv)
    const responseBody = (await response.json()) as any
    const url = new URL(responseBody.url)
    expect(url.origin).toBe('https://fpcdn.io')
    expect(url.pathname).toBe('/v5/someApiKey/loader_v1.2.3.js')
    expect(url.search).toBe(
      '?apiKey=someApiKey&version=5&loaderVersion=1.2.3&ii=fingerprintjs-pro-cloudflare%2F__current_worker_version__%2Fprocdn',
    )
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

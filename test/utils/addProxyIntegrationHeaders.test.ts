import { addProxyIntegrationHeaders, getIPFromHeaders } from '../../src/utils'
import { WorkerEnv } from '../../src/env'

describe('addProxyIntegrationHeaders', () => {
  let headers: Headers
  let env: WorkerEnv
  beforeEach(() => {
    headers = new Headers()
    headers.set('CF-Connecting-IP', '19.117.63.126')
    headers.set('x-custom-header', 'custom-value')
    env = {
      AGENT_SCRIPT_DOWNLOAD_PATH: 'agent-path',
      GET_RESULT_PATH: 'result-path',
      PROXY_SECRET: 'secret_value',
      FPJS_CDN_URL: null,
      FPJS_INGRESS_BASE_HOST: null,
    }
  })
  test('when PROXY_SECRET is set', () => {
    addProxyIntegrationHeaders(headers, 'https://example.com/worker/result', env)
    expect(headers.get('FPJS-Proxy-Secret')).toBe('secret_value')
    expect(headers.get('FPJS-Proxy-Client-IP')).toBe('19.117.63.126')
    expect(headers.get('FPJS-Proxy-Forwarded-Host')).toBe('example.com')
    expect(headers.get('x-custom-header')).toBe('custom-value')
  })
  test('when PROXY_SECRET is not set', () => {
    env.PROXY_SECRET = null
    addProxyIntegrationHeaders(headers, 'https://example.com/worker/result', env)
    expect(headers.get('FPJS-Proxy-Secret')).toBe(null)
    expect(headers.get('FPJS-Proxy-Client-IP')).toBe(null)
    expect(headers.get('FPJS-Proxy-Forwarded-Host')).toBe(null)
    expect(headers.get('x-custom-header')).toBe('custom-value')
  })
  test('ipv6', () => {
    headers.set('CF-Connecting-IP', '84D:1111:222:3333:4444:5555:6:77')
    addProxyIntegrationHeaders(headers, 'https://example.com/worker/result', env)
    expect(headers.get('FPJS-Proxy-Secret')).toBe('secret_value')
    expect(headers.get('FPJS-Proxy-Client-IP')).toBe('84D:1111:222:3333:4444:5555:6:77')
    expect(headers.get('FPJS-Proxy-Forwarded-Host')).toBe('example.com')
    expect(headers.get('x-custom-header')).toBe('custom-value')
  })
})

describe('getIPFromHeaders', () => {
  const ipv6 = '2001:67c:198c:906:3b::3c2'
  const ipv4 = '19.117.63.126'

  it('returns CF-Connecting-IP when only CF-Connecting-IP is set', () => {
    const headers = new Headers()
    headers.set('CF-Connecting-IP', ipv4)

    expect(getIPFromHeaders(headers)).toEqual(ipv4)
  })

  it('returns CF-Connecting-IP when Cf-Pseudo-IPv4 is present but different', () => {
    const headers = new Headers()
    headers.set('CF-Connecting-IP', ipv6)
    headers.set('Cf-Pseudo-IPv4', ipv4)

    expect(getIPFromHeaders(headers)).toEqual(ipv6)
  })

  it('returns CF-Connecting-IPv6 when Cf-Pseudo-IPv4 matches CF-Connecting-IP', () => {
    const headers = new Headers()
    headers.set('CF-Connecting-IP', ipv4)
    headers.set('Cf-Pseudo-IPv4', ipv4)
    headers.set('CF-Connecting-IPv6', ipv6)

    expect(getIPFromHeaders(headers)).toEqual(ipv6)
  })

  it('returns an empty string when CF-Connecting-IP header is set to an empty string', () => {
    const headers = new Headers()
    headers.set('CF-Connecting-IP', '')

    expect(getIPFromHeaders(headers)).toEqual('')
  })

  it('returns an empty string when no headers are set', () => {
    expect(getIPFromHeaders(new Headers())).toEqual('')
  })
})

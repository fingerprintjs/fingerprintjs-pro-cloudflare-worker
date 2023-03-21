import { addProxyIntegrationHeaders } from '../../src/utils'
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
    }
  })
  test('when PROXY_SECRET is set', () => {
    addProxyIntegrationHeaders(headers, env)
    expect(headers.get('FPJS-Proxy-Secret')).toBe('secret_value')
    expect(headers.get('FPJS-Proxy-Client-IP')).toBe('19.117.63.126')
    expect(headers.get('x-custom-header')).toBe('custom-value')
  })
  test('when PROXY_SECRET is not set', () => {
    env.PROXY_SECRET = null
    addProxyIntegrationHeaders(headers, env)
    expect(headers.get('FPJS-Proxy-Secret')).toBe(null)
    expect(headers.get('FPJS-Proxy-Client-IP')).toBe(null)
    expect(headers.get('x-custom-header')).toBe('custom-value')
  })
  test('ipv6', () => {
    headers.set('CF-Connecting-IP', '84D:1111:222:3333:4444:5555:6:77')
    addProxyIntegrationHeaders(headers, env)
    expect(headers.get('FPJS-Proxy-Secret')).toBe('secret_value')
    expect(headers.get('FPJS-Proxy-Client-IP')).toBe('84D:1111:222:3333:4444:5555:6:77')
    expect(headers.get('x-custom-header')).toBe('custom-value')
  })
})

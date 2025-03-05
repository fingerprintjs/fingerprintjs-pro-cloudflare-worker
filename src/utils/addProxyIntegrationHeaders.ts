import { getProxySecret, WorkerEnv } from '../env'

export function addProxyIntegrationHeaders(headers: Headers, url: string, env: WorkerEnv) {
  const proxySecret = getProxySecret(env)
  if (!proxySecret) {
    return
  }

  headers.set('FPJS-Proxy-Secret', proxySecret)
  headers.set('FPJS-Proxy-Client-IP', getIPFromHeaders(headers))
  headers.set('FPJS-Proxy-Forwarded-Host', new URL(url).hostname)
}

export function getIPFromHeaders(headers: Headers) {
  const connectingIP = headers.get('CF-Connecting-IP')

  if (headers.get('Cf-Pseudo-IPv4') === connectingIP) {
    return headers.get('CF-Connecting-IPv6') || ''
  }

  return connectingIP || ''
}

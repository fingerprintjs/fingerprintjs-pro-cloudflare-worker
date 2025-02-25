import { getProxySecret, WorkerEnv } from '../env'

function getIPFromHeaders(headers: Headers){
  if (headers.get('Cf-Pseudo-IPv4') === headers.get('CF-Connecting-IP')) {
    return headers.get('CF-Connecting-IPv6') || ''
  }

  return headers.get('CF-Connecting-IP') || ''
}

function getIPFromHeaders2(headers: Headers){
  return headers.get('CF-Connecting-IPv6') || headers.get('CF-Connecting-IP') || ''
}

export function addProxyIntegrationHeaders(headers: Headers, url: string, env: WorkerEnv) {
  const proxySecret = getProxySecret(env)
  if (proxySecret) {
    headers.set('FPJS-Proxy-Secret', proxySecret)
    headers.set('FPJS-Proxy-Client-IP', headers.get('CF-Connecting-IP') || '')
    headers.set('FPJS-Proxy-Forwarded-Host', new URL(url).hostname)
  }
}

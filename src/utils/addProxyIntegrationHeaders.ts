import { getProxySecret, WorkerEnv } from '../env'

export function addProxyIntegrationHeaders(headers: Headers, url: string, env: WorkerEnv) {
  const proxySecret = getProxySecret(env)
  if (proxySecret) {
    headers.set('FPJS-Proxy-Secret', proxySecret)
    headers.set('FPJS-Proxy-Client-IP', headers.get('CF-Connecting-IP') || '')
    headers.set('FPJS-Proxy-Forwarded-Host', new URL(url).hostname)
  }
}

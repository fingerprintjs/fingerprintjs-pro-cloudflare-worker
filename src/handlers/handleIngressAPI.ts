import { WorkerEnv } from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createCookieObjectFromHeaderValue,
  createErrorResponseForIngress,
  createCookieStringFromObject,
  filterCookies,
  getEffectiveTLDPlusOne,
  getVisitorIdEndpoint,
} from '../utils'

declare global {
  interface Headers {
    getAll: (headerName: string) => string[]
  }
}

function copySearchParams(oldURL: URL, newURL: URL): void {
  newURL.search = new URLSearchParams(oldURL.search).toString()
}

function getCookieValueWithDomain(oldCookieValue: string, domain: string): string {
  const [cookieName, cookieObject] = createCookieObjectFromHeaderValue(oldCookieValue)
  cookieObject.Domain = domain
  return createCookieStringFromObject(cookieName, cookieObject)
}

function createResponseWithFirstPartyCookies(request: Request, response: Response) {
  const hostname = new URL(request.url).hostname
  const eTLDPlusOneDomain = getEffectiveTLDPlusOne(hostname)
  const newHeaders = new Headers(response.headers)
  if (eTLDPlusOneDomain) {
    const cookiesArray: string[] = newHeaders.getAll('set-cookie')
    newHeaders.delete('set-cookie')
    for (const cookieValue of cookiesArray) {
      const newCookie = getCookieValueWithDomain(cookieValue, eTLDPlusOneDomain)
      newHeaders.append('set-cookie', newCookie)
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

function makeIngressAPIRequest(request: Request, env: WorkerEnv) {
  const oldURL = new URL(request.url)
  const endpoint = getVisitorIdEndpoint(oldURL.searchParams)
  const newURL = new URL(endpoint)
  copySearchParams(oldURL, newURL)
  addTrafficMonitoringSearchParamsForVisitorIdRequest(newURL)

  let headers = new Headers(request.headers)
  addProxyIntegrationHeaders(headers, env)
  headers = filterCookies(headers, (key) => key === '_iidt')

  console.log(`sending ingress api to ${newURL}...`)
  const newRequest = new Request(newURL.toString(), new Request(request, { headers }))
  return fetch(newRequest).then((response) => createResponseWithFirstPartyCookies(request, response))
}

export async function handleIngressAPI(request: Request, env: WorkerEnv) {
  try {
    return await makeIngressAPIRequest(request, env)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}

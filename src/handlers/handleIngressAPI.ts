import { getVisitorIdEndpoint, WorkerEnv } from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createCookieObjectFromHeaderValue,
  createCookieStringFromObject,
  filterCookies,
  getEffectiveTLDPlusOne,
} from '../utils'

declare global {
  interface Headers {
    getAll: (headerName: string) => string[]
  }
}

function copySearchParams(oldURL: URL, newURL: URL) {
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

async function handleIngressAPIRaw(request: Request, url: URL, headers: Headers) {
  if (request == null) {
    throw new Error('request is null')
  }

  if (url == null) {
    throw new Error('url is null')
  }

  console.log(`sending ingress api to ${url}...`)

  const newRequest = new Request(url.toString(), new Request(request, { headers }))

  const response = await fetch(newRequest)
  return createResponseWithFirstPartyCookies(request, response)
}

export async function handleIngressAPI(request: Request, env: WorkerEnv) {
  const oldURL = new URL(request.url)
  const region = oldURL.searchParams.get('region') || 'us'
  const endpoint = getVisitorIdEndpoint(region)
  const newURL = new URL(endpoint)
  copySearchParams(oldURL, newURL)
  addTrafficMonitoringSearchParamsForVisitorIdRequest(newURL)

  let headers = new Headers(request.headers)
  addProxyIntegrationHeaders(headers, env)
  headers = filterCookies(headers, (key) => key === '_iidt')

  return handleIngressAPIRaw(request, newURL, headers)
}

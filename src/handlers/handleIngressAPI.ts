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
  fetchCacheable,
  createFallbackErrorResponse,
} from '../utils'
import { createResponseWithMaxAge } from '../utils'

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

function createRequestURL(receivedRequestURL: string, routeMatches: RegExpMatchArray | undefined) {
  const routeSuffix = routeMatches ? routeMatches[1] : undefined
  const oldURL = new URL(receivedRequestURL)
  const endpoint = getVisitorIdEndpoint(oldURL.searchParams, routeSuffix)
  const newURL = new URL(endpoint)
  copySearchParams(oldURL, newURL)

  return newURL
}

async function makeIngressRequest(
  receivedRequest: Request,
  env: WorkerEnv,
  routeMatches: RegExpMatchArray | undefined,
) {
  const requestURL = createRequestURL(receivedRequest.url, routeMatches)
  addTrafficMonitoringSearchParamsForVisitorIdRequest(requestURL)
  let headers = new Headers(receivedRequest.headers)
  headers = filterCookies(headers, (key) => key === '_iidt')
  addProxyIntegrationHeaders(headers, env)
  const body = await (receivedRequest.headers.get('Content-Type') ? receivedRequest.blob() : Promise.resolve(null))
  console.log(`sending ingress request to ${requestURL}...`)
  const request = new Request(requestURL, new Request(receivedRequest, { headers, body }))

  return fetch(request).then((response) => createResponseWithFirstPartyCookies(receivedRequest, response))
}

function makeCacheRequest(receivedRequest: Request, routeMatches: RegExpMatchArray | undefined) {
  const requestURL = createRequestURL(receivedRequest.url, routeMatches)
  const headers = new Headers(receivedRequest.headers)
  headers.delete('Cookie')

  console.log(`sending cache request to ${requestURL}...`)
  const request = new Request(requestURL, new Request(receivedRequest, { headers }))

  const workerCacheTtl = 60
  const maxMaxAge = 60 * 60
  const maxSMaxAge = 60

  return fetchCacheable(request, workerCacheTtl).then((response) =>
    createResponseWithMaxAge(response, maxMaxAge, maxSMaxAge),
  )
}

export async function handleIngressAPI(request: Request, env: WorkerEnv, routeMatches: RegExpMatchArray | undefined) {
  if (request.method === 'GET') {
    try {
      return await makeCacheRequest(request, routeMatches)
    } catch (e) {
      return createFallbackErrorResponse(e)
    }
  }

  try {
    return await makeIngressRequest(request, env, routeMatches)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}

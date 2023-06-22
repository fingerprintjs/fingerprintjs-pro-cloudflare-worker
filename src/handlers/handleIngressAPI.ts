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

function getNewURL(request: Request, routeMatches: RegExpMatchArray | undefined) {
  const routeSuffix = routeMatches ? routeMatches[1] : undefined
  const oldURL = new URL(request.url)
  const endpoint = getVisitorIdEndpoint(oldURL.searchParams, routeSuffix)
  const newURL = new URL(endpoint)
  copySearchParams(oldURL, newURL)

  return newURL
}

function generateNewRequest(request: Request, routeMatches: RegExpMatchArray | undefined) {
  const newURL = getNewURL(request, routeMatches)
  const headers = new Headers(request.headers)
  headers.delete('Cookie')

  return new Request(newURL.toString(), new Request(request, { headers }))
}

async function addBodyToProxyRequest(request: Request, env: WorkerEnv, routeMatches: RegExpMatchArray | undefined) {
  const newURL = getNewURL(request, routeMatches)
  addTrafficMonitoringSearchParamsForVisitorIdRequest(newURL)
  let headers = new Headers(request.headers)
  addProxyIntegrationHeaders(headers, env)
  headers = filterCookies(headers, (key) => key === '_iidt')
  const body = await (request.headers.get('Content-Type') ? request.blob() : Promise.resolve(null))

  return new Request(newURL.toString(), new Request(request, { headers, body }))
}

async function makeIngressRequestWithBody(
  request: Request,
  env: WorkerEnv,
  routeMatches: RegExpMatchArray | undefined,
) {
  const requestWithBody = await addBodyToProxyRequest(request, env, routeMatches)
  return fetch(requestWithBody).then((response) => createResponseWithFirstPartyCookies(request, response))
}

async function makeIngressRequestWithoutBody(request: Request) {
  const workerCacheTtl = 60
  const maxMaxAge = 60 * 60
  const maxSMaxAge = 60

  return fetchCacheable(request, workerCacheTtl).then((response) =>
    createResponseWithMaxAge(response, maxMaxAge, maxSMaxAge),
  )
}

export async function handleIngressAPI(request: Request, env: WorkerEnv, routeMatches: RegExpMatchArray | undefined) {
  const ingressMethods = [
    'POST',
    // 'PUT',
    // PATCH
  ]

  if (ingressMethods.includes(request.method)) {
    try {
      return await makeIngressRequestWithBody(request, env, routeMatches)
    } catch (e) {
      return createErrorResponseForIngress(request, e)
    }
  }

  const newRequest = generateNewRequest(request, routeMatches)
  try {
    return await makeIngressRequestWithoutBody(newRequest)
  } catch (e) {
    return createFallbackErrorResponse(e)
  }
}

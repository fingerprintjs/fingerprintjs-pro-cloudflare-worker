import { getVisitorIdEndpoint } from '../env'
import {
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createCookieObjectFromHeaderValue,
  createCookieStringFromObject,
  filterCookies,
  getDomainFromHostname,
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
  const eTLDPlusOneDomain = getDomainFromHostname(hostname)
  const newHeaders = new Headers(response.headers)
  const cookiesArray: string[] = newHeaders.getAll('set-cookie')
  newHeaders.delete('set-cookie')
  for (const cookieValue of cookiesArray) {
    const newCookie = getCookieValueWithDomain(cookieValue, eTLDPlusOneDomain)
    newHeaders.append('set-cookie', newCookie)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

async function handleIngressAPIRaw(request: Request, url: URL) {
  if (request == null) {
    throw new Error('request is null')
  }

  if (url == null) {
    throw new Error('url is null')
  }

  console.log(`sending ingress api to ${url}...`)
  const requestHeaders = filterCookies(request.headers, (key) => key === '_iidt')

  const newRequest = new Request(url.toString(), new Request(request, { headers: requestHeaders }))

  const response = await fetch(newRequest)
  return createResponseWithFirstPartyCookies(request, response)
}

export async function handleIngressAPI(request: Request) {
  const oldURL = new URL(request.url)
  const region = oldURL.searchParams.get('region') || 'us'
  const endpoint = getVisitorIdEndpoint(region)
  const newURL = new URL(endpoint)
  copySearchParams(oldURL, newURL)
  addTrafficMonitoringSearchParamsForVisitorIdRequest(newURL)
  return handleIngressAPIRaw(request, newURL)
}

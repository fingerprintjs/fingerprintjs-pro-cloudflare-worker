import { getVisitorIdEndpoint } from '../env'
import {
  addMonitoringHeadersForVisitorIdRequest,
  createCookieObjectFromHeaderValue,
  createCookieStringFromObject,
  getDomainFromHostname,
} from '../utils'

function copySearchParams(oldURL: URL, newURL: URL) {
  newURL.search = new URLSearchParams(oldURL.search).toString()
}

function getCookieValueWithDomain(oldCookieValue: string, domain: string): string {
  const [cookieName, cookieObject] = createCookieObjectFromHeaderValue(oldCookieValue)
  cookieObject.Domain = domain
  return createCookieStringFromObject(cookieName, cookieObject)
}

function createResponseWithFirstPartyCookies(request: Request, response: Response) {
  const origin = request.headers.get('origin')
  if (!origin) {
    return response
  }

  const hostname = new URL(origin).hostname
  const eTLDPlusOneDomain = getDomainFromHostname(hostname)
  const newHeaders = new Headers(response.headers)
  // @ts-ignore getAll is unable to be resolved
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
  const requestHeaders = new Headers(request.headers)

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
  addMonitoringHeadersForVisitorIdRequest(newURL)
  return handleIngressAPIRaw(request, newURL)
}

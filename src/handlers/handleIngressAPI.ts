import { WorkerEnv } from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createErrorResponseForIngress,
  filterCookies,
  getVisitorIdEndpoint,
  createFallbackErrorResponse,
} from '../utils'

function copySearchParams(oldURL: URL, newURL: URL): void {
  newURL.search = new URLSearchParams(oldURL.search).toString()
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
  addProxyIntegrationHeaders(headers, receivedRequest.url, env)
  const body = await (receivedRequest.headers.get('Content-Type') ? receivedRequest.blob() : Promise.resolve(null))
  console.log(`sending ingress request to ${requestURL}...`)
  const request = new Request(requestURL, new Request(receivedRequest, { headers, body }))

  return fetch(request).then((oldResponse) => new Response(oldResponse.body, oldResponse))
}

function makeCacheEndpointRequest(receivedRequest: Request, routeMatches: RegExpMatchArray | undefined) {
  const requestURL = createRequestURL(receivedRequest.url, routeMatches)
  const headers = new Headers(receivedRequest.headers)
  headers.delete('Cookie')

  console.log(`sending cache request to ${requestURL}...`)
  const request = new Request(requestURL, new Request(receivedRequest, { headers }))

  return fetch(request).then((oldResponse) => new Response(oldResponse.body, oldResponse))
}

export async function handleIngressAPI(request: Request, env: WorkerEnv, routeMatches: RegExpMatchArray | undefined) {
  if (request.method === 'GET') {
    try {
      return await makeCacheEndpointRequest(request, routeMatches)
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

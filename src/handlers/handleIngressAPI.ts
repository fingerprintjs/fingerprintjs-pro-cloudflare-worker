import { getIngressBaseHost, WorkerEnv } from '../env'
import {
  addProxyIntegrationHeaders,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  createErrorResponseForIngress,
  filterCookies,
  getIngressEndpointUrl,
  createFallbackErrorResponse,
} from '../utils'

function copySearchParams(oldURL: URL, newURL: URL): void {
  newURL.search = new URLSearchParams(oldURL.search).toString()
}

function createRequestURL(ingressBaseUrl: string, receivedRequestURL: string, targetPath: string) {
  const oldURL = new URL(receivedRequestURL)
  const endpoint = getIngressEndpointUrl(ingressBaseUrl, oldURL.searchParams, targetPath)
  const newURL = new URL(endpoint)
  copySearchParams(oldURL, newURL)

  return newURL
}

async function makeIngressRequest(receivedRequest: Request, env: WorkerEnv, targetPath: string) {
  const ingressBaseUrl = getIngressBaseHost(env)!

  const requestURL = createRequestURL(ingressBaseUrl, receivedRequest.url, targetPath)
  addTrafficMonitoringSearchParamsForVisitorIdRequest(requestURL)
  let headers = new Headers(receivedRequest.headers)
  headers = filterCookies(headers, (key) => key === '_iidt')
  addProxyIntegrationHeaders(headers, receivedRequest.url, env)
  const body = await (receivedRequest.headers.get('Content-Type') ? receivedRequest.blob() : Promise.resolve(null))
  console.log(`sending ingress request to ${requestURL}...`)
  const request = new Request<unknown, CfProperties<unknown>>(
    requestURL,
    new Request(receivedRequest, { headers, body })
  )

  return fetch(request).then((oldResponse) => new Response(oldResponse.body, oldResponse))
}

function makeCacheEndpointRequest(receivedRequest: Request, env: WorkerEnv, targetPath: string) {
  const ingressBaseUrl = getIngressBaseHost(env)!

  const requestURL = createRequestURL(ingressBaseUrl, receivedRequest.url, targetPath)
  const headers = new Headers(receivedRequest.headers)
  headers.delete('Cookie')

  console.log(`sending cache request to ${requestURL}...`)
  const request = new Request<unknown, CfProperties<unknown>>(requestURL, new Request(receivedRequest, { headers }))

  return fetch(request).then((oldResponse) => new Response(oldResponse.body, oldResponse))
}

export async function handleIngressAPI(request: Request, env: WorkerEnv, targetPath: string) {
  if (request.method === 'GET') {
    try {
      return await makeCacheEndpointRequest(request, env, targetPath)
    } catch (e) {
      return createFallbackErrorResponse(e)
    }
  }

  try {
    return await makeIngressRequest(request, env, targetPath)
  } catch (e) {
    return createErrorResponseForIngress(request, e)
  }
}

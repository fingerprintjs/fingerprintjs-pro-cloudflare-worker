import {
  fetchCacheable,
  getCacheControlHeaderWithMaxAgeIfLower,
  addTrafficMonitoringSearchParamsForProCDN,
  createErrorResponseForProCDN,
  getAgentScriptEndpoint,
} from '../utils'

function createResponseWithMaxAge(oldResponse: Response, maxMaxAge: number): Response {
  const response = new Response(oldResponse.body, oldResponse)
  const oldCacheControlHeader = oldResponse.headers.get('cache-control')
  if (!oldCacheControlHeader) {
    return response
  }

  const cacheControlHeader = getCacheControlHeaderWithMaxAgeIfLower(oldCacheControlHeader, maxMaxAge)
  response.headers.set('cache-control', cacheControlHeader)
  return response
}

async function makeDownloadScriptRequest(request: Request): Promise<Response> {
  const requestSearchParams = new URL(request.url).searchParams
  const agentScriptEndpoint = getAgentScriptEndpoint(requestSearchParams)
  const url = new URL(agentScriptEndpoint)
  addTrafficMonitoringSearchParamsForProCDN(url)
  const newRequest = new Request(url.toString(), new Request(request, { headers: new Headers(request.headers) }))

  console.log(`Downloading script from cdnEndpoint ${url.toString()}...`)
  const workerCacheTtl = 5 * 60
  const maxMaxAge = 60 * 60

  return fetchCacheable(newRequest, workerCacheTtl).then((res) => createResponseWithMaxAge(res, maxMaxAge))
}

export async function handleDownloadScript(request: Request): Promise<Response> {
  try {
    return await makeDownloadScriptRequest(request)
  } catch (e) {
    return createErrorResponseForProCDN(e)
  }
}

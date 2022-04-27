import { fetchCacheable, getCacheControlHeaderWithMaxAgeIfLower, addMonitoringHeadersForProCDN } from '../utils'
import { getAgentScriptEndpoint } from '../env'

function createResponseWithMaxAge(oldResponse: Response, maxMaxAge: number) {
  const response = new Response(oldResponse.body, oldResponse)
  const oldCacheControlHeader = oldResponse.headers.get('cache-control')
  if (!oldCacheControlHeader) {
    return response
  }

  const cacheControlHeader = getCacheControlHeaderWithMaxAgeIfLower(oldCacheControlHeader, maxMaxAge)
  response.headers.set('cache-control', cacheControlHeader)
  return response
}

export async function handleDownloadScript(request: Request) {
  const requestSearchParams = new URL(request.url).searchParams
  const agentScriptEndpoint = getAgentScriptEndpoint(requestSearchParams)
  const url = new URL(agentScriptEndpoint)
  addMonitoringHeadersForProCDN(url)
  const newRequest = new Request(url.toString(), new Request(request, { headers: new Headers(request.headers) }))

  console.log(`Downloading script from cdnEndpoint ${url.toString()}...`)
  const workerCacheTtl = 5 * 60
  const maxMageAge = 60 * 60

  return fetchCacheable(newRequest, workerCacheTtl).then((res) => createResponseWithMaxAge(res, maxMageAge))
}

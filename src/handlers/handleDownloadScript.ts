import {
  fetchCacheable,
  addTrafficMonitoringSearchParamsForProCDN,
  createErrorResponseForProCDN,
  getAgentScriptEndpoint,
  createResponseWithMaxAge,
} from '../utils'

function copySearchParams(oldURL: URL, newURL: URL): void {
  newURL.search = new URLSearchParams(oldURL.search).toString()
}

function makeDownloadScriptRequest(request: Request): Promise<Response> {
  const oldURL = new URL(request.url)
  const agentScriptEndpoint = getAgentScriptEndpoint(oldURL.searchParams)
  const newURL = new URL(agentScriptEndpoint)
  copySearchParams(oldURL, newURL)
  addTrafficMonitoringSearchParamsForProCDN(newURL)

  const headers = new Headers(request.headers)
  headers.delete('Cookie')

  console.log(`Downloading script from cdnEndpoint ${newURL.toString()}...`)
  const newRequest = new Request(newURL.toString(), new Request(request, { headers }))
  const workerCacheTtl = 60
  const maxMaxAge = 60 * 60
  const maxSMaxAge = 60

  return fetchCacheable(newRequest, workerCacheTtl).then((res) => createResponseWithMaxAge(res, maxMaxAge, maxSMaxAge))
}

export async function handleDownloadScript(request: Request): Promise<Response> {
  try {
    return await makeDownloadScriptRequest(request)
  } catch (e) {
    return createErrorResponseForProCDN(e)
  }
}

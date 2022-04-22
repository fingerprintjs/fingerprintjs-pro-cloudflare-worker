import { fetchCacheable, getCacheControlHeaderWithMaxAgeIfLower } from '../utils'

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

export async function handleDownloadScript(request: Request, url: string) {
  const newRequest = new Request(url, new Request(request, { headers: new Headers(request.headers) }))

  console.log(`Downloading script from cdnEndpoint ${url}`)
  const workerCacheTtl = 5 * 60
  const maxMageAge = 60 * 60

  return fetchCacheable(newRequest, workerCacheTtl).then((res) => createResponseWithMaxAge(res, maxMageAge))
}

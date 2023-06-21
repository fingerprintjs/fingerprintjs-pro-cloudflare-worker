import { getCacheControlHeaderWithMaxAgeIfLower } from './getCacheControlHeaderWithMaxAgeIfLower'

export function createResponseWithMaxAge(oldResponse: Response, maxMaxAge: number, maxSMaxAge: number): Response {
  const response = new Response(oldResponse.body, oldResponse)
  const oldCacheControlHeader = oldResponse.headers.get('cache-control')
  if (!oldCacheControlHeader) {
    return response
  }

  const cacheControlHeader = getCacheControlHeaderWithMaxAgeIfLower(oldCacheControlHeader, maxMaxAge, maxSMaxAge)
  response.headers.set('cache-control', cacheControlHeader)
  return response
}

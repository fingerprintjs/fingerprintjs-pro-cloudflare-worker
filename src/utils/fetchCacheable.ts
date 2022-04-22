export async function fetchCacheable(request: Request, ttl: number) {
  return fetch(request, { cf: { cacheTtl: ttl } })
}

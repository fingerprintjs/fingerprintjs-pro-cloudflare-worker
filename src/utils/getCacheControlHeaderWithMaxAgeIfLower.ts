export function getCacheControlHeaderWithMaxAgeIfLower(cacheControlHeaderValue: string, maxMaxAge: number): string {
  const cacheControlDirectives = cacheControlHeaderValue.split(', ')
  const maxAgeIndex = cacheControlDirectives.findIndex(
    (directive) => directive.split('=')[0].trim().toLowerCase() === 'max-age',
  )
  if (maxAgeIndex === -1) {
    cacheControlDirectives.push(`max-age=${maxMaxAge}`)
  } else {
    const oldMaxAge = Number(cacheControlDirectives[maxAgeIndex].split('=')[1])
    const newMaxAge = Math.min(maxMaxAge, oldMaxAge)
    cacheControlDirectives[maxAgeIndex] = `max-age=${newMaxAge}`
  }
  return cacheControlDirectives.join(', ')
}

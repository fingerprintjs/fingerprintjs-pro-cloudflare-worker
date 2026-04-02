export function removeTrailingSlashesAndMultiSlashes(str: string): string {
  return str.replace(/\/+$/, '').replace(/(?<=\/)\/+/, '')
}

export function createRoutePathPrefix(route: string): string {
  // sanity check
  if (!route.startsWith('/')) {
    throw new Error('All route paths must start with a /')
  }

  const normalizedPath = removeTrailingSlashesAndMultiSlashes(route)
  if (!normalizedPath) {
    return '/'
  }
  return normalizedPath
}

/**
 * Removes the specified number of path segments from the URL's path, returning the updated path.
 *
 * @param url the URL with the path to parse.
 * @param segmentCount the number of segments to parse, must be greater than or equal to 0.
 *
 * @return If the input path had at least the expected number of path segments, returns the path with the count of segments removed.
 * Will always start with a /. If the input path did not have the expected number of path segments, returns undefined.
 *
 * @throws {Error} `segmentCount` is less than zero.
 */
export function stripPrefixPathSegments(url: URL, segmentCount: number): string | undefined {
  if (segmentCount < 0) {
    throw new Error('segmentCount must be greater than or equal to 0')
  }

  if (segmentCount === 0) {
    return url.pathname
  }

  if (url.pathname === '/' && segmentCount === 1) {
    // Special case: a path of / has one segment
    return '/'
  }

  const path = url.pathname
  let count = 0
  let inSegment = false
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '/') {
      if (inSegment && count === segmentCount) {
        return path.slice(i)
      }
      inSegment = false
    } else if (!inSegment) {
      inSegment = true
      count++
    }
  }
  return count === segmentCount ? '/' : undefined
}

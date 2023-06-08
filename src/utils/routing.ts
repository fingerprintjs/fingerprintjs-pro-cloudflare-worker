export function removeTrailingSlashesAndMultiSlashes(str: string): string {
  return str.replace(/\/+$/, '').replace(/(?<=\/)\/+/, '')
}

export function addTrailingWildcard(str: string): string {
  return str.replace(/(\/?)\*/g, '($1.*)?')
}

export function replaceDot(str: string): string {
  return str.replace(/\.(?=[\w(])/, '\\.')
}

export function addPathnameMatchBeforeRoute(route: string): string {
  return `[\\/[A-Za-z0-9:._-]*${route}`
}

export function addEndingTrailingSlashToRoute(route: string): string {
  return `${route}\\/*`
}

export function createRoute(route: string): RegExp {
  let routeRegExp = route
  // routeRegExp = addTrailingWildcard(routeRegExp) // Can be uncommented if wildcard (*) is needed
  routeRegExp = removeTrailingSlashesAndMultiSlashes(routeRegExp)
  routeRegExp = addPathnameMatchBeforeRoute(routeRegExp)
  routeRegExp = addEndingTrailingSlashToRoute(routeRegExp)
  // routeRegExp = replaceDot(routeRegExp) // Can be uncommented if dot (.) is needed
  return RegExp(`^${routeRegExp}$`)
}

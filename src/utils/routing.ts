export function removeTrailingSlashesAndMultiSlashes(str: string): string {
  return str.replace(/\/+$/, '').replace(/(?<=\/)\/+/, '')
}

export function addTrailingWildcard(str: string): string {
  return str.replace(/(\/?)\*/g, '($1.*)?')
}

export function replaceDot(str: string): string {
  return str.replace(/\.(?=[\w(])/, '\\.')
}

export function createRoute(route: string): RegExp {
  let routeRegExp = route
  // routeRegExp = addTrailingWildcard(routeRegExp) // Can be uncommented if wildcard (*) is needed
  routeRegExp = removeTrailingSlashesAndMultiSlashes(routeRegExp)
  // routeRegExp = replaceDot(routeRegExp) // Can be uncommented if dot (.) is needed
  return RegExp(`^${routeRegExp}/*$`)
}

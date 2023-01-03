export function removeTrailingSlashes(str: string): string {
  return str.replace(/\/+$/, '')
}

function addTrailingWildcard(str: string): string {
  return str.replace(/(\/?)\*/g, '($1.*)?')
}

function removeTrailingSlashAndDoubleSlash(str: string): string {
  return str.replace(/(\/$)|((?<=\/)\/)/, '')
}

function makeGreedy(str: string): string {
  return str.replace(/(:(\w+)\+)/, '(?<$2>.*)')
}

function replaceNamedParams(str: string): string {
  return str.replace(/:(\w+)(\?)?(\.)?/g, '$2(?<$1>[^/]+)$2$3')
}

function replaceDot(str: string): string {
  return str.replace(/\.(?=[\w(])/, '\\.')
}

export function createRoute(route: string): RegExp {
  let routeRegExp = route
  routeRegExp = addTrailingWildcard(routeRegExp)
  routeRegExp = removeTrailingSlashAndDoubleSlash(routeRegExp)
  routeRegExp = makeGreedy(routeRegExp)
  routeRegExp = replaceNamedParams(routeRegExp)
  routeRegExp = replaceDot(routeRegExp)
  return RegExp(`^${routeRegExp}/*$`)
}

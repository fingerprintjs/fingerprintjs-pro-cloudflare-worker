export const DEFAULT_AGENT_VERSION = '3'
export const DEFAULT_REGION = 'us'

export function getAgentScriptEndpoint(searchParams: URLSearchParams): string {
  const apiKey = searchParams.get('apiKey')
  const apiVersion = searchParams.get('version') || DEFAULT_AGENT_VERSION

  const base = `https://fpcdn.io/v${apiVersion}/${apiKey}`
  const loaderVersion = searchParams.get('loaderVersion')
  const lv = loaderVersion ? `/loader_v${loaderVersion}.js` : ''

  return `${base}${lv}`
}

export function getVisitorIdEndpoint(
  searchParams: URLSearchParams,
  pathSuffix: string | undefined = undefined,
): string {
  const region = searchParams.get('region') || 'us'
  const prefix = region === DEFAULT_REGION ? '' : `${region}.`
  const suffix = pathSuffix ? pathSuffix : ''
  return `https://${prefix}api.fpjs.io${suffix}`
}

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

export function getVisitorIdEndpoint(region: string) {
  const prefix = region === DEFAULT_REGION ? '' : `${region}.`
  return `https://${prefix}api.fpjs.io`
}

import { config } from '../config'

export const DEFAULT_AGENT_VERSION = '3'

export function getAgentScriptEndpoint(searchParams: URLSearchParams): string {
  const apiKey = searchParams.get('apiKey')
  const apiVersion = searchParams.get('version') || DEFAULT_AGENT_VERSION

  const base = `https://${config.fpcdn}/v${apiVersion}/${apiKey}`
  const loaderVersion = searchParams.get('loaderVersion')
  const lv = loaderVersion ? `/loader_v${loaderVersion}.js` : ''

  return `${base}${lv}`
}

export function getVisitorIdEndpoint(
  searchParams: URLSearchParams,
  pathSuffix: string | undefined = undefined
): string {
  const region = searchParams.get('region') || 'us'
  let prefix = ''
  switch (region) {
    case 'eu':
      prefix = 'eu.'
      break
    case 'ap':
      prefix = 'ap.'
      break
    default:
      prefix = ''
      break
  }
  let suffix = pathSuffix ?? ''
  if (suffix.length > 0 && !suffix.startsWith('/')) {
    suffix = '/' + suffix
  }
  return `https://${prefix}${config.ingressApi}${suffix}`
}

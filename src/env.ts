export function getScriptDownloadPath() {
  const scriptDownloadSubpath =
    typeof AGENT_SCRIPT_DOWNLOAD_PATH !== 'undefined' ? AGENT_SCRIPT_DOWNLOAD_PATH : Defaults.AGENT_SCRIPT_DOWNLOAD_PATH
  return `/${ROUTE}/${scriptDownloadSubpath}`
}

export function getVisitorIdPath() {
  const getEndpointSubpath = typeof VISITOR_ID_PATH !== 'undefined' ? VISITOR_ID_PATH : Defaults.VISITOR_ID_PATH
  return `/${ROUTE}/${getEndpointSubpath}`
}

export function getAgentScriptEndpoint(url: URL) {
  const apiKey = url.searchParams.get('apiKey') || Defaults.API_KEY
  const apiVersion = url.searchParams.get('v') || Defaults.AGENT_VERSION

  const base = `https://fpcdn.io/v${apiVersion}/${apiKey}`
  const loaderVersion = url.searchParams.get('lv')
  const lv = loaderVersion ? `/loader_v${loaderVersion}.js` : ''

  return `${base}${lv}?ii=fingerprintjs-cloudflare/${INT_VERSION}/procdn`
}

export function getVisitorIdEndpoint(region: string) {
  const prefix = region === Defaults.REGION ? '' : `${region}.`
  return `https://${prefix}api.fpjs.io?ii=fingerprintjs-cloudflare/${INT_VERSION}/ingress`
}

export const INT_VERSION = '1.0.0-beta'

const Defaults = {
  API_BASE_ROUTE: 'cf-worker',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  VISITOR_ID_PATH: 'visitorId',
  REGION: 'us',
  API_KEY: '',
  AGENT_VERSION: '3',
  LOADER_VERSION: '',
}

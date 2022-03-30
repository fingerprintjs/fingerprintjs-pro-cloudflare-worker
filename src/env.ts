export function getScriptDownloadPath() {
  const scriptDownloadSubpath =
    typeof SCRIPT_DOWNLOAD_ENDPOINT !== 'undefined' ? SCRIPT_DOWNLOAD_ENDPOINT : Defaults.AGENT_SCRIPT_DOWNLOAD_PATH
  return `${API_BASE_ROUTE}${scriptDownloadSubpath}`
}

export function getVisitorIdPath() {
  const getEndpointSubpath =
    typeof GET_VISITOR_ID_ENDPOINT !== 'undefined' ? GET_VISITOR_ID_ENDPOINT : Defaults.VISITOR_ID_PATH
  return `${API_BASE_ROUTE}${getEndpointSubpath}`
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
  API_BASE_ROUTE: '/cf-worker',
  AGENT_SCRIPT_DOWNLOAD_PATH: '/agent',
  VISITOR_ID_PATH: '/visitorId',
  REGION: 'us',
  API_KEY: '',
  AGENT_VERSION: '3',
  LOADER_VERSION: '',
}

const INT_VERSION = '__current_worker_version__'
const HEADER_NAME = 'ii'

function getValueByType(type: 'procdn' | 'ingress'): string {
  return `fingerprintjs-pro-cloudflare/${INT_VERSION}/${type}`
}

export function addTrafficMonitoringSearchParamsForProCDN(url: URL) {
  url.searchParams.append(HEADER_NAME, getValueByType('procdn'))
}

export function addTrafficMonitoringSearchParamsForVisitorIdRequest(url: URL) {
  url.searchParams.append(HEADER_NAME, getValueByType('ingress'))
}

const INT_VERSION = '1.0.0-beta' // todo no hard coding of version
const HEADER_NAME = 'ii'

function getHeaderValue(type: 'procdn' | 'ingress'): string {
  return `fingerprintjs-cloudflare/${INT_VERSION}/${type}`
}

export function addMonitoringHeadersForProCDN(url: URL) {
  url.searchParams.append(HEADER_NAME, getHeaderValue('procdn'))
}

export function addMonitoringHeadersForVisitorIdRequest(url: URL) {
  url.searchParams.append(HEADER_NAME, getHeaderValue('ingress'))
}

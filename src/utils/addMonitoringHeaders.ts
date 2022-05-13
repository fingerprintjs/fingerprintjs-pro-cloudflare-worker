const INT_VERSION = '0.0.2' // todo no hard coding of version
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

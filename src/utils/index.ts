import { getDomainFromHostname } from './getDomainFromHostname'
import { getCacheControlHeaderWithMaxAgeIfLower } from './getCacheControlHeaderWithMaxAgeIfLower'
import { createErrorResponseForIngress, createErrorResponseForProCDN } from './createErrorResponse'
import { fetchCacheable } from './fetchCacheable'
import {
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  addTrafficMonitoringSearchParamsForProCDN,
} from './addTrafficMonitoring'
import { returnHttpResponse } from './returnHttpResponse'
import { addProxyIntegrationHeaders } from './addProxyIntegrationHeaders'
import { getEffectiveTLDPlusOne } from './getEffectiveTLDPlusOne'
import { Cookie, createCookieStringFromObject, createCookieObjectFromHeaderValue, filterCookies } from './cookie'
import { removeTrailingSlashes } from './routing'

export {
  getDomainFromHostname,
  createCookieStringFromObject,
  getCacheControlHeaderWithMaxAgeIfLower,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  addTrafficMonitoringSearchParamsForProCDN,
  createCookieObjectFromHeaderValue,
  createErrorResponseForIngress,
  createErrorResponseForProCDN,
  addProxyIntegrationHeaders,
  getEffectiveTLDPlusOne,
  removeTrailingSlashes,
  returnHttpResponse,
  filterCookies,
  fetchCacheable,
  Cookie,
}

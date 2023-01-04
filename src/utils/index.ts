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
import { createRoute, addTrailingWildcard, removeTrailingSlashesAndMultiSlashes, replaceDot } from './routing'

export {
  createCookieStringFromObject,
  getCacheControlHeaderWithMaxAgeIfLower,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  addTrafficMonitoringSearchParamsForProCDN,
  createCookieObjectFromHeaderValue,
  createErrorResponseForIngress,
  createErrorResponseForProCDN,
  addProxyIntegrationHeaders,
  addTrailingWildcard,
  removeTrailingSlashesAndMultiSlashes,
  replaceDot,
  getEffectiveTLDPlusOne,
  returnHttpResponse,
  filterCookies,
  fetchCacheable,
  createRoute,
  Cookie,
}

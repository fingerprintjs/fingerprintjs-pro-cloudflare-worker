import { getDomainFromHostname } from './getDomainFromHostname'
import { getCacheControlHeaderWithMaxAgeIfLower } from './getCacheControlHeaderWithMaxAgeIfLower'
import { createErrorResponseForIngress, createErrorResponseForProCDN } from './createErrorResponse'
import { fetchCacheable } from './fetchCacheable'
import {
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  addTrafficMonitoringSearchParamsForProCDN,
} from './addTrafficMonitoring'
import { returnHttpResponse } from './returnHttpResponse'
import { Cookie, createCookieStringFromObject, createCookieObjectFromHeaderValue } from './cookie'

export {
  getDomainFromHostname,
  createCookieStringFromObject,
  getCacheControlHeaderWithMaxAgeIfLower,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
  addTrafficMonitoringSearchParamsForProCDN,
  createCookieObjectFromHeaderValue,
  createErrorResponseForIngress,
  createErrorResponseForProCDN,
  returnHttpResponse,
  fetchCacheable,
  Cookie,
}

import {
  addTrafficMonitoringSearchParamsForProCDN,
  addTrafficMonitoringSearchParamsForVisitorIdRequest,
} from '../../src/utils'

const SEARCH_PARAM_NAME = 'ii'

function expectTwoArraysToBeEqual(arr1: Array<unknown>, arr2: Array<unknown>) {
  expect(arr1).toEqual(expect.arrayContaining(arr2))
  expect(arr2).toEqual(expect.arrayContaining(arr1))
}

describe('addTrafficMonitoringSearchParamsForProCDN', () => {
  test('plain domain works', () => {
    const url = new URL('https://fingerprint.com')
    addTrafficMonitoringSearchParamsForProCDN(url)
    expect(url.searchParams.get(SEARCH_PARAM_NAME)).toBe(
      'fingerprintjs-pro-cloudflare/__current_worker_version__/procdn',
    )
  })
  test('works with other query parameters', () => {
    const url = new URL('https://fingerprint.com')
    url.searchParams.append(SEARCH_PARAM_NAME, 'some_other_integration')
    addTrafficMonitoringSearchParamsForProCDN(url)
    url.searchParams.append(SEARCH_PARAM_NAME, 'some_other_integration_2')
    const expected = [
      'some_other_integration',
      'fingerprintjs-pro-cloudflare/__current_worker_version__/procdn',
      'some_other_integration_2',
    ]
    expectTwoArraysToBeEqual(url.searchParams.getAll(SEARCH_PARAM_NAME), expected)
  })
})

describe('addTrafficMonitoringSearchParamsForVisitorIdRequest', () => {
  test('plain domain works', () => {
    const url = new URL('https://fingerprint.com')
    addTrafficMonitoringSearchParamsForVisitorIdRequest(url)
    expect(url.searchParams.get(SEARCH_PARAM_NAME)).toBe(
      'fingerprintjs-pro-cloudflare/__current_worker_version__/ingress',
    )
  })
  test('works with other query parameters', () => {
    const url = new URL('https://fingerprint.com')
    url.searchParams.append(SEARCH_PARAM_NAME, 'some_other_integration')
    addTrafficMonitoringSearchParamsForVisitorIdRequest(url)
    url.searchParams.append(SEARCH_PARAM_NAME, 'some_other_integration_2')
    const expected = [
      'some_other_integration',
      'fingerprintjs-pro-cloudflare/__current_worker_version__/ingress',
      'some_other_integration_2',
    ]
    expectTwoArraysToBeEqual(url.searchParams.getAll(SEARCH_PARAM_NAME), expected)
  })
})

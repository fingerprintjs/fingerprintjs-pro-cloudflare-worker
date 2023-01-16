import { getAgentScriptEndpoint, getVisitorIdEndpoint } from '../../src/utils'

describe('getAgentScriptEndpoint', () => {
  const f = getAgentScriptEndpoint
  const apiKey = 'randomlyGeneratedApiKey'

  test('apiKey exists, version does not exist', () => {
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.set('apiKey', apiKey)
    expect(f(urlSearchParams)).toBe(`https://fpcdn.io/v3/${apiKey}`)
  })
  test('apiKey exists, version exists', () => {
    const version = '4'
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.set('apiKey', apiKey)
    urlSearchParams.set('version', version)
    expect(f(urlSearchParams)).toBe(`https://fpcdn.io/v${version}/${apiKey}`)
  })
  test('apiKey exists, version does not exist, loaderVersion exists', () => {
    const loaderVersion = '3.7.0'
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.set('apiKey', apiKey)
    urlSearchParams.set('loaderVersion', loaderVersion)
    expect(f(urlSearchParams)).toBe(`https://fpcdn.io/v3/${apiKey}/loader_v${loaderVersion}.js`)
  })
  test('apiKey exists, version exists, loaderVersion exists', () => {
    const version = '4'
    const loaderVersion = '3.7.0'
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.set('apiKey', apiKey)
    urlSearchParams.set('version', version)
    urlSearchParams.set('loaderVersion', loaderVersion)
    expect(f(urlSearchParams)).toBe(`https://fpcdn.io/v${version}/${apiKey}/loader_v${loaderVersion}.js`)
  })
})

describe('getVisitorIdEndpoint', () => {
  test('us region', () => {
    expect(getVisitorIdEndpoint('us')).toBe('https://api.fpjs.io')
  })
  test('eu region', () => {
    expect(getVisitorIdEndpoint('eu')).toBe('https://eu.api.fpjs.io')
  })
  test('ap region', () => {
    expect(getVisitorIdEndpoint('ap')).toBe('https://ap.api.fpjs.io')
  })
})

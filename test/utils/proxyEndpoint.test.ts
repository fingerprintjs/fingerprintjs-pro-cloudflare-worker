import { getAgentScriptEndpoint, getVisitorIdEndpoint } from '../../src/utils'

describe('getAgentScriptEndpoint', () => {
  const apiKey = 'generatedApiKey'

  test('apiKey exists, version does not exist', () => {
    const urlSearchParams = new URLSearchParams()
    urlSearchParams.set('apiKey', apiKey)
    expect(getAgentScriptEndpoint(urlSearchParams)).toBe(`https://fpcdn.io/v3/${apiKey}`)
  })
  // todo more tests
})

describe('getVisitorIdEndpoint', () => {
  test('us region', () => {
    expect(getVisitorIdEndpoint('us')).toBe('https://api.fpjs.io')
  })
  // todo more tests
})

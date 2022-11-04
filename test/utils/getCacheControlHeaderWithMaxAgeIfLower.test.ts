import { getCacheControlHeaderWithMaxAgeIfLower } from '../../src/utils'

describe('getCacheControlHeaderWithMaxAgeIfLower', () => {
  const f = getCacheControlHeaderWithMaxAgeIfLower
  test('if maxAge < maxMaxAge then use maxAge', () => {
    expect(f('public, max-age=3600, s-maxage=633059', 1200)).toBe('public, max-age=1200, s-maxage=633059')
  })
  test('if maxAge > maxMaxAge then use maxMaxAge', () => {
    expect(f('public, max-age=3600, s-maxage=633059', 6000)).toBe('public, max-age=3600, s-maxage=633059')
  })
  test('if maxAge is absent then use maxMaxAge', () => {
    expect(f('public', 6000)).toBe('public, max-age=6000')
  })
})

import { getCacheControlHeaderWithMaxAgeIfLower } from '../../src/utils'

describe('getCacheControlHeaderWithMaxAgeIfLower', () => {
  const f = getCacheControlHeaderWithMaxAgeIfLower
  test('if maxAge < maxMaxAge then use maxAge', () => {
    expect(f('public, max-age=3600, s-maxage=633059', 1200, 100)).toBe('public, max-age=1200, s-maxage=100')
  })
  test('if maxAge > maxMaxAge then use maxMaxAge', () => {
    expect(f('public, max-age=3600, s-maxage=633059', 6000, 100)).toBe('public, max-age=3600, s-maxage=100')
  })
  test('if maxAge is absent then use maxMaxAge', () => {
    expect(f('public', 6000, 100)).toBe('public, max-age=6000, s-maxage=60')
  })
  test('if s-maxAge < maxSMaxAge then use maxSMaxAge', () => {
    expect(f('public, max-age=3600, s-maxage=3600', 1200, 1200)).toBe('public, max-age=1200, s-maxage=1200')
  })
  test('if s-maxAge > maxMaxAge then use s-MaxAge', () => {
    expect(f('public, max-age=3600, s-maxage=3600', 6000, 6000)).toBe('public, max-age=3600, s-maxage=3600')
  })
  test('if s-maxAge is absent then use maxSMaxAge', () => {
    expect(f('public', 6000, 6000)).toBe('public, max-age=6000, s-maxage=6000')
  })
})

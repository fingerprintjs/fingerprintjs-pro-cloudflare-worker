import { removeTrailingSlashes } from '../../src/utils'

describe('removeTrailingSlashes', () => {
  it('returns /path for /path', () => {
    expect(removeTrailingSlashes('/path')).toBe('/path')
  })
  it('returns /path for /path/', () => {
    expect(removeTrailingSlashes('/path/')).toBe('/path')
  })
  it('returns /path for /path//////', () => {
    expect(removeTrailingSlashes('/path//////')).toBe('/path')
  })
  it('returns /path/path2 for /path/path2', () => {
    expect(removeTrailingSlashes('/path/path2')).toBe('/path/path2')
  })
  it('returns /path/path2 for /path/path2/', () => {
    expect(removeTrailingSlashes('/path/path2/')).toBe('/path/path2')
  })
  it('returns /path/path2 for /path/path2//', () => {
    expect(removeTrailingSlashes('/path/path2//')).toBe('/path/path2')
  })
  it('returns /path//path2/path3 for /path//path2/path3/', () => {
    expect(removeTrailingSlashes('/path//path2/path3/')).toBe('/path//path2/path3')
  })
  it('returns empty string for empty string ', () => {
    expect(removeTrailingSlashes('')).toBe('')
  })
})

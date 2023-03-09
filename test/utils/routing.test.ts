import { removeTrailingSlashesAndMultiSlashes, addTrailingWildcard, replaceDot } from '../../src/utils'

describe('removeTrailingSlashesAndMultiSlashes', () => {
  it('returns /path for /path', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path')).toBe('/path')
  })
  it('returns /path for /path/', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path/')).toBe('/path')
  })
  it('returns /path for /path//////', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path//////')).toBe('/path')
  })
  it('returns /path/path2 for /path/path2', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path/path2')).toBe('/path/path2')
  })
  it('returns /path/path2 for /path/path2/', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path/path2/')).toBe('/path/path2')
  })
  it('returns /path/path2 for /path/path2//', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path/path2//')).toBe('/path/path2')
  })
  it('returns /path/path2/path3 for /path//path2/path3/', () => {
    expect(removeTrailingSlashesAndMultiSlashes('/path//path2/path3/')).toBe('/path/path2/path3')
  })
  it('returns /path for ///path', () => {
    expect(removeTrailingSlashesAndMultiSlashes('///path')).toBe('/path')
  })
  it('returns empty string for empty string', () => {
    expect(removeTrailingSlashesAndMultiSlashes('')).toBe('')
  })
})

describe('addTrailingWildcard', () => {
  it('returns /a for /a', () => {
    expect(addTrailingWildcard('/a')).toBe('/a')
  })
  it('returns /a(/.*)? for /a/*', () => {
    expect(addTrailingWildcard('/a/*')).toBe('/a(/.*)?')
  })
  it('returns /a/b(.*)? for /a/b*', () => {
    expect(addTrailingWildcard('/a/b*')).toBe('/a/b(.*)?')
  })
  it('returns empty string for empty string', () => {
    expect(addTrailingWildcard('')).toBe('')
  })
})

describe('replaceDot', () => {
  it('returns /a for /a', () => {
    expect(replaceDot('/a')).toBe('/a')
  })
  it('returns /a\\.b/c for /a.b/c', () => {
    expect(replaceDot('/a.b/c')).toBe('/a\\.b/c')
  })
  it('returns /a/b. for /a/b.', () => {
    expect(replaceDot('/a/b.')).toBe('/a/b.')
  })
  it('returns empty string for empty string', () => {
    expect(replaceDot('')).toBe('')
  })
})

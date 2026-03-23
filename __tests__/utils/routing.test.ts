import { describe, it, expect } from 'vitest'
import { removeTrailingSlashesAndMultiSlashes } from '../../src/utils'
import { createRoutePathPrefix, stripPrefixPathSegments } from '../../src/utils/routing'

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

describe('createRoutePathPrefix', () => {
  it('throws for an invalid route', () => {
    expect(() => {
      createRoutePathPrefix('missingSlash')
    }).toThrow()
  })

  it('removes duplicated start slashes', () => {
    expect(createRoutePathPrefix('//')).toBe('/')
  })
})

describe('stripPrefixPathSegments', () => {
  it.each([0, -1])('throws if segmentCount is %i', (segmentCount) => {
    expect(() => stripPrefixPathSegments(new URL('https://example.com/a/b'), segmentCount)).toThrow(
      'segmentCount must be greater than 0'
    )
  })

  it.each([
    [1, 'https://example.com/prefix/path', '/path'],
    [1, 'https://example.com/prefix', '/'],
    [1, 'https://example.com/prefix/', '/'],
    [2, 'https://example.com/a/b/c', '/c'],
    [2, 'https://example.com/a/b/c/', '/c/'],
    [2, 'https://example.com/a/b', '/'],
    [2, 'https://example.com/a/b/', '/'],
    [1, 'https://example.com/prefix/foo/bar/baz', '/foo/bar/baz'],
    [1, 'https://example.com/prefix/foo/bar/baz/', '/foo/bar/baz/'],
    [1, 'https://example.com/prefix/path?foo=bar#section', '/path'],
    [1, 'https://example.com', '/'],
  ])('strips %i segment(s) from %s, returning %s', (segmentCount, url, expected) => {
    expect(stripPrefixPathSegments(new URL(url), segmentCount)).toBe(expected)
  })

  it.each([
    ['https://example.com/a', 2],
    ['https://example.com/', 2],
  ])('returns undefined when %s does not have enough segments for count %i', (url, segmentCount) => {
    expect(stripPrefixPathSegments(new URL(url), segmentCount)).toBeUndefined()
  })
})

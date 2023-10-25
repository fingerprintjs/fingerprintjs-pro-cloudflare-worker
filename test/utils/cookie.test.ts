import { filterCookies } from '../../src/utils'

describe('filterCookies', () => {
  it('works when there is no cookie', () => {
    const headers = new Headers()
    headers.set('x', 'y')
    const resultHeaders = filterCookies(headers, (key) => key === 'a')
    expect(resultHeaders.get('cookie')).toBe(null)
    expect(resultHeaders.get('x')).toBe('y')
  })
  it('removes other keys', () => {
    const headers = new Headers()
    headers.set('cookie', 'a=1; b=2')
    const resultHeaders = filterCookies(headers, (key) => key === 'a')
    expect(resultHeaders.get('cookie')).toBe('a=1')
  })
  it('removes other keys when no match', () => {
    const headers = new Headers()
    headers.set('cookie', 'a=1; b=2')
    headers.set('authentication', 'basic YWRtaW46MTIzNDU2')
    headers.set('x-custom-header', 'foo_bar')
    const resultHeaders = filterCookies(headers, (key) => key === 'c')
    expect(resultHeaders.get('cookie')).toBe(null)
    expect(resultHeaders.get('authentication')).toBe('basic YWRtaW46MTIzNDU2')
    expect(resultHeaders.get('x-custom-header')).toBe('foo_bar')
  })
  it('works for _iidt', () => {
    const headers = new Headers()
    const _iidtCookieValue =
      'jF5EK63pIrQofJ2za7GCbkn+Wy35Qmf2TLAih50+S2fNq86nv9wPH/aOuY7Xkcv1GUIKB1ky2aYT1ilQKoHHZW2tWA=='
    headers.set('cookie', `x=y; _iidt=${_iidtCookieValue}; b=2`)
    const resultHeaders = filterCookies(headers, (key) => key === '_iidt')
    expect(resultHeaders.get('cookie')).toBe(`_iidt=${_iidtCookieValue}`)
  })
})

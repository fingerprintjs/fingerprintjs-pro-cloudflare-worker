import { parse } from 'cookie'

export function filterCookies(headers: Headers, filterFunc: (key: string) => boolean): Headers {
  const newHeaders = new Headers(headers)
  const cookie = parse(headers.get('cookie') || '')
  const filteredCookieList = []
  for (const cookieName in cookie) {
    if (filterFunc(cookieName)) {
      filteredCookieList.push(`${cookieName}=${cookie[cookieName]}`)
    }
  }
  newHeaders.delete('cookie')
  if (filteredCookieList.length > 0) {
    newHeaders.set('cookie', filteredCookieList.join('; '))
  }

  return newHeaders
}

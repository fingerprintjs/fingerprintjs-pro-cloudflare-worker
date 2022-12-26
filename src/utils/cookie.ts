import { parse } from 'cookie'

export type Cookie = {
  value: string
  [key: string]: string | undefined
}

export function createCookieObjectFromHeaderValue(cookieValue: string): [string, Cookie] {
  let cookieName: string = ''
  const cookieObject: Cookie = cookieValue.split('; ').reduce(
    (prev: Cookie, flag: string, index: number) => {
      const equalSignIndex = flag.indexOf('=')
      if (equalSignIndex === -1) {
        return { ...prev, [flag]: undefined }
      }
      const key = flag.slice(0, equalSignIndex)
      const value = flag.slice(equalSignIndex + 1, flag.length)
      if (index === 0) {
        cookieName = key
        return { ...prev, value }
      }

      return { ...prev, [key]: value }
    },
    { value: '' },
  )

  return [cookieName, cookieObject]
}

export function createCookieStringFromObject(name: string, cookie: Cookie) {
  const result: string[] = [`${name}=${cookie.value}`]
  for (const key in cookie) {
    if (key === name || key === 'value') {
      continue
    }
    const flagValue = cookie[key]
    const flag = flagValue ? `${key}=${flagValue}` : key
    result.push(flag)
  }
  return result.join('; ')
}

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

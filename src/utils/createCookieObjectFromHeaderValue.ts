import { Cookie } from './cookie'

export function createCookieObjectFromHeaderValue(cookieValue: string): [string, Cookie] {
  let cookieName: string = ''
  const cookieObject: Cookie = cookieValue.split('; ').reduce(
    (prev: Cookie, flag: string, index: number) => {
      const kv = flag.split('=')
      const key = index === 0 ? 'value' : kv[0]
      if (index === 0) {
        cookieName = kv[0]
      }
      const value = kv[1]
      return { ...prev, [key]: value }
    },
    { value: '' },
  )

  return [cookieName, cookieObject]
}

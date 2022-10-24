export type Cookie = {
  value: string
  [key: string]: string
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
  const flags = Object.entries(cookie).filter(([k]) => k !== name && k !== 'value')
  const nameValue = `${name}=${cookie.value}`
  const rest = flags.map(([k, v]) => (v ? `${k}=${v}` : k))
  return [nameValue, ...rest].join('; ')
}

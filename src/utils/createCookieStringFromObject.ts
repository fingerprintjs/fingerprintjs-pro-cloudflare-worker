import { Cookie } from './cookie'

export function createCookieStringFromObject(name: string, value: Cookie) {
  const flags = Object.entries(value).filter(([k]) => k !== name && k !== 'value')
  const nameValue = `${name}=${value.value}`
  const rest = flags.map(([k, v]) => (v ? `${k}=${v}` : k))
  return [nameValue, ...rest].join('; ')
}

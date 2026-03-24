/**
 * Checks if the specified HTTP method is safe, according to [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-safe-methods)
 *
 * @param method the HTTP method of the
 * @returns
 */
export function isMethodSafe(method: string): boolean {
  switch (method) {
    case 'GET':
    case 'HEAD':
    case 'OPTIONS':
    case 'TRACE':
      return true
    default:
      return false
  }
}

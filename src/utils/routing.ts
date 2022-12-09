export function removeTrailingSlashes(str: string): string {
  return str.replace(/\/+$/, '')
}

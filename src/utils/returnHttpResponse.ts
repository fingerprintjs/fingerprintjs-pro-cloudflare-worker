export function returnHttpResponse(oldResponse: Response): Response {
  oldResponse.headers.delete('Strict-Transport-Security')
  return oldResponse
}

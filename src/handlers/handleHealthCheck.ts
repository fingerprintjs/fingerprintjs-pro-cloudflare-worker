export function handleHealthCheck() {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')

  const body = {
    success: true,
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: 'OK',
    headers,
  })
}

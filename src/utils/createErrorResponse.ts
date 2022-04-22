export function createErrorResponse(error: string | Error | unknown) {
  let reason
  try {
    reason = typeof error === 'string' ? error : error instanceof Error ? error.message : String(error)
  } catch (e) {
    reason = 'unknown'
  }
  const responseBody = {
    message: 'An error occurred with Cloudflare worker.',
    reason,
  }
  return new Response(JSON.stringify(responseBody), { status: 500 }) // todo standard error for js client
}

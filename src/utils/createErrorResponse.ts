export interface Response {
  v: '2'
  notifications?: Notification[]
  requestId: string
  error?: ErrorData
  products: {}
}

export interface Notification {
  level: 'info' | 'warning' | 'error'
  message: string
}

export interface ErrorData {
  code?: 'Failed'
  message: string
}

function errorToString(error: string | Error | unknown): string {
  try {
    return typeof error === 'string' ? error : error instanceof Error ? error.message : String(error)
  } catch (e) {
    return 'unknown'
  }
}

function generateRandomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function generateRequestUniqueId(): string {
  return generateRandomString(2)
}

function generateRequestId(): string {
  const uniqueId = generateRequestUniqueId()
  const now = new Date().getTime()
  return `${now}.cfi-${uniqueId}`
}

export function createErrorResponse(error: string | Error | unknown) {
  const reason = errorToString(error)
  const errorBody: ErrorData = {
    code: 'Failed',
    message: `An error occurred with Cloudflare worker. Reason: ${reason}`,
  }
  const responseBody: Response = {
    v: '2',
    error: errorBody,
    requestId: generateRequestId(),
    products: {},
  }
  return new Response(JSON.stringify(responseBody), { status: 500 })
}

import { createErrorResponse } from '../../src/utils'
import { FPJSResponse } from '../../src/utils/createErrorResponse'

describe('createErrorResponse', () => {
  let response: Response
  beforeEach(() => {
    const req = new Request('https://example.com', { headers: { origin: 'https://some-website.com' } })
    const errorReason = 'some error message'
    response = createErrorResponse(req, errorReason)
  })
  test('response body is as expected', async () => {
    expect(response.body).not.toBeNull()
    if (response.body == null) {
      return
    }
    const bodyReader = response.body.getReader()
    await bodyReader.read().then((body) => {
      if (body.value == null) {
        return
      }
      const bodyString = Array.from(body.value)
        .map((el) => String.fromCharCode(el))
        .join('')
      const errorData = JSON.parse(bodyString) as FPJSResponse
      expect(errorData.v).toBe('2')
      expect(errorData.error).not.toBeNull()
      expect(errorData.error?.code).toBe('Failed')
      expect(errorData.error?.message).toBe(`An error occurred with Cloudflare worker. Reason: some error message`)
      expect(errorData.requestId).toMatch(/^\d{13}\.cfi-[a-zA-Z\d]{2}$/)
      expect(errorData.products).toStrictEqual({})
    })
  })
  test('response headers are as expected', () => {
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://some-website.com')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
  test('response status is as expected', () => {
    expect(response.status).toBe(500)
  })
  test('response headers are as expected when origin is not found', () => {
    const reqWithNoOrigin = new Request('https://example.com')
    const errorReason = 'some error'
    const response = createErrorResponse(reqWithNoOrigin, errorReason)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('')
  })
  test('handles error type error messages correctly', async () => {
    const reqWithNoOrigin = new Request('https://example.com')
    const errorReason = new Error('some error message')
    const response = createErrorResponse(reqWithNoOrigin, errorReason)
    if (response.body == null) {
      return
    }
    const bodyReader = response.body.getReader()
    await bodyReader.read().then((body) => {
      if (body.value == null) {
        return
      }
      const bodyString = Array.from(body.value)
        .map((el) => String.fromCharCode(el))
        .join('')
      const errorData = JSON.parse(bodyString) as FPJSResponse
      expect(errorData.error).not.toBeNull()
      expect(errorData.error?.code).toBe('Failed')
      expect(errorData.error?.message).toBe('An error occurred with Cloudflare worker. Reason: some error message')
    })
  })
  test('handles unknown type error messages correctly', async () => {
    const reqWithNoOrigin = new Request('https://example.com')
    const errorReason = { toString: null }
    const response = createErrorResponse(reqWithNoOrigin, errorReason)
    if (response.body == null) {
      return
    }
    const bodyReader = response.body.getReader()
    await bodyReader.read().then((body) => {
      if (body.value == null) {
        return
      }
      const bodyString = Array.from(body.value)
        .map((el) => String.fromCharCode(el))
        .join('')
      const errorData = JSON.parse(bodyString) as FPJSResponse
      expect(errorData.error).not.toBeNull()
      expect(errorData.error?.code).toBe('Failed')
      expect(errorData.error?.message).toBe('An error occurred with Cloudflare worker. Reason: unknown')
    })
  })
})

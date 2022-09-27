import { returnHttpResponse } from '../../src/utils'

describe('test returnHttpResponse function', () => {
  it('remove correct header', () => {
    const headers = new Headers()
    headers.append('Content-Type', 'image/jpeg')
    headers.append('Set-Cookie', 'name=hello')
    headers.append('Set-Cookie', 'name=world')
    headers.append('Strict-Transport-Security', 'need to remove')
    const response = new Response(null, { headers })
    const filteredResponse = returnHttpResponse(response)
    expect(filteredResponse.headers.get('Content-Type')).toBe('image/jpeg')
    expect(filteredResponse.headers.get('Set-Cookie')).toBe('name=hello, name=world')
    expect(filteredResponse.headers.get('Strict-Transport-Security')).toBeNull()
  })
})

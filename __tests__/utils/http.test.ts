import { describe, test, expect } from 'vitest'
import { isMethodSafe } from '../../src/utils/http'

describe('isMethodSafe', () => {
  test.each(['GET', 'HEAD', 'TRACE', 'OPTIONS'])('is safe - %s', (method) => {
    expect(isMethodSafe(method)).toBeTruthy()
  })

  test.each(['PUT', 'POST', 'DELETE', 'PATCH', 'get', 'head'])('is not safe - %s', (method) => {
    expect(isMethodSafe(method)).toBeFalsy()
  })
})

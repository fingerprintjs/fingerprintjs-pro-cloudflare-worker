import { createCookieObjectFromHeaderValue, Cookie, createCookieStringFromObject } from '../../src/utils'

const alphanumericString = 'abcdefghijklmnopqrstuvwxyz'
const alphanumericStringCapital = alphanumericString.toUpperCase()
const validCookieNameChars = `${alphanumericString}${alphanumericStringCapital}!#$%&'*+-.^_\`|~`
const validCookieValueChars = `${alphanumericString}${alphanumericStringCapital}!#$%&'()*+-./:<=>?@[]^_\`{|}~`

describe('createCookieObjectFromHeaderValue', () => {
  const f = createCookieObjectFromHeaderValue
  it('returns an array with name and cookie for key=value', () => {
    expect(f('key=value')).toStrictEqual<[string, Cookie]>(['key', { value: 'value' }])
  })
  it('returns an array with name and cookie for key=value=with=equal=sign', () => {
    expect(f('key=value=with=equal=sign')).toStrictEqual<[string, Cookie]>(['key', { value: 'value=with=equal=sign' }])
  })
  it('returns an array with name and cookie for keyWithAllValidChars=valueWithAllValidChars', () => {
    expect(f(`${validCookieNameChars}=${validCookieValueChars}`)).toStrictEqual<[string, Cookie]>([
      validCookieNameChars,
      { value: validCookieValueChars },
    ])
  })
  it('returns an array with name and cookie for key=value; flagKey=flagValue', () => {
    expect(f('key=value; flagKey=flagValue')).toStrictEqual<[string, Cookie]>([
      'key',
      { value: 'value', flagKey: 'flagValue' },
    ])
  })
  it('returns an array with name and cookie for key=value; flagValue', () => {
    expect(f('key=value; flagValue')).toStrictEqual<[string, Cookie]>(['key', { value: 'value', flagValue: undefined }])
  })
  it('returns an array with name and cookie for key=value; flagValue; flagKey2=flagValue2', () => {
    expect(f('key=value; flagValue; flagKey2=flagValue2')).toStrictEqual<[string, Cookie]>([
      'key',
      {
        value: 'value',
        flagValue: undefined,
        flagKey2: 'flagValue2',
      },
    ])
  })
  it('returns an array with name and cookie for key=value; flagValue; flagKey2=flagValue2; flagValue3', () => {
    expect(f('key=value; flagValue; flagKey2=flagValue2; flagValue3')).toStrictEqual<[string, Cookie]>([
      'key',
      {
        value: 'value',
        flagValue: undefined,
        flagKey2: 'flagValue2',
        flagValue3: undefined,
      },
    ])
  })
  it('returns an array with name and cookie for key=value; flagKey=flagValue; flagKey2=flagValue2; flagValue3', () => {
    expect(f('key=value; flagKey=flagValue; flagKey2=flagValue2; flagValue3')).toStrictEqual<[string, Cookie]>([
      'key',
      {
        value: 'value',
        flagKey: 'flagValue',
        flagKey2: 'flagValue2',
        flagValue3: undefined,
      },
    ])
  })
})

describe('createCookieStringFromObject', () => {
  const f = createCookieStringFromObject
  it("returns a cookie string for ['key', {value: 'value'}]", () => {
    expect(f('key', { value: 'value' })).toBe('key=value')
  })
  it("returns a cookie string for ['key', {value: 'value=with=equal=sign'}]", () => {
    expect(f('key', { value: 'value=with=equal=sign' })).toBe('key=value=with=equal=sign')
  })
  it('returns a cookie string for [validCookieNameChars, { value: validCookieValueChars }]', () => {
    expect(f(validCookieNameChars, { value: validCookieValueChars })).toBe(
      `${validCookieNameChars}=${validCookieValueChars}`,
    )
  })
  it("returns a cookie string for ['key', { value: 'value', flagKey: 'flagValue', }]", () => {
    expect(f('key', { value: 'value', flagKey: 'flagValue' })).toBe('key=value; flagKey=flagValue')
  })
  it("returns a cookie string for ['key', { value: 'value', flagValue: undefined }]", () => {
    expect(f('key', { value: 'value', flagValue: undefined })).toBe('key=value; flagValue')
  })
  it("returns a cookie string for 'key', { value: 'value', flagValue: undefined, flagKey2: 'flagValue2' }", () => {
    expect(f('key', { value: 'value', flagValue: undefined, flagKey2: 'flagValue2' })).toBe(
      'key=value; flagValue; flagKey2=flagValue2',
    )
  })
  it("returns a cookie string for 'key', { value: 'value', flagValue: undefined, flagKey2: 'flagValue2', flagValue3: undefined }", () => {
    expect(f('key', { value: 'value', flagValue: undefined, flagKey2: 'flagValue2', flagValue3: undefined })).toBe(
      'key=value; flagValue; flagKey2=flagValue2; flagValue3',
    )
  })
  it("returns a cookie string for 'key', { value: 'value', flagKey: 'flagValue', flagKey2: 'flagValue2', flagValue3: undefined }", () => {
    expect(f('key', { value: 'value', flagKey: 'flagValue', flagKey2: 'flagValue2', flagValue3: undefined })).toBe(
      'key=value; flagKey=flagValue; flagKey2=flagValue2; flagValue3',
    )
  })
})

describe('createCookieObjectFromHeaderValue and createCookieStringFromObject together', () => {
  it('returns the same string for key=value', () => {
    const cookieString = 'key=value'
    expect(createCookieStringFromObject(...createCookieObjectFromHeaderValue(cookieString))).toBe(cookieString)
  })
  it('returns the same string for key=value; flagValue', () => {
    const cookieString = 'key=value; flagValue'
    const [name, cookie] = createCookieObjectFromHeaderValue(cookieString)
    expect(createCookieStringFromObject(name, cookie)).toBe(cookieString)
  })
  it('returns the same string for sample cookie', () => {
    const cookieString =
      '_iidt=jF5EK63pIrQofJ2za7GCbkn+Wy35Qmf2TLAih50+S2fNq86nv9wPH/aOuY7Xkcv1GUIKB1ky2aYT1ilQKoHHZW2tWA==; Path=/; Domain=fpjs.io; Expires=Tue, 24 Oct 2023 08:31:07 GMT; HttpOnly; Secure; SameSite=None'
    expect(createCookieStringFromObject(...createCookieObjectFromHeaderValue(cookieString))).toBe(cookieString)
  })
})

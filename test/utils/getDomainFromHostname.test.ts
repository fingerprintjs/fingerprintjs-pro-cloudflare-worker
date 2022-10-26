import { getDomainFromHostname } from '../../src/utils'

describe('getDomainFromHostname', () => {
  test('empty string returns empty string', () => {
    expect(getDomainFromHostname('')).toBe('')
  })
  test('example.com returns example.com', () => {
    expect(getDomainFromHostname('example.com')).toBe('example.com')
  })
  test('sub.example.com returns example.com', () => {
    expect(getDomainFromHostname('sub.example.com')).toBe('example.com')
  })
  test('sub2.sub.example.com returns example.com', () => {
    expect(getDomainFromHostname('sub2.sub.example.com')).toBe('example.com')
  })
  test('dev.fingerprint.com returns fingerprint.com', () => {
    expect(getDomainFromHostname('dev.fingerprint.com')).toBe('fingerprint.com')
  })
  test('611.to returns 611.to', () => {
    expect(getDomainFromHostname('611.to')).toBe('611.to')
  })
  test('domain.611.to returns sub.611.to', () => {
    expect(getDomainFromHostname('domain.611.to')).toBe('domain.611.to')
  })
  test('sub2.domain.611.to returns sub2.domain.611.to', () => {
    expect(getDomainFromHostname('sub2.domain.611.to')).toBe('domain.611.to')
  })
  test('com returns com', () => {
    expect(getDomainFromHostname('com')).toBe('com')
  })
  test('sørfold.no returns sørfold.no', () => {
    expect(getDomainFromHostname('sørfold.no')).toBe('sørfold.no')
  })
  test('example.sørfold.no returns example.sørfold.no', () => {
    expect(getDomainFromHostname('example.sørfold.no')).toBe('example.sørfold.no')
  })
  test('sub.example.sørfold.no returns example.sørfold.no', () => {
    expect(getDomainFromHostname('sub.example.sørfold.no')).toBe('example.sørfold.no')
  })
  test('クラウド returns クラウド', () => {
    expect(getDomainFromHostname('クラウド')).toBe('クラウド')
  })
  test('クラウドクラウド.クラウド returns クラウドクラウド.クラウド', () => {
    expect(getDomainFromHostname('クラウドクラウド.クラウド')).toBe('クラウドクラウド.クラウド')
  })
  test('クラウド.クラウドクラウド.クラウド returns クラウドクラウド.クラウド', () => {
    expect(getDomainFromHostname('クラウド.クラウドクラウド.クラウド')).toBe('クラウドクラウド.クラウド')
  })
  test('москва returns москва', () => {
    expect(getDomainFromHostname('москва')).toBe('москва')
  })
  test('м.москва returns м.москва', () => {
    expect(getDomainFromHostname('м.москва')).toBe('м.москва')
  })
  test('мо.сква.москва returns сква.москва', () => {
    expect(getDomainFromHostname('мо.сква.москва')).toBe('сква.москва')
  })
  test('삼성 returns 삼성', () => {
    expect(getDomainFromHostname('삼성')).toBe('삼성')
  })
  test('삼.삼성 returns 삼.삼성', () => {
    expect(getDomainFromHostname('삼.삼성')).toBe('삼.삼성')
  })
  test('삼.성.삼성 returns 성.삼성', () => {
    expect(getDomainFromHostname('삼.성.삼성')).toBe('성.삼성')
  })
  test('بارت returns بارت', () => {
    expect(getDomainFromHostname('بارت')).toBe('بارت')
  })
  test('بارتبارت.بارت returns بارتبارت.بارت', () => {
    expect(getDomainFromHostname('بارتبارت.بارت')).toBe('بارتبارت.بارت')
  })
  test('بارتبارت.بارت returns بارتبارتبارت.بارتبارت.بارت', () => {
    expect(getDomainFromHostname('بارتبارتبارت.بارتبارت.بارت')).toBe('بارتبارت.بارت')
  })
})

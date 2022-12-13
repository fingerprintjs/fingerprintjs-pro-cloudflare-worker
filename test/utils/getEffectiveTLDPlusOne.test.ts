import { getEffectiveTLDPlusOne } from '../../src/utils'

const cases = [
  // Empty input
  ['', ''],
  // Unlisted TLD.
  ['example', ''],
  ['example.example', 'example.example'],
  ['b.example.example', 'example.example'],
  ['a.b.example.example', 'example.example'],
  // TLD with only 1 rule.
  ['biz', ''],
  ['domain.biz', 'domain.biz'],
  ['b.domain.biz', 'domain.biz'],
  ['a.b.domain.biz', 'domain.biz'],
  // TLD with some 2-level rules.
  ['com', ''],
  ['example.com', 'example.com'],
  ['b.example.com', 'example.com'],
  ['a.b.example.com', 'example.com'],
  ['uk.com', ''],
  ['example.uk.com', 'example.uk.com'],
  ['b.example.uk.com', 'example.uk.com'],
  ['a.b.example.uk.com', 'example.uk.com'],
  ['test.ac', 'test.ac'],
  // TLD with only 1 (wildcard) rule.
  ['mm', ''],
  ['c.mm', ''],
  ['b.c.mm', 'b.c.mm'],
  ['a.b.c.mm', 'b.c.mm'],
  // More complex TLD.
  ['jp', ''],
  ['test.jp', 'test.jp'],
  ['www.test.jp', 'test.jp'],
  ['ac.jp', ''],
  ['test.ac.jp', 'test.ac.jp'],
  ['www.test.ac.jp', 'test.ac.jp'],
  ['kyoto.jp', ''],
  ['test.kyoto.jp', 'test.kyoto.jp'],
  ['ide.kyoto.jp', ''],
  ['b.ide.kyoto.jp', 'b.ide.kyoto.jp'],
  ['a.b.ide.kyoto.jp', 'b.ide.kyoto.jp'],
  ['c.kobe.jp', ''],
  ['b.c.kobe.jp', 'b.c.kobe.jp'],
  ['a.b.c.kobe.jp', 'b.c.kobe.jp'],
  ['city.kobe.jp', 'city.kobe.jp'],
  ['www.city.kobe.jp', 'city.kobe.jp'],
  // TLD with a wildcard rule and exceptions.
  ['ck', ''],
  ['test.ck', ''],
  ['b.test.ck', 'b.test.ck'],
  ['a.b.test.ck', 'b.test.ck'],
  ['www.ck', 'www.ck'],
  ['www.www.ck', 'www.ck'],
  // US K1.
  ['us', ''],
  ['test.us', 'test.us'],
  ['www.test.us', 'test.us'],
  ['ak.us', ''],
  ['test.ak.us', 'test.ak.us'],
  ['www.test.ak.us', 'test.ak.us'],
  ['k12.ak.us', ''],
  ['test.k12.ak.us', 'test.k12.ak.us'],
  ['www.test.k12.ak.us', 'test.k12.ak.us'],
  // Punycoded IDN labels
  ['xn--85x722f.com.cn', 'xn--85x722f.com.cn'],
  ['xn--85x722f.xn--55qx5d.cn', 'xn--85x722f.xn--55qx5d.cn'],
  ['www.xn--85x722f.xn--55qx5d.cn', 'xn--85x722f.xn--55qx5d.cn'],
  ['shishi.xn--55qx5d.cn', 'shishi.xn--55qx5d.cn'],
  ['xn--55qx5d.cn', ''],
  ['xn--85x722f.xn--fiqs8s', 'xn--85x722f.xn--fiqs8s'],
  ['www.xn--85x722f.xn--fiqs8s', 'xn--85x722f.xn--fiqs8s'],
  ['shishi.xn--fiqs8s', 'shishi.xn--fiqs8s'],
  ['xn--fiqs8s', ''],

  // Invalid input
  ['.', ''],
  ['de.', ''],
  ['.de', ''],
  ['.com.au', ''],
  ['com.au.', ''],
  ['com..au', ''],
]

const runTest = (param: string, expected: string) => {
  const messageParam = param.length === 0 ? 'empty string' : param
  const messageExpected = expected.length === 0 ? 'empty string' : expected
  test(`${messageParam} returns ${messageExpected}`, () => expect(getEffectiveTLDPlusOne(param)).toBe(expected))
}

describe('getEffectiveTLDPlusOne', () => {
  for (const [param, expected] of cases) {
    runTest(param, expected)
  }
})

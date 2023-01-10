import domainSuffixListReversed from './domain-suffix-list-reversed.json'
import * as Punycode from 'punycode/'

type Rule = {
  rule: string
  suffix: string
  wildcard: boolean
  exception: boolean
}

type ParsedResult = {
  input: string
  tld: string | null
  sld: string | null
  domain: string | null
  subdomain: string | null
  listed: boolean
}

type TrieNode = {
  key: string
  parent: TrieNode | null
  children: Map<string, TrieNode>
  suffix: string
  end: boolean
}

const trie = createTrie()
const cache = new Map<string, Rule>()

function createTrie(): TrieNode {
  const root: TrieNode = {
    key: '',
    parent: null,
    children: new Map(),
    suffix: '',
    end: false,
  }
  for (const rule of domainSuffixListReversed) {
    const word = rule.reversed + '.'
    let node = root
    for (let i = 0; i < word.length; i++) {
      if (!node.children.has(word[i])) {
        node.children.set(word[i], {
          key: word[i],
          suffix: '',
          parent: node,
          children: new Map(),
          end: false,
        })
      }

      node = node.children.get(word[i])!

      if (i === word.length - 1 || i === word.length - 2) {
        node.suffix = rule.suffix
        node.end = true
      }
    }
  }
  return root
}

function search(domain: string): string | null {
  let node = trie

  for (let i = 0; i < domain.length; i++) {
    if (node.children.has(domain[i])) {
      node = node.children.get(domain[i])!
    } else {
      return node.end ? node.suffix : null
    }
  }
  return node.end ? node.suffix : null
}

function reverse(str: string): string {
  let newStr = ''
  for (let i = str.length - 1; i >= 0; i--) {
    newStr += str[i]
  }
  return newStr
}

function findRule(domain: string): Rule | null {
  if (cache.has(domain)) {
    return cache.get(domain)!
  }
  const punyDomain = Punycode.toASCII(domain)
  let foundRule: Rule | null = null

  const domainReversed = reverse(punyDomain)
  const rule = search(domainReversed)
  if (!rule) {
    return null
  }
  const suffix = rule.replace(/^(\*\.|!)/, '')
  const wildcard = rule.charAt(0) === '*'
  const exception = rule.charAt(0) === '!'
  foundRule = { rule, suffix, wildcard, exception }
  cache.set(domain, foundRule)
  return foundRule
}

const errorCodes: { [key: string]: string } = {
  DOMAIN_TOO_SHORT: 'Domain name too short.',
  DOMAIN_TOO_LONG: 'Domain name too long. It should be no more than 255 chars.',
  LABEL_STARTS_WITH_DASH: 'Domain name label can not start with a dash.',
  LABEL_ENDS_WITH_DASH: 'Domain name label can not end with a dash.',
  LABEL_TOO_LONG: 'Domain name label should be at most 63 chars long.',
  LABEL_TOO_SHORT: 'Domain name label should be at least 1 character long.',
  LABEL_INVALID_CHARS: 'Domain name label can only contain alphanumeric characters or dashes.',
}

// Hostnames are composed of series of labels concatenated with dots, as are all
// domain names. Each label must be between 1 and 63 characters long, and the
// entire hostname (including the delimiting dots) has a maximum of 255 chars.
//
// Allowed chars:
//
// * `a-z`
// * `0-9`
// * `-` but not as a starting or ending character
// * `.` as a separator for the textual portions of a domain name
//
// * http://en.wikipedia.org/wiki/Domain_name
// * http://en.wikipedia.org/wiki/Hostname
//
function validate(input: string): string | null {
  const ascii = Punycode.toASCII(input)

  // if (ascii.length < 1) {
  //   return 'DOMAIN_TOO_SHORT'
  // }
  // if (ascii.length > 255) {
  //   return 'DOMAIN_TOO_LONG'
  // }

  const labels = ascii.split('.')
  let label

  for (let i = 0; i < labels.length; ++i) {
    label = labels[i]
    if (!label.length) {
      return 'LABEL_TOO_SHORT'
    }
    // if (label.length > 63) {
    //   return 'LABEL_TOO_LONG'
    // }
    // if (label.charAt(0) === '-') {
    //   return 'LABEL_STARTS_WITH_DASH'
    // }
    // if (label.charAt(label.length - 1) === '-') {
    //   return 'LABEL_ENDS_WITH_DASH'
    // }
    // if (!/^[a-z0-9\-]+$/.test(label)) {
    //   return 'LABEL_INVALID_CHARS'
    // }
  }

  return null
}

function parsePunycode(domain: string, parsed: ParsedResult): ParsedResult {
  if (!/xn--/.test(domain)) {
    return parsed
  }
  if (parsed.domain) {
    parsed.domain = Punycode.toASCII(parsed.domain)
  }
  if (parsed.subdomain) {
    parsed.subdomain = Punycode.toASCII(parsed.subdomain)
  }
  return parsed
}

function parse(domain: string): ParsedResult {
  const domainSanitized = domain.toLowerCase()
  const validationErrorCode = validate(domain)
  if (validationErrorCode) {
    throw new Error(
      JSON.stringify({
        input: domain,
        error: {
          message: errorCodes[validationErrorCode],
          code: validationErrorCode,
        },
      }),
    )
  }

  const parsed: ParsedResult = {
    input: domain,
    tld: null,
    sld: null,
    domain: null,
    subdomain: null,
    listed: false,
  }

  const domainParts = domainSanitized.split('.')

  const rule = findRule(domainSanitized)
  if (!rule) {
    if (domainParts.length < 2) {
      return parsed
    }
    parsed.tld = domainParts.pop()!!
    parsed.sld = domainParts.pop()!!
    parsed.domain = `${parsed.sld}.${parsed.tld}`
    if (domainParts.length) {
      parsed.subdomain = domainParts.pop()!!
    }
    return parsePunycode(domain, parsed)
  }
  parsed.listed = true

  const tldParts = rule.suffix.split('.')
  const privateParts = domainParts.slice(0, domainParts.length - tldParts.length)

  if (rule.exception) {
    privateParts.push(tldParts.shift()!!)
  }

  parsed.tld = tldParts.join('.')

  if (!privateParts.length) {
    return parsePunycode(domainSanitized, parsed)
  }

  if (rule.wildcard) {
    parsed.tld = `${privateParts.pop()!!}.${parsed.tld}`
  }

  if (!privateParts.length) {
    return parsePunycode(domainSanitized, parsed)
  }

  parsed.sld = privateParts.pop()!!
  parsed.domain = `${parsed.sld}.${parsed.tld}`

  if (privateParts.length) {
    parsed.subdomain = privateParts.join('.')
  }

  return parsePunycode(domainSanitized, parsed)
}

function get(domain: string): string | null {
  if (!domain) {
    return null
  }

  return parse(domain).domain
}

export function getEffectiveTLDPlusOne(hostname: string) {
  try {
    return get(hostname) || ''
  } catch (e) {
    return ''
  }
}

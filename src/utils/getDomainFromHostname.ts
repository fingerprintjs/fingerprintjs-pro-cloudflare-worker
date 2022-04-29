import domainSuffixList from './domain-suffix-list.json'

export function getDomainFromHostname(hostname: string) {
  if (!hostname) {
    return hostname
  }

  for (const domainSuffix of domainSuffixList) {
    const lengthDiff = hostname.length - domainSuffix.length
    if (lengthDiff < 0) {
      continue
    }

    const endsWithSuffix = hostname.substring(lengthDiff).toLowerCase() === domainSuffix.toLowerCase()
    if (!endsWithSuffix) {
      continue
    }

    const partBeforeSuffix = hostname.substring(0, lengthDiff - 1)
    const lastDotIndex = partBeforeSuffix.lastIndexOf('.')
    if (lastDotIndex === -1) {
      return hostname
    }

    return hostname.substring(lastDotIndex + 1)
  }

  return hostname
}

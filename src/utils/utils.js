import { domainSuffixList } from "./domain-suffix-list";

export function identifyDomain(hostname) {
  const l1 = hostname.length;
  for (let i = 0; i < domainSuffixList.length; i++) {
    const domain = domainSuffixList[i];
    const l2 = domain.length;
    const sp = l1 - l2;
    if (sp < 0) continue;

    if (domain.toLowerCase() === hostname.substring(l1 - l2, l1)) {
      const fp = hostname.substring(0, sp - 1);
      const dot = fp.lastIndexOf('.');
      if (dot == -1) {
        return hostname;
      } else {
        return hostname.substring(dot + 1);
      }
    }
  }

  return hostname;
}
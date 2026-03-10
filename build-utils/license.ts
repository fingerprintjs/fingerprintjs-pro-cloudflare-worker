import { version } from '../package.json'

export function getLicenseBanner(project: string) {
  return `/**
 * Fingerprint ${project} v${version} - Copyright (c) FingerprintJS, Inc, ${new Date().getFullYear()} (https://fingerprint.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */`.trim()
}

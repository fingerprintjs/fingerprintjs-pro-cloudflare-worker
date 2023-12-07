<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/main/assets/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/main/assets/logo_dark.svg" />
     <img src="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/main/assets/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
<p align="center">
<a href="https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker">
  <img src="https://img.shields.io/github/v/release/fingerprintjs/fingerprintjs-pro-cloudflare-worker" alt="Current NPM version">
</a>
<a href="https://fingerprintjs.github.io/fingerprintjs-pro-cloudflare-worker/">
  <img src="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/gh-pages/badges.svg" alt="coverage">
</a>
<a href="https://opensource.org/licenses/MIT">
  <img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license">
</a>
<a href="https://discord.gg/39EpE2neBg">
  <img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server">
</a>

# Fingerprint Pro Cloudflare worker
The Cloudflare worker is responsible for delivering the latest fingerprinting client-side logic and proxying identification requests and responses between your site and Fingerprint Pro's APIs.

## Requirements

This library needs these to be in order to build and run:

- Node 16
- Typescript 4
- Playwright (with a headless browser preferably chromium)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## Setup process
The process consists of two steps. One needs to set up worker creation together with our support at [support@fingerprint.com](mailto:support@fingerprint.com). Afterwards, the Fingerprint Pro JS agent on the site needs to be configured to communicate with the worker.

You can find the full documentation at [https://dev.fingerprint.com/docs/cloudflare-integration](https://dev.fingerprint.com/docs/cloudflare-integration).

## Support

To report problems, ask questions or provide feedback, please use [Issues](). If you need private support, you can email us at [oss-support@fingerprint.com](mailto:oss-support@fingerprint.com).

## License

This project is licensed under the MIT license. See the [LICENSE](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/blob/main/LICENSE) file for more info.

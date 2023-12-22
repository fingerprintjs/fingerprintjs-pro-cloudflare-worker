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

[Fingerprint](https://fingerprint.com/) is a device intelligence platform offering 99.5% accurate visitor identification.

Fingerprint Pro Cloudflare Integration is responsible for

- Proxying download requests of the latest Fingerprint Pro JS Agent between your site and Fingerprint CDN.
- Proxying identification requests and responses between your site and Fingerprint Pro's APIs.

This [improves](https://dev.fingerprint.com/docs/cloudfront-proxy-integration#the-benefits-of-using-the-cloudfront-integration) both accuracy and reliability of visitor identification and bot detection on your site.

## Requirements

### Usage Requirements

- Credentials from Cloudflare
  - [Cloudflare Account ID](https://dev.fingerprint.com/docs/cloudflare-integration#cloudflare-account-id)
  - [Cloudflare API Token](https://dev.fingerprint.com/docs/cloudflare-integration#cloudflare-api-token)
- FingerprintPro Account

By just following the wizard with your credentials it's easy to setup. Please see the [Setup Process](#setup-process) section

## Setup process

Setup process is simple enough. You just follow a setup wizard and it's ready to use.
You can find the full documentation at [https://dev.fingerprint.com/docs/cloudflare-integration](https://dev.fingerprint.com/docs/cloudflare-integration).

## Support

To report problems, ask questions or provide feedback, please use [Issues](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/issues). If you need private support, you can email us at [oss-support@fingerprint.com](mailto:oss-support@fingerprint.com).

## License

This project is licensed under the MIT license. See the [LICENSE](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/blob/main/LICENSE) file for more info.

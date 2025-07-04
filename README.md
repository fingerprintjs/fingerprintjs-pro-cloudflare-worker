<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="https://fingerprintjs.github.io/home/resources/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="https://fingerprintjs.github.io/home/resources/logo_dark.svg" />
     <img src="https://fingerprintjs.github.io/home/resources/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
<p align="center">
<a href="https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker"><img src="https://img.shields.io/github/v/release/fingerprintjs/fingerprintjs-pro-cloudflare-worker" alt="Current NPM version"></a>
<a href="https://fingerprintjs.github.io/fingerprintjs-pro-cloudflare-worker/"><img src="https://raw.githubusercontent.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/gh-pages/badges.svg" alt="coverage"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license"></a>
<a href="https://discord.gg/39EpE2neBg"><img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server"></a>

# Fingerprint Pro Cloudflare worker

[Fingerprint](https://fingerprint.com/) is a device intelligence platform offering visitor identification and smart signals with industry-leading accuracy.

Fingerprint Pro Cloudflare Integration is responsible for

- Proxying download requests of the latest Fingerprint Pro JS Agent between your site and Fingerprint CDN.
- Proxying identification requests and responses between your site and Fingerprint Pro's APIs.

This [improves](https://dev.fingerprint.com/docs/cloudflare-integration#the-benefits-of-using-the-cloudflare-integration) both accuracy and reliability of visitor identification and bot detection on your site.

## Requirements

* [Fingerprint Pro account](https://dashboard.fingerprint.com/signup) with the _Owner_ role assigned.
* A website served by Cloudflare. For maximum accuracy benefits, your website should be [proxied by Cloudflare](https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/) (not DNS-only). 

See the [Cloudflare integration guide](https://dev.fingerprint.com/docs/cloudflare-integration#setup) for more details. 


## How to install

You can install the Cloudflare integration using an [installation wizard](https://dashboard.fingerprint.com/integrations) in the Fingerprint dashboard. 

See the [Cloudflare integration guide](https://dev.fingerprint.com/docs/cloudflare-integration#setup) for more details.

## Support

To report problems, ask questions or provide feedback, please use [Issues](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/issues). If you need private support, you can email us at [oss-support@fingerprint.com](mailto:oss-support@fingerprint.com).

## License

This project is licensed under the MIT license. See the [LICENSE](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/blob/main/LICENSE) file for more info.

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
<a href="https://opensource.org/licenses/MIT">
  <img src="https://img.shields.io/:license-mit-blue.svg" alt="MIT license">
</a>
<a href="https://discord.gg/39EpE2neBg">
  <img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server">
</a>

# DISCLAIMER
This project is currently in Private Beta.  If you would like to join our Private Beta Cloudflare Integration please contact us at [support@fingerprint.com](mailto:support@fingerprint.com).

# 👷 Cloudflare worker for FingerprintJS PRO agent
FingerprintJS Inc offers a Cloudflare Integration for the customers. The integration makes use of Cloudflare Workers, 
and this repository contains the source code of the worker. For more information about Cloudflare Workers, 
please read [here](https://workers.cloudflare.com/).

The aim of this project is proxying FingerprintJS Inc services using the same origin as the website.

The worker code essentially does the followings:
- Serves the latest JS Pro Agent
- Acts as a proxy for the identification HTTP request, converts cookies into 1st party cookies in the process

You can find the full documentation [here](https://dev.fingerprint.com/docs/cloudflare-integration). 
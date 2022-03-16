# Cloudflare worker for Fingerprint.js PRO agent

## How to deploy worker via Cloudflare CLI
#### Prerequisites:
1. Install CLI (Wrangler). Please follow [Installation manual](https://developers.cloudflare.com/workers/cli-wrangler/install-update/).
2. Set up `wrangler` to work with your Cloudflare account according to the [documentation](https://developers.cloudflare.com/workers/cli-wrangler/authentication/).

#### Worker installation
1. Generate worker from the template: `wranger generate my-fpjs-worker https://github.com/fingerprintjs/cf-worker`
2. Put the following values to the `wrangler.toml` file:
  * `account_id` -- your Cloudflare Account ID from [Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers).
  * `zone_id` -- Zone ID from [CF Dashboard](https://dash.cloudflare.com/?to=/:account/) of the website.
  * `route` -- Worker's HTTP route.


## How to deploy worker via Github Actions
// TODO

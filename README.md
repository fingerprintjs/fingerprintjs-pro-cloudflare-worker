# Cloudflare worker for Fingerprint.js PRO agent

## Installing to a website

Let's define the variables for an integration.
Let we have a domain `domain.com`.
* `route := domain.com/<route to worker>` -- the root route that's processed by worker.
* `script_download_subpath` -- a path to the agent script.
* `get_endpoint_subpath` -- a path to the endpoint to call the agent.

So that, a full endpoint to download script looks like this: `domain.com/<route>/<script_download_subpath>?apiKey=${PUBLIC_API_KEY}`.
A full endpoint to get visitor ID looks like: `domain.com/<route>/<get_endpoint_subpath>?region=${REGION}`.

### CDN
Add the following code to an entry point of your website.
```
const url = `domain.com/<route>/<script_download_subpath>?apiKey=${PUBLIC_API_KEY}`
const fpPromise = import(url)
 .then(FingerprintJS => FingerprintJS.load({
   apiKey: 'PUBLIC_API_KEY',
   endpoint: 'domain.com/<route>/<get_endpoint_subpath>?region=${REGION}',
 }));
 fpPromise
  .then(fp => fp.get())
  .then(result => console.log(result.visitorId));
```


### NPM package
//TODO link to npm package.
Add the following code to an entry point of your website.
```
const url = `domain.com/<route>/<script_download_subpath>?apiKey=${PUBLIC_API_KEY}`
FingerprintJS.load({
    apiKey: 'PUBLIC_API_KEY',
    scriptUrl: '<route>'/<PUBLIC_API_KEY>_<version>.js?lv=<loaderVersion>',
  })
  .then(fp => fp.get())
  .then(result => console.log(result))
```

## Deployment
### How to deploy worker via Cloudflare CLI
#### Prerequisites:
1. Install CLI (Wrangler). Please follow [Installation manual](https://developers.cloudflare.com/workers/cli-wrangler/install-update/).
2. Set up `wrangler` to work with your Cloudflare account according to the [documentation](https://developers.cloudflare.com/workers/cli-wrangler/authentication/).

#### Worker installation
1. Generate worker from the template: `wrangler generate my-fpjs-worker https://github.com/fingerprintjs/cf-worker`
2. Put the following values to the `wrangler.toml` file:
  * `account_id` -- your Cloudflare Account ID from [Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers).
  * `zone_id` -- Zone ID from [CF Dashboard](https://dash.cloudflare.com/?to=/:account/) of the website.
  * `route` -- Worker's HTTP route, e.g. `domain.com/<route to worker>`
3. Add `[vars]` section in the `wrangler.toml` file:
```
[vars]
API_BASE_ROUTE = <route to worker>
```
4. In order to change default values of `<script_download_subpath>` and `<get_endpoint_subpath>` you may add them info `wrangler.toml` file under `[vars]` section.

### How to deploy worker via Github Actions
1. Add following values to the repository secrets:
 * `CF_ACCOUNT_ID` -- your Cloudflare Account ID from [Workers Dashboard](https://dash.cloudflare.com/?to=/:account/workers).
 * `CF_ZONE_ID` -- Zone ID from [CF Dashboard](https://dash.cloudflare.com/?to=/:account/) of the website.
 * `CF_API_TOKEN` -- Cloudflare API token with `Edit workers` permission. [Link](https://dash.cloudflare.com/profile/api-tokens) to create.
 * `CF_ROUTE` -- Worker's HTTP route, e.g. `domain.com/<route to worker>`
 * `CF_API_BASE_ROUTE` -- `<route to worker>`.


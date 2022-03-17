# Cloudflare worker for Fingerprint.js PRO agent

## Installing to a website

Let's define the variables for an integration.
Let we have a domain `domain.com`.
| Variable  | Description | Default value | Example | 
| ------------- | ------------- | ------- | ----- |
| `route`  | The route route that's processed by worker  | No | `https://domain.com/cf-integration` |
| `script_download_endpoint`  | An endpoint under `route` to download agent for CDN | `agent` | `https://domain.com/cf-integration/agent` |
| `script_npm_download_endpoint` | An endpoint under `route` to download agent for NPM | `agent-npm` | `domain.com/cf-integration/agent-npm` |
| `get_visitor_endpoint` | An endpoint to get visitorId | `visitor` | `https://domain.com/cf-integration/visitorId` |

So that, a full endpoint to download script looks like this: `domain.com/<route>/<script_download_endpoint>?apiKey=${PUBLIC_API_KEY}`. \
A full endpoint to get visitor ID looks like: `domain.com/<route>/<get_endpoint_endpoint>?region=${REGION}`.

### CDN
Add the following code to an entry point of your website.
```
const url = `domain.com/<route>/<script_download_subpath>?apiKey=<public api_key>`
const fpPromise = import(url)
 .then(FingerprintJS => FingerprintJS.load({
   apiKey: '<public api_key>',
   endpoint: 'domain.com/<route>/agent?region=<region>',
 }));
 fpPromise
  .then(fp => fp.get())
  .then(result => console.log(result.visitorId));
```


### NPM package
//TODO link to npm package.
Add the following code to an entry point of your website.
Set <public api_key> and replace `<domain.com>/<route>` by your route to Cloudflare integration.
```
FingerprintJS.load({
    apiKey: '<public api_key>',
    scriptUrl: '<domain.com>/<route>/agent-for-npm?apiKey=<apiKey>&v=<version>&lv=<loaderVersion>',
    endpoint: '<domain.com>/<route>/visitorId?region=<region>'
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
2. Use [workflow file](.github/workflows/deploy.yml) to deploy worker.

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
  * `api_base_route` -- <route to worker>`


### How to deploy worker via Github Actions
// TODO

# Contributing to FingerprintJS Pro Cloudflare Worker

## Requirements

- Node 20
- Typescript 4+
- Playwright
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) v3+

## Working with code

We prefer using [pnpm](https://pnpm.io/) for installing dependencies and running scripts.

The `main` is locked for the push action. 

`main` branch is always where we create releases.

For proposing changes, use the standard [pull request approach](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request). It's recommended to discuss fixes or new functionality in the Issues, first.

Create pull requests for the `main` branch.

### How to build
After cloning the repo, run `pnpm install` to install packages.

Run `pnpm build` for creating a build in `dist` folder. After building, `dist/fingerprintjs-pro-cloudflare-worker.esm.js` file is created, and it is used to deploy to CF.

### How to run locally

Install [Wrangler](https://developers.cloudflare.com/workers/get-started/guide/#1-install-wrangler-workers-cli) provided by Cloudflare.

❗Please use `Wrangler 2` instead of `Wrangler 1`. For more info, please visit [here](https://developers.cloudflare.com/workers/wrangler/compare-v1-v2/).

First run `wrangler login`. This will open the browser and ask you to log in to your CF account to authorize Wrangler in your local machine. You can use `wrangler logout` any time to log out.

Then, you can run `wrangler dev` to run the worker locally. By default, it will run on `http://localhost:8787` and will have the following endpoints:
- `/cf-worker/agent` for downloading the Pro Agent script (a.k.a `import` url or `scriptUrlPattern`)
- `/cf-worker/getResult` for getting the result (a.k.a. `endpoint`)

You can use the worker locally with a client like the example below:
```html
<script>
  // REPLACE <API_KEY>
  const fpPromise = import('http://localhost:8787/cf-worker/agent?apiKey=<API_KEY>') 
    .then(FingerprintJS => FingerprintJS.load({
      endpoint: 'http://localhost:8787/cf-worker/getResult'
    }))

  // Get the visitor identifier when you need it.
  fpPromise
    .then(fp => fp.get())
    .then(result => {
      // This is the visitor identifier:
      const visitorId = result.visitorId
      console.log(visitorId)
    })
</script>
```

### Code style

The code style is controlled by [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/). Run to check that the code style is ok:
```shell
pnpm lint
```

You aren't required to run the check manually, the CI will do it. Run the following command to fix style issues (not all issues can be fixed automatically):
```shell
pnpm lint:fix
```

### Commit style

You are required to follow [conventional commits](https://www.conventionalcommits.org) rules.

### How to test

#### Unit tests

Run `pnpm test`.

#### e2e tests

End-to-end tests are run automatically on every PR. They also run daily on the `main` branch.

End-to-end tests are located in the `test/e2e` folder and run by [playwright](https://github.com/microsoft/playwright) environment. 
The `teste2e.yml` workflow is responsible for deploying a new Cloudflare worker, running end-to-end tests, and cleaning up the worker in the end. `teste2e.yml` works like this:
1. Check out the current branch (can be any branch).
2. Bump version according to the input, default to `patch`.
3. Generate environment variables, such as `WORKER_NAME` and `GET_RESULT_PATH`. Put them inside `wranger.toml`.
4. Publish the worker using `cloudfare/wrangler-action` to the designated Cloudflare account.
5. Install `playwright`.
6. Run `pnpm test:e2e` with env variables `test_client_domain`, `worker_version`, `worker_path`, `get_result_path`, and `agent_download_path`.
7. Delete the published Cloudflare worker from the Cloudflare account.

If tests fail, the last step (cleaning up the worker) is never executed by design, so that there is opportunity to inspect the worker to understand what went wrong.
Do not forget to delete the worker manually after using the Cloudflare dashboard. You can find the name of the worker in the workflow logs.

If the required environment variables are supplied, `pnpm test:e2e` can be run locally without needing `teste2e.yml`. For example, the command `worker_version=1.2.3 pnpm test:e2e` sets `worker_version` as a temporary env variable on *nix systems.

### How to release a new version

The workflow `release.yml` is responsible for releasing a new version. Run it on the `main` branch.

### How to keep your worker up-to-date

CF Integration by Fingerprint always uses the latest stable version for the customers, and upgrades customer workers automatically.

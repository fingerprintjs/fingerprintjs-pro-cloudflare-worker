# Contributing to FingerprintJS Pro Cloudflare Worker

## Working with code

We prefer using [yarn](https://yarnpkg.com/) for installing dependencies and running scripts.

The `main` and `develop` branches are locked for the push action. 

`main` branch is always where we create releases. If you have CF Integration set up, the source code is from the `main` branch. 

`develop` branch can be taught of as candidate for the next release. The code always passes the tests in `develop` branch. 

For proposing changes, use the standard [pull request approach](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request). It's recommended to discuss fixes or new functionality in the Issues, first.

Create pull requests for `develop` branch. No pull requests to `main` branch will be accepted.

### How to build
After cloning the repo, run `yarn install` to install packages.

Run `yarn build` for creating a build in `dist` folder. After building, `dist/fingerprintjs-pro-cloudflare-worker.esm.js` file is created, and it is used to deploy to CF.

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
yarn lint
```

You aren't required to run the check manually, the CI will do it. Run the following command to fix style issues (not all issues can be fixed automatically):
```shell
yarn lint:fix
```

### Commit style

You are required to follow [conventional commits](https://www.conventionalcommits.org) rules.

### How to test

End-to-end tests are located in `test/e2e` folder and run by [playwright](https://github.com/microsoft/playwright) environment. 
These tests are run automatically by the `teste2e.yml` workflow on every PR automatically, you don't need to run them locally. 

### How to release a new version

The workflow `release.yml` is responsible for releasing a new version. It has to be run on `develop` branch, and at the end it will create a release and a PR to `main` branch.

### How to keep your worker up-to-date

CF Integration by Fingerprint always uses the latest stable version for the customers, and upgrades customer workers automatically.

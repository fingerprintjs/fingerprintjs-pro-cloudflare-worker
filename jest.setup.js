// jest.setup.js
// This ensures you can use `window.fetch()` in Jest tests.
// We use node 16 than didn't support fetch API, Cloudflare use service worker environment that has fetch API
require('whatwg-fetch')

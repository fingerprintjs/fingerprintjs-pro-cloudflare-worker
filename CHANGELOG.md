## [1.5.0-rc.1](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/compare/v1.4.0...v1.5.0-rc.1) (2023-12-11)


### Features

* **proxy-host-header:** add proxy host header ([5022e7d](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/5022e7d6403044567f2e3a56adc141fa2c7fe42e))


### Build System

* **deps:** remove punycode & suffix list ([67d0e5a](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/67d0e5a27b964bc793320212fe90147c2dae620b))

## [1.4.0](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/compare/v1.3.1...v1.4.0) (2023-07-04)


### Features

* **cachingendpoint:** do not set edge network cache and do not override cache-control ([072faa4](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/072faa42d89f92623348f5b866c4cb76dc42c401))
* **handleingressapi:** handleIngressAPI now proxies req to servers with suffix ([a26cd8f](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/a26cd8f17132353ff5a8a5568d6cc89c42c24be5))
* **ingress-api:** add cache-control header to ingress api ([1ad08e0](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/1ad08e0f449af6416fefbc4ce1f9ef124ff557be))
* **ingress-api:** support for get/post methods ([b217028](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/b21702806fc400cf5d0e57922206b30a36dece63))
* **ingressapi:** ingressAPI now handles suffixed routes ([acd4af4](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/acd4af4234ef72c9c9bfa68a2a70eda45849ebf9))
* **router:** router now provides RegExpMatchArray as 3rd argument to handlers ([003005c](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/003005c418d0f4cc42e1be277dca1812a311922b))

## [1.3.1](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/compare/v1.3.0...v1.3.1) (2023-06-15)


### Bug Fixes

* **cookies:** fixed a case where TLD+1 cookies are not calculated correctly ([#170](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/issues/170)) ([64ba2a4](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/64ba2a41baad77a9d2949e1e964f5f872dc6400f))

## [1.3.0](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/compare/v1.2.0...v1.3.0) (2023-06-08)


### Features

* **worker-path:** remove ([f404a3a](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/f404a3a87cfd1d6df8244e4291301a1b69102ad1))


### Bug Fixes

* **routing:** support more characters for createRoute ([87764d2](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/87764d29ebce8d56f71feb7c7dff5328fa4e2133))


### Build System

* **deps:** add semantic-release ([d5f7842](https://github.com/fingerprintjs/fingerprintjs-pro-cloudflare-worker/commit/d5f784269e50617eb58f56f577c06536b2cec179))

---
'@fingerprint/cloudflare-worker-proxy': minor
---

Added support for Fingerprint [JavaScript agent v4](https://docs.fingerprint.com/reference/js-agent-v4). Compatibility with JavaScript agent v3 is maintained, you can upgrade to the latest JavaScript agent at your convenience. 

* See [Migrating the JavaScript agent from v3 to v4](https://docs.fingerprint.com/reference/migrating-from-v3-to-v4) for more details.
* When upgrading to the JavaScript agent v4, remove the `scriptUrlPattern` and `endpoint` options. Replace them with a single `endpoints` option pointing to the worker route of your Cloudflare proxy integration:

```diff js
- const fpPromise = FingerprintJS.load({
-   apiKey: PUBLIC_API_KEY,
-   scriptUrlPattern: "https://yourwebsite.com/WORKER_PATH/AGENT_SCRIPT_DOWNLOAD_PATH?apiKey=<apiKey>&version=<version>&loaderVersion=<loaderVersion>",
-   endpoint: "https://yourwebsite.com/GET_RESULT_PATH?region=eu",
- });

+ const fpPromise = Fingerprint.load({
+   apiKey: PUBLIC_API_KEY,
+   endpoints: "https://yourwebsite.com/WORKER_PATH?region=eu",
+ });
```

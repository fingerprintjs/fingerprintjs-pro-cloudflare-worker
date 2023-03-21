/**
 * FingerprintJS Pro Cloudflare Worker v1.2.0 - Copyright (c) FingerprintJS, Inc, 2023 (https://fingerprint.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

declare type WorkerEnv = {
    AGENT_SCRIPT_DOWNLOAD_PATH: string | null;
    GET_RESULT_PATH: string | null;
    PROXY_SECRET: string | null;
};

declare const _default: {
    fetch(request: Request, env: WorkerEnv): Promise<Response>;
};

export { _default as default };

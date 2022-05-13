/**
 * FingerprintJS Pro Agent Cloudflare Worker v0.0.2 - Copyright (c) FingerprintJS, Inc, 2022 (https://fingerprintjs.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

declare type WorkerEnv = {
    WORKER_PATH: string | null;
    AGENT_SCRIPT_DOWNLOAD_PATH: string | null;
    VISITOR_ID_PATH: string | null;
};

declare const _default: {
    fetch(request: Request, env: WorkerEnv): Promise<Response>;
};

export { _default as default };

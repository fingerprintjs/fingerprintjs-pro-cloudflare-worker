declare const __APP_VERSION__: string

/**
 * Defined here, since it's used by vite/client type definitions.
 * We cannot include "DOM" lib in the TypeScript that would normally include this type, because they conflict with Cloudflare types.
 * */
declare type SharedWorker = Worker & { port: MessagePort }

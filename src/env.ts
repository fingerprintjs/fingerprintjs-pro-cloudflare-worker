export type WorkerEnv = {
  AGENT_SCRIPT_DOWNLOAD_PATH: string | null
  VISITOR_ID_PATH: string | null
  WORKER_PATH: string | null
}

export function getScriptDownloadPath(env: WorkerEnv) {
  const agentPath = env.AGENT_SCRIPT_DOWNLOAD_PATH || Defaults.AGENT_SCRIPT_DOWNLOAD_PATH
  return `/${getWorkerPath(env)}/${agentPath}`
}

export function getVisitorIdPath(env: WorkerEnv) {
  const visitorPath = env.VISITOR_ID_PATH || Defaults.VISITOR_ID_PATH
  return `/${getWorkerPath(env)}/${visitorPath}`
}

function getWorkerPath(env: WorkerEnv) {
  return env.WORKER_PATH || Defaults.WORKER_PATH
}

export function getAgentScriptEndpoint(url: URL) {
  const apiKey = url.searchParams.get('apiKey') || Defaults.API_KEY
  const apiVersion = url.searchParams.get('version') || Defaults.AGENT_VERSION

  const base = `https://fpcdn.io/v${apiVersion}/${apiKey}`
  const loaderVersion = url.searchParams.get('loaderVersion')
  const lv = loaderVersion ? `/loader_v${loaderVersion}.js` : ''

  return `${base}${lv}?ii=fingerprintjs-cloudflare/${INT_VERSION}/procdn`
}

export function getVisitorIdEndpoint(region: string) {
  const prefix = region === Defaults.REGION ? '' : `${region}.`
  return `https://${prefix}api.fpjs.io?ii=fingerprintjs-cloudflare/${INT_VERSION}/ingress`
}

export const INT_VERSION = '1.0.0-beta'

const Defaults = {
  WORKER_PATH: 'cf-worker',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  VISITOR_ID_PATH: 'visitorId',
  REGION: 'us',
  API_KEY: '',
  AGENT_VERSION: '3',
  LOADER_VERSION: '',
}

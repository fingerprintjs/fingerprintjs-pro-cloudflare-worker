export type WorkerEnv = {
  WORKER_PATH: string | null
  AGENT_SCRIPT_DOWNLOAD_PATH: string | null
  VISITOR_ID_PATH: string | null
}

const Defaults: WorkerEnv & Record<string, string> = {
  WORKER_PATH: 'cf-worker',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  VISITOR_ID_PATH: 'visitorId',
  REGION: 'us',
  AGENT_VERSION: '3',
}

function getVarOrDefault(variable: keyof WorkerEnv, defaults: WorkerEnv): (env: WorkerEnv) => string {
  return function (env: WorkerEnv): string {
    return (env[variable] || defaults[variable]) as string
  }
}

function isVarSet(variable: keyof WorkerEnv): (env: WorkerEnv) => boolean {
  return function (env: WorkerEnv): boolean {
    return env[variable] != null
  }
}

export const workerPathVarName = 'WORKER_PATH'
export const getWorkerPath = getVarOrDefault(workerPathVarName, Defaults)
export const isWorkerPathSet = isVarSet(workerPathVarName)

export const agentScriptDownloadPathVarName = 'AGENT_SCRIPT_DOWNLOAD_PATH'
const getAgentPath = getVarOrDefault(agentScriptDownloadPathVarName, Defaults)
export const isScriptDownloadPathSet = isVarSet(agentScriptDownloadPathVarName)

export function getScriptDownloadPath(env: WorkerEnv) {
  const agentPath = getAgentPath(env)
  return `/${getWorkerPath(env)}/${agentPath}`
}

export const visitorIdPathVarName = 'VISITOR_ID_PATH'
const getVisitorPath = getVarOrDefault(visitorIdPathVarName, Defaults)
export const isVisitorIdPathSet = isVarSet(visitorIdPathVarName)

export function getVisitorIdPath(env: WorkerEnv) {
  const visitorPath = getVisitorPath(env)
  return `/${getWorkerPath(env)}/${visitorPath}`
}

export function getHealthCheckPath(env: WorkerEnv) {
  return `/${getWorkerPath(env)}/health`
}

export function getAgentScriptEndpoint(searchParams: URLSearchParams) {
  const apiKey = searchParams.get('apiKey') || Defaults.API_KEY
  const apiVersion = searchParams.get('version') || Defaults.AGENT_VERSION

  const base = `https://fpcdn.io/v${apiVersion}/${apiKey}`
  const loaderVersion = searchParams.get('loaderVersion')
  const lv = loaderVersion ? `/loader_v${loaderVersion}.js` : ''

  return `${base}${lv}`
}

export function getVisitorIdEndpoint(region: string) {
  const prefix = region === Defaults.REGION ? '' : `${region}.`
  return `https://${prefix}api.fpjs.io`
}

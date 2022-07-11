export type WorkerEnv = {
  WORKER_PATH: string | null
  AGENT_SCRIPT_DOWNLOAD_PATH: string | null
  GET_RESULT_PATH: string | null
}

const Defaults: WorkerEnv & Record<string, string> = {
  WORKER_PATH: 'cf-worker',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  GET_RESULT_PATH: 'getResult',
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
export const getWorkerPathVar = getVarOrDefault(workerPathVarName, Defaults)
export const isWorkerPathSet = isVarSet(workerPathVarName)

export const agentScriptDownloadPathVarName = 'AGENT_SCRIPT_DOWNLOAD_PATH'
const getAgentPathVar = getVarOrDefault(agentScriptDownloadPathVarName, Defaults)
export const isScriptDownloadPathSet = isVarSet(agentScriptDownloadPathVarName)

export function getScriptDownloadPath(env: WorkerEnv) {
  const agentPathVar = getAgentPathVar(env)
  return `/${getWorkerPathVar(env)}/${agentPathVar}`
}

export const getResultPathVarName = 'GET_RESULT_PATH'
const getGetResultPathVar = getVarOrDefault(getResultPathVarName, Defaults)
export const isGetResultPathSet = isVarSet(getResultPathVarName)

export function getGetResultPath(env: WorkerEnv) {
  const getResultPathVar = getGetResultPathVar(env)
  return `/${getWorkerPathVar(env)}/${getResultPathVar}`
}

export function getHealthCheckPath(env: WorkerEnv) {
  return `/${getWorkerPathVar(env)}/health`
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

export type WorkerEnv = {
  WORKER_PATH: string | null
  AGENT_SCRIPT_DOWNLOAD_PATH: string | null
  GET_RESULT_PATH: string | null
  PROXY_SECRET: string | null
}

const Defaults: WorkerEnv & Record<string, string> = {
  WORKER_PATH: 'cf-worker',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  GET_RESULT_PATH: 'getResult',
  PROXY_SECRET: '',
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

export function getScriptDownloadPath(env: WorkerEnv): string {
  const agentPathVar = getAgentPathVar(env)
  return `/${getWorkerPathVar(env)}/${agentPathVar}`
}

export const getResultPathVarName = 'GET_RESULT_PATH'
const getGetResultPathVar = getVarOrDefault(getResultPathVarName, Defaults)
export const isGetResultPathSet = isVarSet(getResultPathVarName)

export function getGetResultPath(env: WorkerEnv): string {
  const getResultPathVar = getGetResultPathVar(env)
  return `/${getWorkerPathVar(env)}/${getResultPathVar}`
}

export const proxySecretVarName = 'PROXY_SECRET'
const getProxySecretVar = getVarOrDefault(proxySecretVarName, Defaults)
export const isProxySecretSet = isVarSet(proxySecretVarName)

export function getProxySecret(env: WorkerEnv): string {
  return getProxySecretVar(env)
}

export function getHealthCheckPath(env: WorkerEnv): string {
  return `/${getWorkerPathVar(env)}/health`
}

export function getStatusPagePath(env: WorkerEnv): string {
  return `/${getWorkerPathVar(env)}/status`
}

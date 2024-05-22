import { config } from './config'

export type WorkerEnv = {
  AGENT_SCRIPT_DOWNLOAD_PATH: string | null
  GET_RESULT_PATH: string | null
  PROXY_SECRET: string | null
  FPJS_CDN_URL: string | null
  FPJS_INGRESS_BASE_HOST: string | null
}

export const Defaults: WorkerEnv = {
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent',
  GET_RESULT_PATH: 'getResult',
  PROXY_SECRET: null,
  FPJS_CDN_URL: config.fpcdn,
  FPJS_INGRESS_BASE_HOST: config.ingressApi,
}

function getVarOrDefault(variable: keyof WorkerEnv, defaults: WorkerEnv): (env: WorkerEnv) => string | null {
  return function (env: WorkerEnv): string | null {
    return (env[variable] || defaults[variable]) as string | null
  }
}

function isVarSet(variable: keyof WorkerEnv): (env: WorkerEnv) => boolean {
  return function (env: WorkerEnv): boolean {
    return env[variable] != null
  }
}

export const getCdnUrl = getVarOrDefault('FPJS_CDN_URL', Defaults)
export const getIngressBaseHost = getVarOrDefault('FPJS_INGRESS_BASE_HOST', Defaults)

export const agentScriptDownloadPathVarName = 'AGENT_SCRIPT_DOWNLOAD_PATH'
const getAgentPathVar = getVarOrDefault(agentScriptDownloadPathVarName, Defaults)
export const isScriptDownloadPathSet = isVarSet(agentScriptDownloadPathVarName)

export function getScriptDownloadPath(env: WorkerEnv): string {
  const agentPathVar = getAgentPathVar(env)
  return `/${agentPathVar}`
}

export const getResultPathVarName = 'GET_RESULT_PATH'
const getGetResultPathVar = getVarOrDefault(getResultPathVarName, Defaults)
export const isGetResultPathSet = isVarSet(getResultPathVarName)

export function getGetResultPath(env: WorkerEnv): string {
  const getResultPathVar = getGetResultPathVar(env)
  return `/${getResultPathVar}(/.*)?`
}

export const proxySecretVarName = 'PROXY_SECRET'
const getProxySecretVar = getVarOrDefault(proxySecretVarName, Defaults)
export const isProxySecretSet = isVarSet(proxySecretVarName)

export function getProxySecret(env: WorkerEnv): string | null {
  return getProxySecretVar(env)
}

export function getStatusPagePath(): string {
  return `/status`
}

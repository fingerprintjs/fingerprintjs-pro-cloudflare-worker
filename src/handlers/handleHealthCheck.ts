import {
  getScriptDownloadPath,
  getVisitorIdPath,
  getWorkerPath,
  WorkerEnv,
  isScriptDownloadPathSet,
  isWorkerPathSet,
  isVisitorIdPathSet,
  workerPathVarName,
  agentScriptDownloadPathVarName,
  visitorIdPathVarName,
} from '../env'

type EnvVarInfo = {
  envVarName: string
  value: string
  isSet: boolean
}

function buildEnvInfo(env: WorkerEnv): { [key: string]: EnvVarInfo } {
  const workerPath: EnvVarInfo = {
    envVarName: workerPathVarName,
    value: getWorkerPath(env),
    isSet: isWorkerPathSet(env),
  }

  const scriptDownloadPath: EnvVarInfo = {
    envVarName: agentScriptDownloadPathVarName,
    value: getScriptDownloadPath(env),
    isSet: isScriptDownloadPathSet(env),
  }

  const visitorIdPath: EnvVarInfo = {
    envVarName: visitorIdPathVarName,
    value: getVisitorIdPath(env),
    isSet: isVisitorIdPathSet(env),
  }

  return {
    workerPath,
    scriptDownloadPath,
    visitorIdPath,
  }
}

function buildHeaders(): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  return headers
}

function buildBody(env: WorkerEnv): object {
  return {
    success: true,
    envInfo: buildEnvInfo(env),
  }
}

export function handleHealthCheck(env: WorkerEnv): Response {
  const headers = buildHeaders()
  const body = buildBody(env)

  return new Response(JSON.stringify(body), {
    status: 200,
    statusText: 'OK',
    headers,
  })
}

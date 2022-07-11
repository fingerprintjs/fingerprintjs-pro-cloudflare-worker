import {
  getScriptDownloadPath,
  getGetResultPath,
  getWorkerPathVar,
  WorkerEnv,
  isScriptDownloadPathSet,
  isWorkerPathSet,
  isGetResultPathSet,
  workerPathVarName,
  agentScriptDownloadPathVarName,
  getResultPathVarName,
} from '../env'

type EnvVarInfo = {
  envVarName: string
  value: string
  isSet: boolean
}

function buildEnvInfo(env: WorkerEnv): { [key: string]: EnvVarInfo } {
  const workerPath: EnvVarInfo = {
    envVarName: workerPathVarName,
    value: getWorkerPathVar(env),
    isSet: isWorkerPathSet(env),
  }

  const scriptDownloadPath: EnvVarInfo = {
    envVarName: agentScriptDownloadPathVarName,
    value: getScriptDownloadPath(env),
    isSet: isScriptDownloadPathSet(env),
  }

  const getResultPath: EnvVarInfo = {
    envVarName: getResultPathVarName,
    value: getGetResultPath(env),
    isSet: isGetResultPathSet(env),
  }

  return {
    workerPath,
    scriptDownloadPath,
    getResultPath,
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
    version: '__current_worker_version__',
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

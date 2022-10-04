import { getScriptDownloadPath, getGetResultPath, getHealthCheckPath, WorkerEnv, getHealthPagePath } from './env'

import { createErrorResponse } from './utils'
import { handleDownloadScript, handleIngressAPI, handleHealthCheck, handleHealthPage } from './handlers'

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === getScriptDownloadPath(env)) {
    return handleDownloadScript(request)
  }

  if (pathname === getGetResultPath(env)) {
    return handleIngressAPI(request)
  }

  if (pathname === getHealthCheckPath(env)) {
    return handleHealthCheck(env)
  }

  if (pathname === getHealthPagePath(env)) {
    return handleHealthPage(env)
  }

  return createErrorResponse(request, `unmatched path ${pathname}`)
}

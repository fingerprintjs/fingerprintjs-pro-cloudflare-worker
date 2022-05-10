import { getScriptDownloadPath, getVisitorIdPath, getHealthCheckPath, WorkerEnv } from './env'

import { createErrorResponse } from './utils'
import { handleDownloadScript, handleIngressAPI, handleHealthCheck } from './handlers'

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === getScriptDownloadPath(env)) {
    return handleDownloadScript(request)
  }

  if (pathname === getVisitorIdPath(env)) {
    return handleIngressAPI(request)
  }

  if (pathname === getHealthCheckPath(env)) {
    return handleHealthCheck(env)
  }

  return createErrorResponse(`unmatched path ${pathname}`)
}

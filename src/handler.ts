import { getScriptDownloadPath, getGetResultPath, getHealthCheckPath, WorkerEnv, getStatusPagePath } from './env'

import { createErrorResponse } from './utils'
import { handleDownloadScript, handleIngressAPI, handleHealthCheck, handleStatusPage } from './handlers'

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === getScriptDownloadPath(env)) {
    try {
      return await handleDownloadScript(request)
    } catch (e) {
      return new Response(null, { status: 404 })
    }
  }

  if (pathname === getGetResultPath(env)) {
    return handleIngressAPI(request)
  }

  if (pathname === getHealthCheckPath(env)) {
    return handleHealthCheck(env)
  }

  if (pathname === getStatusPagePath(env)) {
    return handleStatusPage(env)
  }

  return createErrorResponse(request, `unmatched path ${pathname}`)
}

import { getScriptDownloadPath, getGetResultPath, getHealthCheckPath, WorkerEnv, getStatusPagePath } from './env'

import { createErrorResponseForIngress, createErrorResponseForProCDN, removeTrailingSlashes } from './utils'
import { handleDownloadScript, handleIngressAPI, handleHealthCheck, handleStatusPage } from './handlers'

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const pathname = removeTrailingSlashes(url.pathname)

  if (pathname === getScriptDownloadPath(env)) {
    try {
      return await handleDownloadScript(request)
    } catch (e) {
      return createErrorResponseForProCDN(e)
    }
  }

  if (pathname === getGetResultPath(env)) {
    try {
      return await handleIngressAPI(request, env)
    } catch (e) {
      return createErrorResponseForIngress(request, e)
    }
  }

  if (pathname === getHealthCheckPath(env)) {
    return handleHealthCheck(env)
  }

  if (pathname === getStatusPagePath(env)) {
    return handleStatusPage(env)
  }

  return new Response(JSON.stringify({ error: `unmatched path ${pathname}` }), { status: 404 })
}

import { getScriptDownloadPath, getGetResultPath, getHealthCheckPath, WorkerEnv, getStatusPagePath } from './env'

import { createErrorResponseForIngress, createErrorResponseForProCDN } from './utils'
import { handleDownloadScript, handleIngressAPI, handleHealthCheck, handleStatusPage } from './handlers'
import { createRoute } from './utils'

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)

  const scriptDownloadRoute = createRoute(getScriptDownloadPath(env))
  if (url.pathname.match(scriptDownloadRoute)) {
    try {
      return await handleDownloadScript(request)
    } catch (e) {
      return createErrorResponseForProCDN(e)
    }
  }

  const getResultRoute = createRoute(getGetResultPath(env))
  if (url.pathname.match(getResultRoute)) {
    try {
      return await handleIngressAPI(request, env)
    } catch (e) {
      return createErrorResponseForIngress(request, e)
    }
  }

  const healthRoute = createRoute(getHealthCheckPath(env))
  if (url.pathname.match(healthRoute)) {
    return handleHealthCheck(env)
  }

  const statusRoute = createRoute(getStatusPagePath(env))
  if (url.pathname.match(statusRoute)) {
    return handleStatusPage(env)
  }

  return new Response(JSON.stringify({ error: `unmatched path ${url.pathname}` }), { status: 404 })
}

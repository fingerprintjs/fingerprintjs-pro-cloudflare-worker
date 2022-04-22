import { getAgentScriptEndpoint, getScriptDownloadPath, getVisitorIdPath, WorkerEnv } from './env'

import { createErrorResponse } from './utils/'
import { handleDownloadScript, handleIngressAPI } from './handlers'

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname === getScriptDownloadPath(env)) {
    const agentScriptEndpoint = getAgentScriptEndpoint(url.searchParams)
    return handleDownloadScript(request, agentScriptEndpoint)
  }

  if (pathname === getVisitorIdPath(env)) {
    return handleIngressAPI(request)
  }

  return createErrorResponse(`unmatched path ${pathname}`)
}

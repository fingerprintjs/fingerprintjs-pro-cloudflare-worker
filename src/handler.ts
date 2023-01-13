import { getScriptDownloadPath, getGetResultPath, getHealthCheckPath, WorkerEnv, getStatusPagePath } from './env'

import { createErrorResponseForIngress, createErrorResponseForProCDN } from './utils'
import { handleDownloadScript, handleIngressAPI, handleHealthCheck, handleStatusPage } from './handlers'
import { createRoute } from './utils'

export type Route = {
  pathPattern: RegExp
  handler: (request: Request, env: WorkerEnv) => Response | Promise<Response>
}

function createRoutes(env: WorkerEnv): Route[] {
  const routes: Route[] = []
  const downloadScriptRoute: Route = {
    pathPattern: createRoute(getScriptDownloadPath(env)),
    handler: async (request) => {
      try {
        return await handleDownloadScript(request)
      } catch (e) {
        return createErrorResponseForProCDN(e)
      }
    },
  }
  const ingressAPIRoute: Route = {
    pathPattern: createRoute(getGetResultPath(env)),
    handler: async (request, env) => {
      try {
        return await handleIngressAPI(request, env)
      } catch (e) {
        return createErrorResponseForIngress(request, e)
      }
    },
  }
  const healthRoute: Route = {
    pathPattern: createRoute(getHealthCheckPath(env)),
    handler: (_, env) => handleHealthCheck(env),
  }
  const statusRoute: Route = {
    pathPattern: createRoute(getStatusPagePath(env)),
    handler: (request, env) => handleStatusPage(request, env),
  }
  routes.push(downloadScriptRoute)
  routes.push(ingressAPIRoute)
  routes.push(healthRoute)
  routes.push(statusRoute)

  return routes
}

export async function handleRequestWithRoutes(request: Request, env: WorkerEnv, routes: Route[]): Promise<Response> {
  const url = new URL(request.url)
  for (const route of routes) {
    if (url.pathname.match(route.pathPattern)) {
      return route.handler(request, env)
    }
  }

  return new Response(JSON.stringify({ error: `unmatched path ${url.pathname}` }), { status: 404 })
}

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const routes = createRoutes(env)
  return handleRequestWithRoutes(request, env, routes)
}

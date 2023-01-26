import { getScriptDownloadPath, getGetResultPath, WorkerEnv, getStatusPagePath } from './env'

import { handleDownloadScript, handleIngressAPI, handleStatusPage } from './handlers'
import { createRoute } from './utils'

export type Route = {
  pathPattern: RegExp
  handler: (request: Request, env: WorkerEnv) => Response | Promise<Response>
}

function createRoutes(env: WorkerEnv): Route[] {
  const routes: Route[] = []
  const downloadScriptRoute: Route = {
    pathPattern: createRoute(getScriptDownloadPath(env)),
    handler: handleDownloadScript,
  }
  const ingressAPIRoute: Route = {
    pathPattern: createRoute(getGetResultPath(env)),
    handler: handleIngressAPI,
  }
  const statusRoute: Route = {
    pathPattern: createRoute(getStatusPagePath(env)),
    handler: (request, env) => handleStatusPage(request, env),
  }
  routes.push(downloadScriptRoute)
  routes.push(ingressAPIRoute)
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

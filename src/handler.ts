import { getScriptDownloadPath, getGetResultPath, WorkerEnv, getStatusPagePath, getIntegrationPathDepth } from './env'

import { handleDownloadScript, handleIngressAPI, handleStatusPage } from './handlers'
import { createRoutePathPrefix, stripPrefixPathSegments } from './utils'

export type Route = {
  /**
   * The route will match if request URL path after the integration
   * path is:
   * - `/${pathPrefix}`
   * - `/${pathPrefix}/.*`
   */
  pathPrefix: string

  /**
   * The request handler for the route
   *
   * @param request the {@link Request} the worker received
   * @param env the {@link WorkerEnv}
   * @param targetPath the URL path with the integration path removed
   * @returns the {@link Response} to return to the client
   */
  handler: (request: Request, env: WorkerEnv, targetPath: string) => Response | Promise<Response>
}

function createRoutes(env: WorkerEnv): Route[] {
  const routes: Route[] = []
  const downloadScriptRoute: Route = {
    pathPrefix: createRoutePathPrefix(getScriptDownloadPath(env)),
    handler: handleDownloadScript,
  }
  const ingressAPIRoute: Route = {
    pathPrefix: createRoutePathPrefix(getGetResultPath(env)),
    handler: handleIngressAPI,
  }
  const statusRoute: Route = {
    pathPrefix: createRoutePathPrefix(getStatusPagePath()),
    handler: handleStatusPage,
  }
  routes.push(downloadScriptRoute)
  routes.push(ingressAPIRoute)
  routes.push(statusRoute)

  return routes
}

function handleNoMatch(urlPathname: string): Response {
  const responseHeaders = new Headers({
    'content-type': 'application/json',
  })

  return new Response(JSON.stringify({ error: `unmatched path ${urlPathname}` }), {
    status: 404,
    headers: responseHeaders,
  })
}

export function handleRequestWithRoutes(
  request: Request,
  env: WorkerEnv,
  routes: Route[]
): Promise<Response> | Response {
  const url = new URL(request.url)
  const routeMatchingPath = stripPrefixPathSegments(url, getIntegrationPathDepth(env))
  if (routeMatchingPath) {
    for (const route of routes) {
      if (routeMatchingPath === route.pathPrefix || routeMatchingPath.startsWith(`${route.pathPrefix}/`)) {
        const targetPath = routeMatchingPath.slice(route.pathPrefix.length) || '/'
        return route.handler(request, env, targetPath)
      }
    }
  }

  return handleNoMatch(url.pathname)
}

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const routes = createRoutes(env)
  return handleRequestWithRoutes(request, env, routes)
}

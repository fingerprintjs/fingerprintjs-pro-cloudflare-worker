import { getAgentScriptEndpoint, getVisitorIdEndpoint, getScriptDownloadPath, getVisitorIdPath } from './env'

import { identifyDomain } from './domains/domain-utils'
import { Cookie } from 'cookies'

function createCookieStringFromObject(name: string, value: Cookie) {
  const flags = Object.entries(value).filter(([k]) => k !== name && k !== 'value')
  const nameValue = `${name}=${value.value}`
  const rest = flags.map(([k, v]) => (v ? `${k}=${v}` : k))
  return [nameValue, ...rest].join('; ')
}

function createResponseWithMaxAge(oldResponse: Response, maxMaxAge: number) {
  const response = new Response(oldResponse.body, oldResponse)
  const cacheControlDirectives = oldResponse.headers.get('cache-control').split(', ')
  const maxAgeIndex = cacheControlDirectives.findIndex(
    (directive) => directive.split('=')[0].trim().toLowerCase() === 'max-age'
  )
  if (maxAgeIndex === -1) {
    cacheControlDirectives.push(`max-age=${maxMaxAge}`)
  } else {
    const oldMaxAge = Number(cacheControlDirectives[maxAgeIndex].split('=')[1])
    cacheControlDirectives[maxAgeIndex] = `max-age=${Math.min(maxMaxAge, oldMaxAge)}`
  }
  const cacheControlValue = cacheControlDirectives.join(', ')
  response.headers.set('cache-control', cacheControlValue)
  return response
}

function createResponseWithFirstPartyCookies(request: Request, response: Response) {
  const origin = request.headers.get('origin')
  const hostname = new URL(origin).hostname
  const domain = identifyDomain(hostname)
  const newHeaders = new Headers(response.headers)
  const cookiesArray = newHeaders.getAll('set-cookie')
  newHeaders.delete('set-cookie')
  for (const cookieValue of cookiesArray) {
    let cookieName: string = ''
    const cookieObject = cookieValue.split('; ').reduce((prev, flag, index) => {
      const kv = flag.split('=')
      const key = index === 0 ? 'value' : kv[0]
      if (index === 0) {
        cookieName = kv[0]
      }
      const value = kv[1]
      return { ...prev, [key]: value }
    }, {})
    cookieObject.Domain = domain // first party cookie instead of third party cookie
    const newCookie = createCookieStringFromObject(cookieName, cookieObject)
    newHeaders.append('set-cookie', newCookie)
  }
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })

  return newResponse
}

function createErrorResponse(reason: string) {
  const responseBody = {
    message: 'An error occurred with Cloudflare worker.',
    reason,
  }
  return new Response(JSON.stringify(responseBody), { status: 500 }) // todo standard error for js client
}

async function handleIngressAPIRaw(request: Request, url: URL) {
  if (request == null) {
    throw new Error('request is null')
  }

  if (url == null) {
    throw new Error('url is null')
  }

  console.log(`sending ingress api to ${url}...`)
  const requestHeaders = new Headers(request.headers)

  const newRequest = new Request(url.toString(), new Request(request, { headers: requestHeaders }))

  const response = await fetch(newRequest)
  return createResponseWithFirstPartyCookies(request, response)
}

async function fetchCacheable(request: Request, ttl: number) {
  return fetch(request, { cf: { cacheTtl: ttl } })
}

async function handleDownloadScript(request: Request, url: string) {
  const newRequest = new Request(url, new Request(request, { headers: new Headers(request.headers) }))

  console.log(`Downloading script from cdnEndpoint ${url}`)
  const downloadScriptCacheTtl = 5 * 60

  return fetchCacheable(newRequest, downloadScriptCacheTtl).then((res) => createResponseWithMaxAge(res, 60 * 60))
}

async function handleIngressAPI(request: Request) {
  const url = new URL(request.url)
  const region = url.searchParams.get('region') || 'us'
  const endpoint = getVisitorIdEndpoint(region)
  const newURL: URL = new URL(endpoint)
  newURL.search = new URLSearchParams(url.search).toString()
  return handleIngressAPIRaw(request, newURL)
}

export async function handleRequest(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (pathname == getScriptDownloadPath(env)) {
    return handleDownloadScript(request, getAgentScriptEndpoint(url))
  } else if (pathname === getVisitorIdPath(env)) {
    return handleIngressAPI(request)
  } else {
    return createErrorResponse(`unmatched path ${pathname}`)
  }
}

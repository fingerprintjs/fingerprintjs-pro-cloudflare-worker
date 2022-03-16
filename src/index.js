import { API_VERSION, LOADER_VERSION, getCdnEndpoint, getCdnEndpoint0 } from './env.js';

import { identifyDomain } from './utils/utils.js';

// values presented in wrangers.toml [vars] section
// and comes as env vars
const SCRIPT_DOWNLOAD_PATH = `${api_base_route}${script_download_subpath}`;
const GET_ENDPOINT_PATH = `${api_base_route}${get_endpoint_subpath}`;

function getVisitorIdEndpoint(region) {
  const prefix = region === 'us' ? '' : `${region}.`;  
  return `https://${prefix}api.fpjs.io`;
}

function createCookieStringFromObject(name, value) {
  const flags = Object.entries(value).filter(([k]) => k !== name && k !== 'value');
  const nameValue = `${name}=${value.value}`;
  const rest = flags.map(([k,v]) => v ? `${k}=${v}` : k);
  return [nameValue, ...rest].join('; ');
}

function createResponseWithMaxAge(oldResponse, maxMaxAge) {
  const response = new Response(oldResponse.body, oldResponse)
  const cacheControlDirectives = oldResponse.headers.get('cache-control').split(', ')
  const maxAgeIndex = cacheControlDirectives.findIndex(directive => directive.split('=')[0].trim().toLowerCase() === 'max-age')
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

function createResponseWithFirstPartyCookies(request, response) {
  const origin = request.headers.get('origin');
  const hostname = (new URL(origin)).hostname;
  const domain = identifyDomain(hostname);
  const newHeaders = new Headers(response.headers)
  const cookiesArray = newHeaders.getAll('set-cookie');
  newHeaders.delete('set-cookie') 
  for (const cookieValue of cookiesArray) {
      let cookieName;
      const cookieObject = cookieValue.split('; ').reduce((prev, flag, index) => {
          let [key, value] = flag.split('=');
          if (index === 0) {
              cookieName = key;
              key = 'value';
          }
          return {...prev, [key]: value}
      }, {})
      cookieObject.Domain = domain; // first party cookie instead of third party cookie
      const newCookie = createCookieStringFromObject(cookieName, cookieObject);
      newHeaders.append('set-cookie', newCookie);
  }
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })

  return newResponse
}

function createErrorResponse(reason) {
  const responseBody = {
    message: 'An error occurred with Cloudflare worker.',
    reason,
  }
  return new Response(JSON.stringify(responseBody), { status: 500 }) // todo standard error for js client
}

async function handleIngressAPIRaw(event, url) {
  if (event == null) {
    throw new Error('event is null');
  }
 
  if (event.request == null) {
    throw new Error('request is null');
  }

  if (url == null) {
    throw new Error('url is null');
  }

  console.log(`sending ingress api to ${url}...`)
  const requestHeaders = new Headers(event.request.headers)

  const newRequest = new Request(url, new Request(event.request, {
    headers: requestHeaders
  }));

  const response = await fetch(newRequest)
  return createResponseWithFirstPartyCookies(event.request, response)
}

async function fetchCacheable(event, request, ttl) {
  return fetch(request, {cf: {cacheTtl: ttl}});
}

async function handleDownloadScript(event){
  const url = new URL(event.request.url);
  const apiKey = url.searchParams.get('apiKey');
  if (!apiKey) {
    throw new Error('browserToken is expected in query parameters.');
  }
  const apiVersion = url.searchParams.get('apiVersion') ?? API_VERSION;
  const loaderVersion = url.searchParams.get('loaderVersion') ?? LOADER_VERSION;
  
  console.log(`apiKey = ${apiKey}`);
  console.log(`apiVersion = ${apiVersion}`);
  console.log(`loaderVersion = ${loaderVersion}`);

  const cdnEndpoint = getCdnEndpoint(browserToken, apiVersion, loaderVersion);
  const newRequest = new Request(cdnEndpoint, new Request(event.request, {
    headers: new Headers(event.request.headers)
  }));

  console.log(`Downloading script from cdnEndpoint ${cdnEndpoint}...`);
  const downloadScriptCacheTtl = 5 * 60;

  return fetchCacheable(event, newRequest, downloadScriptCacheTtl)
    .then(res => createResponseWithMaxAge(res, 60 * 60))
}

async function handleIngressAPI(event){
  const url = new URL(event.request.url);
  const region = url.searchParams.get('region') || 'us';  
  const endpoint = getVisitorIdEndpoint(region);
  const newURL = new URL(endpoint);
  newURL.search = new URLSearchParams(url.search);
  return handleIngressAPIRaw(event, newURL);
}

async function handleRequest(event) {
  const url = new URL(event.request.url);
  const pathname = url.pathname;  
  
  if (pathname === SCRIPT_DOWNLOAD_PATH) {
    return handleDownloadScript(event);
  } else if (pathname === GET_ENDPOINT_PATH) {
    return handleIngressAPI(event)
  } else {
    throw new Error(`unmatched path ${pathname}`);
  }
}

addEventListener('fetch', event => {
  const request = event.request;
  event.respondWith(handleRequest({request}));
});

export default {  
  async fetch(request){
    try {
      return handleRequest({request})
    } catch (e) {
      return createErrorResponse(`unmatched path ${pathname}`)
    }
  } 
}

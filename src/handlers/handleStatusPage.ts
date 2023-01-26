import {
  WorkerEnv,
  isScriptDownloadPathSet,
  isGetResultPathSet,
  isProxySecretSet,
  agentScriptDownloadPathVarName,
  getResultPathVarName,
  proxySecretVarName,
} from '../env'

function buildHeaders(): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'text/html')
  return headers
}

function createWorkerVersionElement(): string {
  return `
  <span>
  Worker version: __current_worker_version__
  </span>
  `
}

function createContactInformationElement(): string {
  return `
  <span>
  Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
  </span>
  `
}

function createEnvVarsInformationElement(env: WorkerEnv): string {
  const isScriptDownloadPathAvailable = isScriptDownloadPathSet(env)
  const isGetResultPathAvailable = isGetResultPathSet(env)
  const isProxySecretAvailable = isProxySecretSet(env)
  const isAllVarsAvailable = isScriptDownloadPathAvailable && isGetResultPathAvailable && isProxySecretAvailable

  let result = ''
  if (!isAllVarsAvailable) {
    result += `
    <span>
    The following environment variables are not defined. Please reach out our support team.
    </span>
    `
    if (!isScriptDownloadPathAvailable) {
      result += `
      <span>
      ${agentScriptDownloadPathVarName} is not set
      </span>
      `
    }
    if (!isGetResultPathAvailable) {
      result += `
      <span>
      ${getResultPathVarName} is not set
      </span>
      `
    }
    if (!isProxySecretAvailable) {
      result += `
      <span>
      ${proxySecretVarName} is not set
      </span>
      `
    }
  } else {
    result += `
    <span>
    All environment variables are set
    </span>
    `
  }
  return result
}

function buildBody(env: WorkerEnv): string {
  let body = `
  <html lang='en-US'>
  <head>
    <meta charset='utf-8'/>
    <title>Fingerprint Cloudflare Worker</title>
    <link rel='icon' type='image/x-icon' href='https://fingerprint.com/img/favicon.ico'>
    <style>
      span {
        display: block;
        padding-top: 1em;
        padding-bottom: 1em;
        text-align: center;
      }
    </style>
  </head>
  <body>
  `

  body += `<span>Your worker is deployed</span>`

  body += createWorkerVersionElement()
  body += createEnvVarsInformationElement(env)
  body += createContactInformationElement()

  body += `  
  </body>
  </html>
  `
  return body
}

export function handleStatusPage(request: Request, env: WorkerEnv): Response {
  if (request.method !== 'GET') {
    return new Response(null, { status: 405 })
  }
  const headers = buildHeaders()
  const body = buildBody(env)

  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers,
  })
}

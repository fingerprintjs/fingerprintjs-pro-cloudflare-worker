import { WorkerEnv, isScriptDownloadPathSet, isWorkerPathSet, isGetResultPathSet } from '../env'

function buildHeaders(): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'text/html')
  return headers
}

function addWorkerVersion(): string {
  return `
  <span>
  Worker version: __current_worker_version__
  </span>
  `
}

function addContactInformation(): string {
  return `
  <span>
  Please reach out our support via <a href='mailto:support@fingerprint.com'>support@fingerprint.com</a> if you have any issues
  </span>
  `
}

function addEnvVarsInformation(env: WorkerEnv): string {
  const isWorkerPathAvailable = isWorkerPathSet(env)
  const isScriptDownloadPathAvailable = isScriptDownloadPathSet(env)
  const isGetResultPathAvailable = isGetResultPathSet(env)
  const isAllVarsAvailable = isWorkerPathAvailable && isScriptDownloadPathAvailable && isGetResultPathAvailable

  let result = ''
  if (!isAllVarsAvailable) {
    result += `
    <span>
    The following environment variables are not defined. Please reach out our support team.
    </span>
    `
    if (!isWorkerPathAvailable) {
      result += `
      <span>
      WORKER_PATH variable is not defined
      </span>
      `
    }
    if (!isScriptDownloadPathAvailable) {
      result += `
      <span>
      SCRIPT_DOWNLOAD_PATH is not defined
      </span>
      `
    }
    if (!isGetResultPathAvailable) {
      result += `
      <span>
      GET_RESULT_PATH is not defined
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
  <html lang="en-US">
  <head>
    <meta charset="utf-8"/>
  </head>
  <style>
    span {
      display: block;
      padding-top: 1em;
      padding-bottom: 1em;
      text-align: center;
    }
  </style>
  <body>
  `

  body += `<span>Your worker is deployed</span>`

  body += addWorkerVersion()
  body += addEnvVarsInformation(env)
  body += addContactInformation()

  body += `  
  </body>
  </html>
  `
  return body
}

export function handleStatusPage(env: WorkerEnv): Response {
  const headers = buildHeaders()
  const body = buildBody(env)

  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers,
  })
}

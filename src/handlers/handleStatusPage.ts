import { WorkerEnv, isScriptDownloadPathSet, isWorkerPathSet, isGetResultPathSet } from '../env'
import renderStatusTemplate from './templates/status.ejs'

function buildHeaders(): Headers {
  const headers = new Headers()
  headers.append('Content-Type', 'text/html')
  return headers
}

function buildBody(env: WorkerEnv): string {
  const isWorkerPathAvailable = isWorkerPathSet(env)
  const isScriptDownloadPathAvailable = isScriptDownloadPathSet(env)
  const isGetResultPathAvailable = isGetResultPathSet(env)
  const isAllVarsAvailable = isWorkerPathAvailable && isScriptDownloadPathAvailable && isGetResultPathAvailable

  return renderStatusTemplate({
    workerVersion: '__current_worker_version__',
    isAllVarsAvailable: isAllVarsAvailable,
    isWorkerPathAvailable: isWorkerPathAvailable,
    isScriptDownloadPathAvailable: isScriptDownloadPathAvailable,
    isGetResultPathAvailable: isGetResultPathAvailable,
  })
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

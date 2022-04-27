import { handleRequest } from './handler'
import { WorkerEnv } from './env'
import { createErrorResponse, returnHttpResponse } from './utils'

export default {
  async fetch(request: Request, env: WorkerEnv) {
    try {
      return await handleRequest(request, env).then(returnHttpResponse)
    } catch (e) {
      return createErrorResponse(e)
    }
  },
}

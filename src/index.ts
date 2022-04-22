import { handleRequest } from './handler'
import { WorkerEnv } from './env'
import { createErrorResponse } from './utils'

export default {
  async fetch(request: Request, env: WorkerEnv) {
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return createErrorResponse(e)
    }
  },
}

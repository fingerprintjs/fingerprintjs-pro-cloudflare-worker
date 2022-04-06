import { handleRequest } from './handler'
import { WorkerEnv } from './env'

export default {
  async fetch(request: Request, env: WorkerEnv) {
    return await handleRequest(request, env)
  },
}

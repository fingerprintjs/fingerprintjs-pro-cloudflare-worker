import { handleRequest } from './handler'
import { WorkerEnv } from './env'
import { returnHttpResponse } from './utils'

console.log('test')
export default {
  async fetch(request: Request, env: WorkerEnv) {
    return handleRequest(request, env).then(returnHttpResponse)
  },
}

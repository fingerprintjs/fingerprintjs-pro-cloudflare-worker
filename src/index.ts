import { handleRequest } from './handler'

export default {
  async fetch(request: Request, env: any) {
    return await handleRequest(request, env)
  },
}

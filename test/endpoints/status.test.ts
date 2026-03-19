import worker from '../../src'
import { config } from '../../src/config'
import { WorkerEnv } from '../../src/env'

const workerEnv: WorkerEnv = {
  FPJS_CDN_URL: config.fpcdn,
  FPJS_INGRESS_BASE_HOST: config.ingressApi,
  PROXY_SECRET: 'proxy_secret',
  GET_RESULT_PATH: 'get_result',
  AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
}

describe('status page', () => {
  test('returns 404 for GET requests', async () => {
    const req = new Request('http://localhost/worker_path/status')
    const response = await worker.fetch(req, workerEnv)
    expect(response.status).toBe(404)
  })

  test('returns 404 for POST requests', async () => {
    const req = new Request('http://localhost/worker_path/status', { method: 'POST' })
    const response = await worker.fetch(req, workerEnv)
    expect(response.status).toBe(404)
  })
})

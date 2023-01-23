import worker from '../../src'
import { WorkerEnv } from '../../src/env'

describe('status', () => {
  test('renders the status page', async () => {
    const workerEnv: WorkerEnv = {
      WORKER_PATH: 'worker_path',
      PROXY_SECRET: null,
      GET_RESULT_PATH: 'get_result',
      AGENT_SCRIPT_DOWNLOAD_PATH: 'agent_download',
    }
    const req = new Request('http://localhost/worker_path/status')
    const response = await worker.fetch(req, workerEnv)
    expect(await response.text()).toMatchSnapshot()
  })
})

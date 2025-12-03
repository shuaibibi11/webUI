import axios from 'axios'

const host = () => (process.env.BISHENG_HOST || '').replace(/\/$/, '')
const timeout = () => parseInt(process.env.BISHENG_TIMEOUT_MS || '30000')

export const invokeWorkflow = async (payload: any, opts?: { stream?: boolean }) => {
  const h = host()
  if (!h) throw new Error('BISHENG_HOST missing')
  const url = h + '/v2/workflow/invoke'
  const instance = axios.create({ timeout: timeout(), responseType: (opts?.stream ? 'stream' : 'json') })
  return instance.post(url, payload, { headers: { 'Content-Type': 'application/json' } })
}

export const stopWorkflow = async (payload: any) => {
  const h = host()
  if (!h) throw new Error('BISHENG_HOST missing')
  const url = h + '/v2/workflow/stop'
  const instance = axios.create({ timeout: timeout() })
  return instance.post(url, payload, { headers: { 'Content-Type': 'application/json' } })
}

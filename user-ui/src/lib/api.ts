export type ApiClient = {
  req: (path: string, opt?: RequestInit) => Promise<any>
}

export function createApi(): ApiClient {
  const base = '/api'
  const token = sessionStorage.getItem('access_token') || ''
  return {
    async req(path: string, opt: RequestInit = {}) {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = 'Bearer ' + token
      const r = await fetch(base + path, { ...opt, headers: { ...headers, ...(opt.headers||{}) } })
      let b: any = {}
      try { b = await r.json() } catch {}
      if (!r.ok) throw new Error(b.error || ('HTTP ' + r.status))
      return b
    }
  }
}

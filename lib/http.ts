export type FetchJsonOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
  signal?: AbortSignal
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15000, signal, ...rest } = init
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(new Error('Request timeout')), timeoutMs)

  try {
    return await fetch(input, { ...rest, signal: signal ?? ac.signal })
  } finally {
    clearTimeout(t)
  }
}

export async function fetchJson<T = any>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 15000,
    retries = 1,
    retryDelayMs = 300,
    signal,
  } = opts

  let lastErr: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const init: RequestInit & { timeoutMs?: number } = {
        method,
        headers: { ...headers },
        timeoutMs,
        signal,
      }
      if (body !== undefined) {
        init.body = typeof body === 'string' ? body : JSON.stringify(body)
        if (!init.headers!['Content-Type']) init.headers!['Content-Type'] = 'application/json'
      }

      const res = await fetchWithTimeout(url, init)
      let data: any = null
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        try { data = await res.json() } catch { data = null }
      } else {
        try { data = await res.text() } catch { data = null }
      }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `${res.status} ${res.statusText}`
        const err: any = new Error(msg)
        err.status = res.status
        err.data = data
        // Retry only on network/5xx
        if (res.status >= 500 && attempt < retries) {
          await sleep(retryDelayMs * (attempt + 1))
          continue
        }
        throw err
      }

      return data as T
    } catch (e: any) {
      lastErr = e
      const isAbort = e?.name === 'AbortError' || /timeout/i.test(String(e?.message))
      const isNetwork = !('status' in (e || {}))
      if ((isAbort || isNetwork) && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1))
        continue
      }
      break
    }
  }
  throw lastErr || new Error('Request failed')
}

'use client'

import { useEffect, useState } from 'react'

type Row = { step: string; ok: boolean; status?: number; ms?: number; note?: string }

export default function DebugAuth() {
  const [rows, setRows] = useState<Row[]>([])
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  useEffect(() => {
    const run = async () => {
      const out: Row[] = []
      const t0 = performance.now()
      try {
        const r = await fetch(`${url}/auth/v1/health`, { cache: 'no-store', mode: 'cors' })
        out.push({ step: 'GET /auth/v1/health', ok: r.ok, status: r.status, ms: Math.round(performance.now() - t0) })
      } catch (e: any) {
        out.push({ step: 'GET /auth/v1/health', ok: false, note: e?.message, ms: Math.round(performance.now() - t0) })
      }

      const t1 = performance.now()
      try {
        const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
          body: JSON.stringify({ email: 'invalid@example.com', password: 'x' }),
          cache: 'no-store',
          mode: 'cors',
        })
        out.push({ step: 'POST /auth/v1/token (invalid creds)', ok: r.ok, status: r.status, ms: Math.round(performance.now() - t1) })
      } catch (e: any) {
        out.push({ step: 'POST /auth/v1/token (invalid creds)', ok: false, note: e?.message, ms: Math.round(performance.now() - t1) })
      }

      setRows(out)
    }
    run()
  }, [url])

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-4">
      <h1 className="text-xl font-semibold">Debug Auth Connectivity</h1>
      <div className="text-sm text-gray-300">Port: {typeof window !== 'undefined' ? window.location.port : 'n/a'} | URL: {url || 'N/A'}</div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className={`p-3 rounded ${r.ok ? 'bg-emerald-900/40' : 'bg-rose-900/40'}`}>
            <div className="font-mono">{r.step}</div>
            <div className="text-sm">ok: {String(r.ok)} | status: {r.status ?? '-'} | ms: {r.ms ?? '-'} | note: {r.note ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

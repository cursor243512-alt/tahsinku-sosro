'use client'

import { useEffect, useState } from 'react'

export default function SWReset() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    ;(async () => {
      const lines: string[] = []
      try {
        if ('serviceWorker' in navigator && (navigator as any).serviceWorker?.getRegistrations) {
          const regs = await (navigator as any).serviceWorker.getRegistrations()
          lines.push('sw_registrations=' + regs.length)
          await Promise.all(regs.map((r: any) => r.unregister()))
        } else {
          lines.push('sw_api_unavailable')
        }
      } catch (e: any) {
        lines.push('sw_error=' + (e?.message || String(e)))
      }
      try {
        if ((window as any).caches?.keys) {
          const keys = await caches.keys()
          lines.push('cache_keys=' + keys.length)
          await Promise.all(keys.map((k) => caches.delete(k)))
        } else {
          lines.push('cache_api_unavailable')
        }
      } catch (e: any) {
        lines.push('cache_error=' + (e?.message || String(e)))
      }
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e: any) {
        lines.push('storage_error=' + (e?.message || String(e)))
      }
      setLog(lines)
      setTimeout(() => location.reload(), 500)
    })()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <h1 className="text-xl font-semibold mb-3">Reset SW & Cache</h1>
      <p className="mb-2">Membersihkan service worker, caches, localStorage, dan sessionStorage.</p>
      <pre className="bg-black/40 p-3 rounded whitespace-pre-wrap">{log.join('\n')}</pre>
      <p className="mt-2 text-sm text-gray-300">Halaman akan memuat ulang otomatis.</p>
    </div>
  )
}

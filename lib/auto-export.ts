import { supabase } from './supabase'

type ExportType = 'participants' | 'instructors' | 'payments' | 'attendance'

export async function autoExport(type: ExportType, silent = false) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      if (!silent) console.warn('[auto-export] No session, skipping export')
      return { success: false, error: 'No session' }
    }

    const res = await fetch(`/api/export/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (res.ok) {
      const data = await res.json()
      if (!silent) {
        console.log(`[auto-export] ${type} synced: ${data.rowCount} rows`)
      }
      return { success: true, data }
    } else {
      const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
      if (!silent) {
        console.error(`[auto-export] ${type} failed (${res.status}):`, errData)
      }
      return { success: false, error: errData.error || `HTTP ${res.status}` }
    }
  } catch (e: any) {
    const errorMsg = e?.message || String(e) || 'Unknown error'
    if (!silent) {
      console.error(`[auto-export] ${type} exception:`, errorMsg, e)
    }
    return { success: false, error: errorMsg }
  }
}

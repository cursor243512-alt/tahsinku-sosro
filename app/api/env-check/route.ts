import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null

  const anonKey = key
    ? { exists: true, length: key.length, prefix: key.slice(0, 6), suffix: key.slice(-4) }
    : { exists: false, length: 0 }

  const supabaseUrlValid = !!url && /^https?:\/\/.+\.supabase\.co\/?$/.test(url)
  const projectRef = url ? url.replace(/^https?:\/\//, '').split('.')[0] : null

  return NextResponse.json({
    supabaseUrl: url,
    supabaseUrlValid,
    projectRef,
    anonKey,
    now: new Date().toISOString(),
  })
}

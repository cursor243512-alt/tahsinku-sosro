import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const setupToken = process.env.ADMIN_SETUP_TOKEN

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }
  if (!setupToken) {
    return NextResponse.json(
      { error: 'Missing ADMIN_SETUP_TOKEN env for protection' },
      { status: 500 }
    )
  }

  const headerToken = (req.headers.get('x-setup-token') || '')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (headerToken !== setupToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch (_) {}

  const email = String(body?.email || '').trim()
  const password = String(body?.password || '').trim()
  const display_name = (body?.display_name ?? null) as string | null

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }

  const supabase = createSupabaseClient(url, serviceKey)

  // Try create user in Auth (idempotent)
  let createdUser = false
  let userId: string | null = null
  const createRes = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createRes.error) {
    // If user already exists, proceed
    const msg = (createRes.error?.message || '').toLowerCase()
    if (!msg.includes('already') && !msg.includes('registered') && !msg.includes('exists')) {
      return NextResponse.json({ error: createRes.error.message }, { status: 400 })
    }
  } else {
    createdUser = true
    userId = createRes.data.user?.id ?? null
  }

  // Ensure row in admins table (upsert by email)
  const upsert = await supabase
    .from('admins')
    .upsert({ email, display_name }, { onConflict: 'email' })
    .select('*')
    .single()

  if (upsert.error) {
    return NextResponse.json({ error: upsert.error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, createdUser, userId, admin: upsert.data }, { status: 200 })
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}

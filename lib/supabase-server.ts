import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { ensureServerOnly } from '@/lib/server-only'

ensureServerOnly()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Server-side supabase client for API routes with cookie handling
export async function createServerClient() {
  const cookieStore = await cookies()
  
  // Get all cookies and build auth header
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')
  )
  
  // Create client with cookies
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        cookie: authCookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    },
  })
  
  return supabase
}

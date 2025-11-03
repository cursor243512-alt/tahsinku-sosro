'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

type Admin = {
  id: string
  email: string
  display_name: string | null
}

type AuthContextType = {
  admin: Admin | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    console.debug('[auth] provider mounted')

    const checkSession = async () => {
      try {
        console.debug('[auth] checkSession start')
        const timeout = new Promise<any>((resolve) => setTimeout(() => resolve({ data: { session: null } }), 4000))
        const res: any = await Promise.race([supabase.auth.getSession(), timeout])
        const session = res?.data?.session || null
        console.debug('[auth] checkSession session?', !!session)

        if (session?.user) {
          try {
            const adminRes: any = await Promise.race([
              supabase.from('admins').select('*').eq('email', session.user.email).single(),
              new Promise((resolve) => setTimeout(() => resolve({ data: null }), 4000)),
            ])
            if (mounted && adminRes?.data) {
              setAdmin(adminRes.data)
              console.debug('[auth] admin loaded from DB')
            }
          } catch (_) {}
        }
      } catch (_) {
      } finally {
        if (mounted) {
          setLoading(false)
          console.debug('[auth] checkSession setLoading(false)')
        }
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth] onAuthStateChange', event, !!session)
      try {
        if (session?.user) {
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('email', session.user.email)
            .single()
          if (mounted && adminData) {
            setAdmin(adminData)
            console.debug('[auth] admin updated from onAuthStateChange')
          }
        } else {
          if (mounted) setAdmin(null)
        }
      } catch (_) {
      } finally {
        if (mounted) {
          setLoading(false)
          console.debug('[auth] onAuthStateChange setLoading(false)')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      console.debug('[auth] provider unmounted')
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout. Periksa koneksi internet Anda.')), 20000)
      )
      try {
        const res = (await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          timeout,
        ])) as { error?: any }
        if (res?.error) throw new Error(res.error.message || 'Login gagal')
      } catch (e) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const ctl = new AbortController()
        const id = setTimeout(() => ctl.abort(), 20000)
        const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: key },
          body: JSON.stringify({ email, password }),
          mode: 'cors',
          cache: 'no-store',
          signal: ctl.signal,
        })
        clearTimeout(id)
        if (!r.ok) {
          let msg = 'Login gagal'
          try { const j = await r.json(); msg = j?.error_description || j?.msg || msg } catch {}
          throw new Error(msg)
        }
        const j = await r.json()
        await supabase.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token })
      }

      try {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', email)
          .single()
        if (adminData) setAdmin(adminData)
      } catch (_) {}

      router.replace('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAdmin(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

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
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Fetch admin data
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', session.user.email)
          .single()
        
        if (adminData) {
          setAdmin(adminData)
        }
      }
      
      setLoading(false)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', session.user.email)
          .single()
        
        if (adminData) {
          setAdmin(adminData)
        }
      } else {
        setAdmin(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    router.push('/dashboard')
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

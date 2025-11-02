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
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Fetch admin data
          const { data: adminData, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', session.user.email)
            .single()
          
          if (adminData && !error) {
            setAdmin(adminData)
          } else {
            console.error('Error fetching admin data:', error)
            setAdmin(null)
          }
        } else {
          setAdmin(null)
        }
      } catch (error) {
        console.error('Session check error:', error)
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          setAdmin(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          const { data: adminData, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', session.user.email)
            .single()
          
          if (adminData && !error) {
            setAdmin(adminData)
          } else {
            console.error('Error fetching admin data on auth change:', error)
            setAdmin(null)
          }
        } else {
          setAdmin(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      // Refresh admin data after login
      if (data.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', data.user.email)
          .single()
        
        if (adminData) {
          setAdmin(adminData)
        }
      }

      router.push('/dashboard')
    } catch (error) {
      throw error
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

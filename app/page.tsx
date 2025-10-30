'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const router = useRouter()
  const { admin, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (admin) {
        router.replace('/dashboard/berlangganan')
      } else {
        router.replace('/login')
      }
    }
  }, [admin, loading, router])

  // Show nothing during redirect to avoid flash
  if (!loading) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="text-white text-xl animate-pulse">Memuat...</div>
    </div>
  )
}

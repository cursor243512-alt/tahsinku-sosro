'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, GraduationCap, Calendar, LogOut, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !admin) {
      router.push('/login')
    }
  }, [admin, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl">Memuat...</div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  const menuItems = [
    { href: '/dashboard/berlangganan', icon: Users, label: 'Berlangganan' },
    { href: '/dashboard/absensi', icon: UserCheck, label: 'Absensi' },
    { href: '/dashboard/peserta', icon: UserPlus, label: 'Manajemen Peserta' },
    { href: '/dashboard/pengajar', icon: GraduationCap, label: 'Pengajar' },
    { href: '/dashboard/jadwal', icon: Calendar, label: 'Jadwal' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">TahsinKu Dashboard</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut} 
            className="text-white border border-white/20 hover:bg-white/20 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-900/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      isActive 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

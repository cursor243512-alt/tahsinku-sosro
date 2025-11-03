'use client'

import { useEffect, useState, useMemo } from 'react'
import { useEnrollmentsPaged, useUpdateEnrollmentStatus } from '@/lib/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { loadClient } from '@/lib/dynamic'
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

const ExportButton = loadClient(() => import('@/components/export-button').then(m => m.ExportButton as any))

type SortField = 'participant_name' | 'teacher_name' | 'class_type' | 'start_date' | 'due_date'
type SortDirection = 'asc' | 'desc' | null

// Local type for enrollment rows used in this page
type Enrollment = {
  id: string
  participant_name: string
  teacher_name: string
  class_name?: string
  class_type: string
  start_date: string
  due_date: string
  status: 'lunas' | 'menunggu_pembayaran' | string
}

export default function BerlanggananPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data: paged, isLoading } = useEnrollmentsPaged(page, pageSize)
  const enrollments = paged?.rows || []
  const updateStatusMutation = useUpdateEnrollmentStatus()
  const queryClient = useQueryClient()
  const { admin } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  // debounce 300ms
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState<string>('')

  // Memoized filtered and sorted data
  const filteredEnrollments = useMemo(() => {
    let result = [...enrollments]

    // Search filter
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase()
      result = result.filter(e => 
        e.participant_name.toLowerCase().includes(query) ||
        e.teacher_name.toLowerCase().includes(query) ||
        (e.class_name?.toLowerCase() || '').includes(query)
      )
    }

    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: any = a[sortField]
        let bVal: any = b[sortField]

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })
    }

    return result
  }, [enrollments, debouncedQuery, sortField, sortDirection])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 ml-1 inline text-blue-500" />
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4 ml-1 inline text-blue-500" />
    return <ArrowUpDown className="w-4 h-4 ml-1 inline" />
  }

  const beginEditDate = (id: string, currentStart?: string) => {
    setEditingId(id)
    try {
      const init = currentStart ? format(parseISO(currentStart), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
      setEditingDate(init)
    } catch {
      setEditingDate(format(new Date(), 'yyyy-MM-dd'))
    }
  }

  const cancelEditDate = () => {
    setEditingId(null)
    setEditingDate('')
  }

  const saveEditDate = async (id: string) => {
    if (!editingDate) {
      alert('Tanggal tidak boleh kosong')
      return
    }
    const base = parseISO(editingDate)
    if (isNaN(base.getTime())) {
      alert('Format tanggal tidak valid. Gunakan YYYY-MM-DD')
      return
    }
    const due = addDays(base, 28)
    const updates: any = {
      start_date: format(base, 'yyyy-MM-dd'),
      due_date: format(due, 'yyyy-MM-dd'),
      // Selalu bukan 'lunas' setelah set tanggal; admin akan menandai lunas secara manual
      status: 'menunggu_pembayaran',
    }

    const { error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', id)

    if (error) {
      alert('Gagal memperbarui tanggal: ' + error.message)
      return
    }
    queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as any[])[0] === 'enrollments',
    })
    cancelEditDate()
    alert('Tanggal berhasil diatur untuk baris ini')
  }

  const getComputedStatus = (enrollment: Enrollment) => {
    if (!enrollment.due_date) return enrollment.status === 'lunas' ? 'sedang_berlangsung' as const : 'menunggu_pembayaran' as const
    const today = new Date()
    const due = parseISO(enrollment.due_date)
    const daysLeft = differenceInCalendarDays(due, today)
    if (daysLeft < 0) return 'menunggu_pembayaran' as const
    if (daysLeft <= 7) return 'belum_jatuh_tempo' as const
    return enrollment.status === 'lunas' ? 'sedang_berlangsung' as const : 'menunggu_pembayaran' as const
  }

  const getStatusBadge = (enrollment: Enrollment) => {
    const status = getComputedStatus(enrollment)
    if (status === 'menunggu_pembayaran') return <Badge className="bg-red-600">Menunggu Pembayaran</Badge>
    if (status === 'belum_jatuh_tempo') return <Badge className="bg-yellow-600">Belum Jatuh Tempo</Badge>
    if (status === 'sedang_berlangsung') return <Badge className="bg-blue-600">Sedang Berlangsung</Badge>
    return null
  }
  
  const isNearDueDate = (dueDate: string) => {
    if (!dueDate) return false
    
    const today = new Date()
    const dueDateObj = new Date(dueDate)
    const diffTime = dueDateObj.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays >= 0 && diffDays <= 7
  }

  const handleBulkSetStartDate = async () => {
    const input = typeof window !== 'undefined' ? window.prompt('Masukkan Tanggal Daftar (format YYYY-MM-DD)', '2025-10-26') : null
    if (!input) return
    const base = new Date(input)
    if (isNaN(base.getTime())) {
      alert('Format tanggal tidak valid. Gunakan YYYY-MM-DD (misal 2025-10-26)')
      return
    }
    const due = addDays(base, 28)
    const today = new Date()
    const statusForAll: 'lunas' | 'menunggu_pembayaran' = differenceInCalendarDays(due, today) < 0 ? 'menunggu_pembayaran' : 'lunas'
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        start_date: format(base, 'yyyy-MM-dd'),
        due_date: format(due, 'yyyy-MM-dd'),
        status: statusForAll,
      })
      // PostgREST melarang update tanpa filter; gunakan filter aman untuk menjangkau semua baris
      .not('id', 'is', null)
      .select('id')

    if (error) {
      console.error('Bulk set date failed:', error)
      alert('Gagal memperbarui tanggal: ' + error.message)
      return
    }

    queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as any[])[0] === 'enrollments',
    })
    alert(`Tanggal diperbarui untuk ${data?.length ?? 0} baris. Semua Tanggal Daftar diset ke 26 Oktober 2025 dan Jatuh Tempo otomatis dibuat`)
  }

  const handleSyncStatus = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    // Set overdue (non-lunas) to menunggu_pembayaran
    const { error: errOverdue } = await supabase
      .from('enrollments')
      .update({ status: 'menunggu_pembayaran' })
      .lt('due_date', todayStr)
      .neq('status', 'lunas')
    if (errOverdue) {
      alert('Gagal menyinkronkan status (overdue): ' + errOverdue.message)
      return
    }
    // Jangan mengubah baris lain (termasuk yang masih belum jatuh tempo); Lunas tetap harus manual

    queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as any[])[0] === 'enrollments',
    })
    alert('Status berhasil disinkronkan berdasarkan tanggal jatuh tempo')
  }

  const handleUpdateStatus = async (id: string, status: 'lunas' | 'menunggu_pembayaran') => {
    if (status === 'lunas') {
      if (!admin) {
        alert('Tidak ada admin aktif')
        return
      }
      const ok = typeof window !== 'undefined' ? window.confirm('Konfirmasi: Proses Bayar (perpanjang) untuk peserta ini?') : false
      if (!ok) return
    }

    updateStatusMutation.mutate({ id, status }, {
      onSuccess: () => {
        alert('Status berhasil diupdate!')
      },
      onError: (error) => {
        const msg = (error as any)?.message || (typeof error === 'string' ? error : JSON.stringify(error))
        console.error('Error updating status:', msg)
        alert('Gagal mengubah status: ' + msg)
      },
    })
  }

  if (isLoading) {
    return <div className="text-white">Memuat data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Manajemen Berlangganan</h2>
          <p className="text-gray-300">Cari Peserta</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSyncStatus} className="bg-amber-600 hover:bg-amber-700">Sinkronkan Status</Button>
          <ExportButton type="payments" label="Export ke Sheets" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Ketik nama peserta, pengajar, atau kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white/5">
              <TableHead className="text-gray-300">
                <button onClick={() => toggleSort('participant_name')} className="flex items-center font-semibold">
                  Nama Peserta {getSortIcon('participant_name')}
                </button>
              </TableHead>
              <TableHead className="text-gray-300">
                <button onClick={() => toggleSort('teacher_name')} className="flex items-center font-semibold">
                  Pengajar {getSortIcon('teacher_name')}
                </button>
              </TableHead>
              <TableHead className="text-gray-300">
                <button onClick={() => toggleSort('class_type')} className="flex items-center font-semibold">
                  Kelas {getSortIcon('class_type')}
                </button>
              </TableHead>
              <TableHead className="text-gray-300">
                <button onClick={() => toggleSort('start_date')} className="flex items-center font-semibold">
                  Tanggal Daftar {getSortIcon('start_date')}
                </button>
              </TableHead>
              <TableHead className="text-gray-300">
                <button onClick={() => toggleSort('due_date')} className="flex items-center font-semibold">
                  Jatuh Tempo {getSortIcon('due_date')}
                </button>
              </TableHead>
              <TableHead className="text-gray-300 font-semibold">Status</TableHead>
              <TableHead className="text-gray-300 font-semibold sticky right-0 bg-white/10 backdrop-blur-sm">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data berlangganan'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{enrollment.participant_name}</TableCell>
                  <TableCell className="text-gray-300">{enrollment.teacher_name}</TableCell>
                  <TableCell className="text-gray-300 capitalize">{enrollment.class_type}</TableCell>
                  <TableCell className="text-gray-300">
                    {enrollment.start_date ? format(parseISO(enrollment.start_date), 'd MMMM yyyy', { locale: idLocale }) : '-'}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {enrollment.due_date ? format(parseISO(enrollment.due_date), 'd MMMM yyyy', { locale: idLocale }) : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment)}</TableCell>
                  <TableCell className="sticky right-0 bg-white/10 backdrop-blur-sm space-x-2">
                    {editingId === enrollment.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                          className="bg-white text-black rounded px-2 py-1"
                        />
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => saveEditDate(enrollment.id)}>
                          Simpan
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditDate}>
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => beginEditDate(enrollment.id, enrollment.start_date)}
                        disabled={updateStatusMutation.isPending}
                      >
                        Set Tanggal
                      </Button>
                    )}
                    {(() => {
                      const cs = getComputedStatus(enrollment)
                      if (cs === 'sedang_berlangsung') {
                        return (
                          <Button size="sm" disabled className="bg-green-600 opacity-70 cursor-not-allowed">Lunas</Button>
                        )
                      }
                      if (cs === 'belum_jatuh_tempo' || cs === 'menunggu_pembayaran') {
                        return (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(enrollment.id, 'lunas')}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={updateStatusMutation.isPending}
                          >
                            {updateStatusMutation.isPending ? 'Memproses...' : 'Bayar'}
                          </Button>
                        )
                      }
                      return null
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden space-y-3">
        {filteredEnrollments.length === 0 ? (
          <div className="text-center text-gray-400 py-6">{searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data berlangganan'}</div>
        ) : (
          filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">{enrollment.participant_name}</div>
                <div>{getStatusBadge(enrollment)}</div>
              </div>
              <div className="text-gray-300 text-sm mt-2">
                <div className="flex justify-between"><span>Pengajar</span><span className="ml-2">{enrollment.teacher_name}</span></div>
                <div className="flex justify-between"><span>Kelas</span><span className="ml-2 capitalize">{enrollment.class_type}</span></div>
                <div className="flex justify-between"><span>Tgl Daftar</span><span className="ml-2">{enrollment.start_date ? format(parseISO(enrollment.start_date), 'd MMM yy', { locale: idLocale }) : '-'}</span></div>
                <div className="flex justify-between"><span>Jatuh Tempo</span><span className="ml-2">{enrollment.due_date ? format(parseISO(enrollment.due_date), 'd MMM yy', { locale: idLocale }) : '-'}</span></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {editingId === enrollment.id ? (
                  <>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      className="bg-white text-black rounded px-2 py-1 flex-1 min-w-[140px]"
                    />
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => saveEditDate(enrollment.id)}>
                      Simpan
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditDate}>
                      Batal
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginEditDate(enrollment.id, enrollment.start_date)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Set Tanggal
                  </Button>
                )}
                {(() => {
                  const cs = getComputedStatus(enrollment)
                  if (cs === 'sedang_berlangsung') {
                    return (
                      <Button size="sm" disabled className="bg-green-600 opacity-70 cursor-not-allowed">Lunas</Button>
                    )
                  }
                  if (cs === 'belum_jatuh_tempo' || cs === 'menunggu_pembayaran') {
                    return (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(enrollment.id, 'lunas')}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? 'Memproses...' : 'Bayar'}
                      </Button>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-gray-300">
        <div>
          Halaman {page} dari {Math.max(1, Math.ceil((paged?.total || 0) / pageSize))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => {
              const max = Math.max(1, Math.ceil((paged?.total || 0) / pageSize))
              return Math.min(max, p + 1)
            })}
            disabled={page >= Math.max(1, Math.ceil((paged?.total || 0) / pageSize))}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useEnrollmentsPaged, useUpdateEnrollmentStatus } from '@/lib/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { loadClient } from '@/lib/dynamic'
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

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
  
  const [searchQuery, setSearchQuery] = useState('')
  // debounce 300ms
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Memoized filtered and sorted data
  const filteredEnrollments = useMemo(() => {
    let result = [...enrollments]

    // Search filter
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase()
      result = result.filter(e => 
        e.participant_name.toLowerCase().includes(query) ||
        e.teacher_name.toLowerCase().includes(query) ||
        e.class_name.toLowerCase().includes(query)
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

  const getStatusBadge = (enrollment: Enrollment) => {
    const today = new Date()
    const dueDate = new Date(enrollment.due_date)
    
    if (enrollment.status === 'lunas') {
      return <Badge className="bg-green-600">Lunas</Badge>
    }
    
    if (today > dueDate) {
      return <Badge className="bg-red-600">Menunggu Pembayaran</Badge>
    }
    
    // Hitung selisih hari antara hari ini dan tanggal jatuh tempo
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Jika kurang dari atau sama dengan 7 hari menuju jatuh tempo
    if (diffDays <= 7) {
      return <Badge className="bg-yellow-600">Jatuh Tempo {diffDays} Hari Lagi</Badge>
    }
    
    return <Badge className="bg-blue-600">Belum Jatuh Tempo</Badge>
  }

  const handleUpdateStatus = (id: string, status: 'lunas' | 'menunggu_pembayaran') => {
    updateStatusMutation.mutate({ id, status }, {
      onSuccess: () => {
        alert('Status berhasil diupdate!')
      },
      onError: (error) => {
        console.error('Error updating status:', error)
        alert('Gagal mengubah status')
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
          <h2 className="text-3xl font-bold text-white mb-2">Manajemen Berlangganan</h2>
          <p className="text-gray-300">Cari Peserta</p>
        </div>
        <ExportButton type="payments" label="Export ke Sheets" />
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
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-x-auto">
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
              <TableHead className="text-gray-300 font-semibold">Aksi</TableHead>
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
                    {format(new Date(enrollment.start_date), 'd MMMM yyyy', { locale: idLocale })}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {format(new Date(enrollment.due_date), 'd MMMM yyyy', { locale: idLocale })}
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment)}</TableCell>
                  <TableCell>
                    {enrollment.status === 'menunggu_pembayaran' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(enrollment.id, 'lunas')}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? 'Menyimpan...' : 'Tandai Lunas'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

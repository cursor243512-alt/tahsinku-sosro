'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useParticipantsPaged } from '@/lib/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus, UserPlus } from 'lucide-react'
import { loadClient } from '@/lib/dynamic'
import { format } from 'date-fns'

const ExportButton = loadClient(() => import('@/components/export-button').then(m => m.ExportButton as any))

type Participant = {
  id: string
  name: string
  address: string | null
  whatsapp: string | null
  gender: string | null
  job: string | null
  created_at: string
}

type Class = {
  id: string
  name: string
  type: string
  teacher_id: string
  teacher_name: string
}

export default function PesertaPage() {
  const queryClient = useQueryClient()
  const [classes, setClasses] = useState<Class[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    whatsapp: '',
    gender: '',
    job: '',
  })

  const [enrollData, setEnrollData] = useState({
    class_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
  })

  // pagination + search
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])
  const { data: paged, isLoading } = useParticipantsPaged(page, pageSize, debouncedSearch)
  const participants = paged?.rows || []

  useEffect(() => {
    fetchClasses()
  }, [])

  // removed manual fetchParticipants; using hook above

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          type,
          teacher_id,
          teachers!classes_teacher_id_fkey(name)
        `)
        .order('type')

      if (error) throw error

      const formatted = data?.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        teacher_id: c.teacher_id,
        teacher_name: (c.teachers as any)?.name || '-',
      })) || []

      setClasses(formatted)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingParticipant) {
        // Update
        const { error } = await supabase
          .from('participants')
          .update(formData)
          .eq('id', editingParticipant.id)

        if (error) throw error
        alert('Data peserta berhasil diupdate!')
      } else {
        // Insert
        const { error } = await supabase
          .from('participants')
          .insert([formData])

        if (error) throw error
        alert('Peserta baru berhasil ditambahkan!')
      }

      setIsDialogOpen(false)
      setEditingParticipant(null)
      setFormData({ name: '', address: '', whatsapp: '', gender: '', job: '' })
      queryClient.invalidateQueries({ queryKey: ['participants','paged'] })
    } catch (error: any) {
      console.error('Error saving participant:', error)
      alert('Gagal menyimpan data: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus peserta ini?')) return

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Peserta berhasil dihapus!')
      queryClient.invalidateQueries({ queryKey: ['participants','paged'] })
    } catch (error: any) {
      console.error('Error deleting participant:', error)
      alert('Gagal menghapus peserta: ' + error.message)
    }
  }

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant)
    setFormData({
      name: participant.name,
      address: participant.address || '',
      whatsapp: participant.whatsapp || '',
      gender: participant.gender || '',
      job: participant.job || '',
    })
    setIsDialogOpen(true)
  }

  const openEnrollDialog = (participant: Participant) => {
    setSelectedParticipant(participant)
    setEnrollData({
      class_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
    })
    setIsEnrollDialogOpen(true)
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedParticipant || !enrollData.class_id) {
      alert('Pastikan kelas dipilih')
      return
    }

    try {
      const selectedClass = classes.find(c => c.id === enrollData.class_id)
      if (!selectedClass) throw new Error('Kelas tidak ditemukan')

      // Calculate due_date (start_date + 28 days)
      const startDate = new Date(enrollData.start_date)
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + 28)

      const { error } = await supabase
        .from('enrollments')
        .insert([{
          participant_id: selectedParticipant.id,
          teacher_id: selectedClass.teacher_id,
          class_id: enrollData.class_id,
          start_date: enrollData.start_date,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          status: 'menunggu_pembayaran',
        }])

      if (error) throw error

      alert('Peserta berhasil didaftarkan ke kelas!')
      setIsEnrollDialogOpen(false)
      setSelectedParticipant(null)
    } catch (error: any) {
      console.error('Error enrolling participant:', error)
      alert('Gagal mendaftarkan peserta: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Manajemen Peserta</h2>
          <p className="text-gray-300">Kelola data peserta tahsin</p>
        </div>

        <div className="flex gap-2 flex-wrap md:justify-end">
          <ExportButton type="participants" />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingParticipant(null)
                setFormData({ name: '', address: '', whatsapp: '', gender: '', job: '' })
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Peserta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-white/20">
            <DialogHeader>
              <DialogTitle>{editingParticipant ? 'Edit Peserta' : 'Tambah Peserta Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Nomor WhatsApp</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pekerjaan</Label>
                <Input
                  value={formData.job}
                  onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                {editingParticipant ? 'Update' : 'Simpan'}
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Cari nama/alamat/whatsapp/pekerjaan..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Daftarkan ke Kelas</DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <form onSubmit={handleEnroll} className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <p className="text-lg font-semibold">{selectedParticipant.name}</p>
                  <p className="text-sm text-gray-400">{selectedParticipant.whatsapp}</p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Pilih Kelas *</Label>
                <Select value={enrollData.class_id} onValueChange={(value) => setEnrollData({ ...enrollData, class_id: value })}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.teacher_name} ({cls.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Daftar *</Label>
                <Input
                  type="date"
                  value={enrollData.start_date}
                  onChange={(e) => setEnrollData({ ...enrollData, start_date: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Daftarkan
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white/5">
              <TableHead className="text-gray-300 font-semibold">Nama</TableHead>
              <TableHead className="text-gray-300 font-semibold">Alamat</TableHead>
              <TableHead className="text-gray-300 font-semibold">WhatsApp</TableHead>
              <TableHead className="text-gray-300 font-semibold">Jenis Kelamin</TableHead>
              <TableHead className="text-gray-300 font-semibold">Pekerjaan</TableHead>
              <TableHead className="text-gray-300 font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  Belum ada data peserta
                </TableCell>
              </TableRow>
            ) : (
              participants.map((participant) => (
                <TableRow key={participant.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{participant.name}</TableCell>
                  <TableCell className="text-gray-300">{participant.address || '-'}</TableCell>
                  <TableCell className="text-gray-300">{participant.whatsapp || '-'}</TableCell>
                  <TableCell className="text-gray-300">{participant.gender || '-'}</TableCell>
                  <TableCell className="text-gray-300">{participant.job || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                        onClick={() => openEnrollDialog(participant)}
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => handleEdit(participant)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(participant.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Memuat data...</div>
        ) : participants.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Belum ada data peserta</div>
        ) : (
          participants.map((participant) => (
            <div key={participant.id} className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-3">
              <div className="text-white font-semibold break-words">{participant.name}</div>
              <div className="text-gray-300 text-sm mt-2 space-y-1">
                <div className="flex justify-between"><span>Alamat</span><span className="ml-2 break-words text-right">{participant.address || '-'}</span></div>
                <div className="flex justify-between"><span>WhatsApp</span><span className="ml-2 text-right">{participant.whatsapp || '-'}</span></div>
                <div className="flex justify-between"><span>Jenis Kelamin</span><span className="ml-2">{participant.gender || '-'}</span></div>
                <div className="flex justify-between"><span>Pekerjaan</span><span className="ml-2 break-words text-right">{participant.job || '-'}</span></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                  onClick={() => openEnrollDialog(participant)}
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                  onClick={() => handleEdit(participant)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleDelete(participant.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pencil, Trash2, Plus, GraduationCap } from 'lucide-react'
import { loadClient } from '@/lib/dynamic'
import { 
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  useClasses,
  useCreateClass,
  useDeleteClass,
} from '@/lib/hooks/use-data'

const ExportButton = loadClient(() => import('@/components/export-button').then(m => m.ExportButton as any))

type Teacher = {
  id: string
  name: string
  phone: string | null
  gender: string | null
  address: string | null
  notes: string | null
  created_at: string
}

type Class = {
  id: string
  type: string
  name: string
  capacity: number
  days: string[]
  time: string
  teacher_id: string
}

const DAYS_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function PengajarPage() {
  const { data: teachers = [], isLoading: loading } = useTeachers()
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false)
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const { data: teacherClasses = [] } = useClasses(selectedTeacher?.id || '')

  const createTeacher = useCreateTeacher()
  const updateTeacher = useUpdateTeacher()
  const deleteTeacher = useDeleteTeacher()
  const createClass = useCreateClass()
  const deleteClassMutation = useDeleteClass()

  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    address: '',
    notes: '',
  })

  const [classFormData, setClassFormData] = useState({
    type: 'privat' as 'privat' | 'reguler',
    name: '',
    capacity: 1,
    days: [] as string[],
    time: '',
  })

  // Data teachers & classes sekarang dikelola oleh TanStack Query hooks di atas

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingTeacher) {
        await updateTeacher.mutateAsync({ id: editingTeacher.id, data: teacherFormData })
        alert('Data pengajar berhasil diupdate!')
      } else {
        await createTeacher.mutateAsync(teacherFormData)
        alert('Pengajar baru berhasil ditambahkan!')
      }

      setIsTeacherDialogOpen(false)
      setEditingTeacher(null)
      setTeacherFormData({ name: '', phone: '', gender: '', address: '', notes: '' })
    } catch (error: any) {
      console.error('Error saving teacher:', error)
      alert('Gagal menyimpan data: ' + error.message)
    }
  }

  const handleTeacherDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengajar ini? Semua kelas yang terkait akan ikut terhapus.')) return

    try {
      await deleteTeacher.mutateAsync(id)
      alert('Pengajar berhasil dihapus!')
    } catch (error: any) {
      console.error('Error deleting teacher:', error)
      alert('Gagal menghapus pengajar: ' + error.message)
    }
  }

  const handleTeacherEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setTeacherFormData({
      name: teacher.name,
      phone: teacher.phone || '',
      gender: teacher.gender || '',
      address: teacher.address || '',
      notes: teacher.notes || '',
    })
    setIsTeacherDialogOpen(true)
  }

  const openClassDialog = async (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setClassFormData({
      type: 'privat',
      name: '',
      capacity: 1,
      days: [],
      time: '',
    })
    setIsClassDialogOpen(true)
  }

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTeacher) {
      alert('Pengajar tidak dipilih')
      return
    }

    if (classFormData.days.length === 0) {
      alert('Pilih minimal satu hari')
      return
    }

    try {
      await createClass.mutateAsync({
        ...classFormData,
        teacher_id: selectedTeacher.id,
      })

      alert('Kelas berhasil ditambahkan!')
      setClassFormData({
        type: 'privat',
        name: '',
        capacity: 1,
        days: [],
        time: '',
      })
    } catch (error: any) {
      console.error('Error adding class:', error)
      alert('Gagal menambahkan kelas: ' + error.message)
    }
  }

  const handleClassDelete = async (classId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return

    try {
      await deleteClassMutation.mutateAsync(classId)
      alert('Kelas berhasil dihapus!')
    } catch (error: any) {
      console.error('Error deleting class:', error)
      alert('Gagal menghapus kelas: ' + error.message)
    }
  }

  const toggleDay = (day: string) => {
    setClassFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Manajemen Pengajar</h2>
          <p className="text-gray-300">Kelola data pengajar dan kelas yang diajar</p>
        </div>

        <div className="flex gap-2 flex-wrap md:justify-end">
          <ExportButton type="instructors" />
          <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
            <DialogTrigger asChild>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setEditingTeacher(null)
                setTeacherFormData({ name: '', phone: '', gender: '', address: '', notes: '' })
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pengajar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white border-white/20">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? 'Edit Pengajar' : 'Tambah Pengajar Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input
                  value={teacherFormData.name}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                  required
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input
                  value={teacherFormData.phone}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select value={teacherFormData.gender} onValueChange={(value) => setTeacherFormData({ ...teacherFormData, gender: value })}>
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
                <Label>Alamat</Label>
                <Input
                  value={teacherFormData.address}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, address: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={teacherFormData.notes}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, notes: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                {editingTeacher ? 'Update' : 'Simpan'}
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Class Management Dialog */}
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kelola Kelas - {selectedTeacher?.name}</DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-6">
              {/* Add New Class Form */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Tambah Kelas Baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleClassSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Jenis Kelas *</Label>
                      <Select
                        value={classFormData.type}
                        onValueChange={(value: 'privat' | 'reguler') => {
                          setClassFormData({
                            ...classFormData,
                            type: value,
                            capacity: value === 'privat' ? 1 : 5
                          })
                        }}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="privat">Privat (1 orang)</SelectItem>
                          <SelectItem value="reguler">Reguler (3-5 orang)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nama Kelas *</Label>
                      <Input
                        value={classFormData.name}
                        onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                        placeholder="Contoh: Privat: Senin & Selasa - Ibu Diah"
                        required
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kapasitas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={classFormData.capacity}
                        onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hari Mengajar * (pilih satu atau lebih)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {DAYS_OPTIONS.map(day => (
                          <Button
                            key={day}
                            type="button"
                            variant={classFormData.days.includes(day) ? 'default' : 'outline'}
                            className={classFormData.days.includes(day) ? 'bg-purple-600' : 'border-white/20 text-white hover:bg-white/10'}
                            onClick={() => toggleDay(day)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Waktu Mengajar *</Label>
                      <Input
                        value={classFormData.time}
                        onChange={(e) => setClassFormData({ ...classFormData, time: e.target.value })}
                        placeholder="Contoh: 18.10"
                        required
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Tambah Kelas
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Existing Classes List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Kelas yang Diajar ({teacherClasses.length})</h3>
                {teacherClasses.length === 0 ? (
                  <p className="text-gray-400 text-sm">Belum ada kelas yang ditambahkan</p>
                ) : (
                  teacherClasses.map(cls => (
                    <Card key={cls.id} className="bg-white/5 border-white/10">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={cls.type === 'privat' ? 'bg-blue-600' : 'bg-green-600'}>
                                {cls.type === 'privat' ? 'Privat' : 'Reguler'}
                              </Badge>
                              <span className="text-sm text-gray-400">Kapasitas: {cls.capacity} orang</span>
                            </div>
                            <p className="text-white font-medium mb-1">{cls.name}</p>
                            <p className="text-sm text-gray-400">
                              {cls.days.join(', ')} - {cls.time}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleClassDelete(cls.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Teachers Table (Desktop) */}
      <div className="hidden md:block bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-white/5">
              <TableHead className="text-gray-300 font-semibold">Nama</TableHead>
              <TableHead className="text-gray-300 font-semibold">Telepon</TableHead>
              <TableHead className="text-gray-300 font-semibold">Jenis Kelamin</TableHead>
              <TableHead className="text-gray-300 font-semibold">Alamat</TableHead>
              <TableHead className="text-gray-300 font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                  Belum ada data pengajar
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium">{teacher.name}</TableCell>
                  <TableCell className="text-gray-300">{teacher.phone || '-'}</TableCell>
                  <TableCell className="text-gray-300">{teacher.gender || '-'}</TableCell>
                  <TableCell className="text-gray-300">{teacher.address || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                        onClick={() => openClassDialog(teacher)}
                      >
                        <GraduationCap className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                        onClick={() => handleTeacherEdit(teacher)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleTeacherDelete(teacher.id)}
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
    </div>
  )
}

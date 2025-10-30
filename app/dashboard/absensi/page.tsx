'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTeachers, useClasses, useParticipantsByClass, useCreateAttendance } from '@/lib/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { loadClient } from '@/lib/dynamic'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

const ExportButton = loadClient(() => import('@/components/export-button').then(m => m.ExportButton as any))

type Teacher = {
  id: string
  name: string
}

type Class = {
  id: string
  name: string
  type: string
  days: string[]
  time: string
}

type Participant = {
  id: string
  name: string
}

type AttendanceStatus = 'hadir' | 'izin' | 'berhalangan'
type AttendanceReason = 'sakit' | 'acara' | 'keperluan_mendesak' | 'peserta_libur' | null

export default function AbsensiPage() {
  const { admin } = useAuth()
  const { data: teachers = [], isLoading: loadingTeachers } = useTeachers()
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const { data: classes = [], isLoading: loadingClasses } = useClasses(selectedTeacherId || undefined)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const { data: participants = [], isLoading: loadingParticipants } = useParticipantsByClass(selectedClassId || null)
  const createAttendance = useCreateAttendance()

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendanceData, setAttendanceData] = useState<{
    [participantId: string]: {
      status: AttendanceStatus
      reason: AttendanceReason
    }
  }>({})

  // Reset selections when teacher changes
  useEffect(() => {
    if (selectedTeacherId) {
      setSelectedClassId('')
    }
  }, [selectedTeacherId])

  // Initialize attendance data when participants change (only if IDs changed)
  useEffect(() => {
    setAttendanceData(prev => {
      const sameSize = participants.length === Object.keys(prev).length
      const sameIds = sameSize && participants.every(p => p.id in prev)
      if (sameIds) return prev
      const initialData: typeof prev = {}
      for (const p of participants) {
        initialData[p.id] = prev[p.id] ?? { status: 'hadir', reason: null }
      }
      return initialData
    })
  }, [participants])

  const updateAttendance = (participantId: string, field: 'status' | 'reason', value: any) => {
    setAttendanceData(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: value,
      }
    }))
  }

  const handleSubmit = () => {
    if (!selectedTeacherId || !selectedClassId || !admin) {
      alert('Pastikan semua field terisi')
      return
    }

    if (createAttendance.isPending) {
      alert('⏳ Sedang menyimpan absensi sebelumnya, mohon tunggu...')
      return
    }

    const attendanceRecords = participants.map(p => ({
      teacher_id: selectedTeacherId,
      class_id: selectedClassId,
      participant_id: p.id,
      date,
      status: attendanceData[p.id]?.status || 'hadir',
      reason: attendanceData[p.id]?.status !== 'hadir' ? attendanceData[p.id]?.reason : null,
      created_by_admin: admin.id,
    }))

    createAttendance.mutate(attendanceRecords, {
      onSuccess: async () => {
        setSelectedClassId('')
        setAttendanceData({})
        
        // Auto-export to Google Sheets
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            alert('✅ Absensi berhasil disimpan!\n\n⚠️ Tidak bisa export ke Sheets (tidak ada sesi login)')
            return
          }
          
          const res = await fetch('/api/export/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          
          if (res.ok) {
            const data = await res.json()
            alert(`✅ Absensi berhasil disimpan dan diekspor!\n\n📊 Total: ${data.rowCount} baris di Google Sheets`)
            if (data.spreadsheetUrl) {
              window.open(data.spreadsheetUrl, '_blank')
            }
          } else {
            const errData = await res.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Export error:', errData)
            alert(`✅ Absensi berhasil disimpan!\n\n❌ Tapi export ke Sheets gagal: ${errData.error}\n\nGunakan tombol "Export ke Sheets" untuk coba lagi.`)
          }
        } catch (e: any) {
          console.error('Export attendance failed', e)
          alert(`✅ Absensi berhasil disimpan!\n\n❌ Tapi export ke Sheets gagal: ${e.message}`)
        }
      },
      onError: (error: any) => {
        console.error('Error saving attendance:', error)
        alert('❌ Gagal menyimpan absensi!\n\n' + error.message)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Catat Absensi</h2>
          <p className="text-gray-300">Pilih Pengajar</p>
        </div>
        <ExportButton type="attendance" />
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Form Absensi Kehadiran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pilih Pengajar */}
          <div className="space-y-2">
            <Label className="text-gray-300">Nama Pengajar</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="-- Pilih Pengajar --" />
              </SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <SelectItem value="none" disabled>Belum ada pengajar</SelectItem>
                ) : (
                  teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Pilih Kelas (dynamic based on teacher) */}
          {selectedTeacherId && (
            <div className="space-y-2">
              <Label className="text-gray-300">Jenis Kelas</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={loadingClasses || classes.length === 0}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="-- Pilih Kelas --" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem value="none" disabled>Pengajar ini belum memiliki kelas</SelectItem>
                  ) : (
                    classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({cls.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tanggal */}
          {selectedClassId && (
            <div className="space-y-2">
              <Label className="text-gray-300">Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          )}

          {/* Daftar Peserta & Kehadiran */}
          {participants.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Peserta:</h3>
                <div className="space-y-4">
                  {participants.map(participant => (
                    <div key={participant.id} className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{participant.name}</span>
                        <Badge className="bg-blue-600">{attendanceData[participant.id]?.status || 'hadir'}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status Kehadiran */}
                        <div className="space-y-2">
                          <Label className="text-gray-300 text-sm">Kehadiran</Label>
                          <Select
                            value={attendanceData[participant.id]?.status || 'hadir'}
                            onValueChange={(value) => updateAttendance(participant.id, 'status', value as AttendanceStatus)}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hadir">Hadir</SelectItem>
                              <SelectItem value="izin">Izin</SelectItem>
                              <SelectItem value="berhalangan">Berhalangan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Alasan (jika izin/berhalangan) */}
                        {attendanceData[participant.id]?.status !== 'hadir' && (
                          <div className="space-y-2">
                            <Label className="text-gray-300 text-sm">Alasan Izin</Label>
                            <Select
                              value={attendanceData[participant.id]?.reason || ''}
                              onValueChange={(value) => updateAttendance(participant.id, 'reason', value as AttendanceReason)}
                            >
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Pilih Alasan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sakit">Sakit</SelectItem>
                                <SelectItem value="acara">Acara</SelectItem>
                                <SelectItem value="keperluan_mendesak">Keperluan Mendesak</SelectItem>
                                <SelectItem value="peserta_libur">Peserta Libur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createAttendance.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {createAttendance.isPending ? 'Menyimpan...' : 'Kirim Absensi'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

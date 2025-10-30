'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users } from 'lucide-react'

type TeacherSchedule = {
  teacher_id: string
  teacher_name: string
  classes: {
    id: string
    name: string
    type: string
    days: string[]
    time: string
    capacity: number
  }[]
}

export default function JadwalPage() {
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const { data: teachers, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name')

      if (teacherError) throw teacherError

      const schedulesData: TeacherSchedule[] = []

      for (const teacher of teachers || []) {
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select('id, name, type, days, time, capacity')
          .eq('teacher_id', teacher.id)
          .order('type')

        if (classError) throw classError

        schedulesData.push({
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          classes: classes || [],
        })
      }

      setSchedules(schedulesData)
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupClassesByType = (classes: TeacherSchedule['classes']) => {
    const privat = classes.filter(c => c.type === 'privat')
    const reguler = classes.filter(c => c.type === 'reguler')
    return { privat, reguler }
  }

  if (loading) {
    return <div className="text-white">Memuat jadwal...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Jadwal Mengajar</h2>
        <p className="text-gray-300">Daftar jadwal pengajar dan kelas</p>
      </div>

      {schedules.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="py-12 text-center text-gray-400">
            Belum ada jadwal yang tersedia
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {schedules.map((schedule) => {
            const { privat, reguler } = groupClassesByType(schedule.classes)
            
            if (schedule.classes.length === 0) return null

            return (
              <Card key={schedule.teacher_id} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-purple-400" />
                      {schedule.teacher_name}
                    </CardTitle>
                    <Badge className="bg-purple-600">
                      {schedule.classes.length} Kelas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Jadwal Privat */}
                  {privat.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        Jadwal Privat
                      </h3>
                      <div className="grid gap-3">
                        {privat.map(cls => (
                          <Card key={cls.id} className="bg-white/5 border-white/10">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium mb-2">{cls.name}</p>
                                  <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4 text-blue-400" />
                                      <span>{cls.days.join(' & ')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4 text-blue-400" />
                                      <span>{cls.time}</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge className="bg-blue-600">Privat</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jadwal Reguler */}
                  {reguler.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-400" />
                        Jadwal Reguler
                      </h3>
                      <div className="grid gap-3">
                        {reguler.map(cls => (
                          <Card key={cls.id} className="bg-white/5 border-white/10">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium mb-2">{cls.name}</p>
                                  <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4 text-green-400" />
                                      <span>{cls.days.join(' & ')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4 text-green-400" />
                                      <span>{cls.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4 text-green-400" />
                                      <span>Kapasitas: {cls.capacity} orang</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge className="bg-green-600">Reguler</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

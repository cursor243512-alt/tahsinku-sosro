import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { autoExport } from '../auto-export'

// ==================== ENROLLMENTS (Berlangganan) ====================
export function useEnrollments() {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          participants!enrollments_participant_id_fkey(name),
          teachers!enrollments_teacher_id_fkey(name),
          classes!enrollments_class_id_fkey(name, type)
        `)
        .order('start_date', { ascending: false })

      if (error) throw error

      return data?.map(e => ({
        id: e.id,
        participant_id: e.participant_id,
        teacher_id: e.teacher_id,
        class_id: e.class_id,
        start_date: e.start_date,
        due_date: e.due_date,
        status: e.status as 'lunas' | 'menunggu_pembayaran',
        participant_name: (e.participants as any)?.name || '-',
        teacher_name: (e.teachers as any)?.name || '-',
        class_name: (e.classes as any)?.name || '-',
        class_type: (e.classes as any)?.type || '-',
      })) || []
    },
    // Cache for 2 minutes to avoid re-fetching on every tab switch
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  })
}

// Paginated participants with optional search
export function useParticipantsPaged(page: number, pageSize: number, search: string) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return useQuery({
    queryKey: ['participants', 'paged', page, pageSize, search],
    queryFn: async () => {
      let query = supabase
        .from('participants')
        .select('id, name, address, whatsapp, gender, job, created_at')

      if (search) {
        const pattern = `%${search}%`
        query = query.or(
          `name.ilike.${pattern},address.ilike.${pattern},whatsapp.ilike.${pattern},job.ilike.${pattern}`
        )
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const { count, error: countError } = await supabase
        .from('participants')
        .select('id', { count: 'exact', head: true })

      if (countError) throw countError

      return {
        rows: data || [],
        total: count || 0,
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

// Paginated enrollments (server-side pagination)
export function useEnrollmentsPaged(page: number, pageSize: number) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return useQuery({
    queryKey: ['enrollments', 'paged', page, pageSize],
    queryFn: async () => {
      // Data page with joins
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          participants!enrollments_participant_id_fkey(name),
          teachers!enrollments_teacher_id_fkey(name),
          classes!enrollments_class_id_fkey(name, type)
        `)
        .order('start_date', { ascending: false })
        .range(from, to)

      if (error) throw error

      // Total count (without join for speed)
      const { count, error: countError } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })

      if (countError) throw countError

      return {
        rows: (data || []).map(e => ({
          id: e.id,
          participant_id: e.participant_id,
          teacher_id: e.teacher_id,
          class_id: e.class_id,
          start_date: e.start_date,
          due_date: e.due_date,
          status: e.status as 'lunas' | 'menunggu_pembayaran',
          participant_name: (e as any).participants?.name || '-',
          teacher_name: (e as any).teachers?.name || '-',
          class_name: (e as any).classes?.name || '-',
          class_type: (e as any).classes?.type || '-',
        })),
        total: count || 0,
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'lunas' | 'menunggu_pembayaran' }) => {
      const { error } = await supabase
        .from('enrollments')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      // Auto-export to Sheets in background
      autoExport('payments', true)
    },
  })
}

// ==================== TEACHERS ====================
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    },
    // Teachers are semi-static
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 20 * 60 * 1000,
  })
}

export function useCreateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teacher: any) => {
      const { error } = await supabase.from('teachers').insert([teacher])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      // Auto-export to Sheets in background
      autoExport('instructors', true)
    },
  })
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('teachers').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      // Auto-export to Sheets in background
      autoExport('instructors', true)
    },
  })
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teachers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      // Auto-export to Sheets in background
      autoExport('instructors', true)
    },
  })
}

// ==================== CLASSES ====================
export function useClasses(teacherId?: string) {
  return useQuery({
    queryKey: teacherId ? ['classes', teacherId] : ['classes'],
    queryFn: async () => {
      let query = supabase.from('classes').select('*')
      
      if (teacherId) {
        query = query.eq('teacher_id', teacherId)
      }
      
      const { data, error } = await query.order('type')

      if (error) throw error
      return data || []
    },
    enabled: teacherId !== undefined || teacherId === undefined,
    // Keep previous list when switching teacher to avoid UI flicker
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 20 * 60 * 1000,
  })
}

export function useClassesWithTeacher() {
  return useQuery({
    queryKey: ['classes-with-teacher'],
    queryFn: async () => {
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

      return data?.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        teacher_id: c.teacher_id,
        teacher_name: (c.teachers as any)?.name || '-',
      })) || []
    },
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (classData: any) => {
      const { error } = await supabase.from('classes').insert([classData])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['classes-with-teacher'] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['classes-with-teacher'] })
    },
  })
}

// ==================== PARTICIPANTS ====================
export function useParticipants() {
  return useQuery({
    queryKey: ['participants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

export function useCreateParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (participant: any) => {
      const { error } = await supabase.from('participants').insert([participant])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      // Auto-export to Sheets in background
      autoExport('participants', true)
    },
  })
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('participants').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      // Auto-export to Sheets in background
      autoExport('participants', true)
    },
  })
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('participants').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      // Auto-export to Sheets in background
      autoExport('participants', true)
    },
  })
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enrollment: any) => {
      const { error } = await supabase.from('enrollments').insert([enrollment])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      // Auto-export to Sheets in background
      autoExport('payments', true)
    },
  })
}

// ==================== ATTENDANCE ====================
export function useCreateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attendanceRecords: any[]) => {
      // Check existing records first
      for (const record of attendanceRecords) {
        const { data: existing } = await supabase
          .from('attendance')
          .select('id')
          .eq('participant_id', record.participant_id)
          .eq('class_id', record.class_id)
          .eq('date', record.date)
          .single()

        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from('attendance')
            .update({
              status: record.status,
              reason: record.reason,
              teacher_id: record.teacher_id,
              created_by_admin: record.created_by_admin,
            })
            .eq('id', existing.id)
          
          if (error) throw new Error(error.message)
        } else {
          // Insert new record
          const { error } = await supabase
            .from('attendance')
            .insert([record])
          
          if (error) throw new Error(error.message)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

// ==================== SCHEDULES ====================
export function useSchedules() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      // Single query join to avoid N+1 requests
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          type,
          days,
          time,
          capacity,
          teacher_id,
          teachers!classes_teacher_id_fkey(name)
        `)
        .order('teacher_id')

      if (error) throw error

      const map = new Map<string, { teacher_id: string; teacher_name: string; classes: any[] }>()
      for (const c of data || []) {
        const tId = c.teacher_id as string
        const tName = (c as any).teachers?.name || '-'
        if (!map.has(tId)) {
          map.set(tId, { teacher_id: tId, teacher_name: tName, classes: [] })
        }
        map.get(tId)!.classes.push({
          id: c.id,
          name: c.name,
          type: c.type,
          days: c.days,
          time: c.time,
          capacity: (c as any).capacity,
        })
      }

      return Array.from(map.values())
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 20 * 60 * 1000,
  })
}

// ==================== PARTICIPANTS FOR CLASS ====================
export function useParticipantsByClass(classId: string | null) {
  return useQuery({
    queryKey: ['participants-by-class', classId],
    queryFn: async () => {
      if (!classId) return []

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          participant_id,
          participants!enrollments_participant_id_fkey(id, name)
        `)
        .eq('class_id', classId)

      if (error) throw error

      return data?.map(e => ({
        id: (e.participants as any).id,
        name: (e.participants as any).name,
      })) || []
    },
    enabled: !!classId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  })
}

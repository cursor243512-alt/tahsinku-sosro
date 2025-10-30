import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side supabase instance (for use client components)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          name: string
          phone: string | null
          gender: string | null
          address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          gender?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          gender?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          type: 'privat' | 'reguler'
          name: string
          teacher_id: string
          capacity: number
          days: string[]
          time: string
          created_at: string
        }
        Insert: {
          id?: string
          type: 'privat' | 'reguler'
          name: string
          teacher_id: string
          capacity: number
          days: string[]
          time: string
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'privat' | 'reguler'
          name?: string
          teacher_id?: string
          capacity?: number
          days?: string[]
          time?: string
          created_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          name: string
          address: string | null
          whatsapp: string | null
          gender: string | null
          job: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          whatsapp?: string | null
          gender?: string | null
          job?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          whatsapp?: string | null
          gender?: string | null
          job?: string | null
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          participant_id: string
          teacher_id: string
          class_id: string
          start_date: string
          due_date: string
          status: 'lunas' | 'menunggu_pembayaran'
          created_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          teacher_id: string
          class_id: string
          start_date: string
          due_date: string
          status?: 'lunas' | 'menunggu_pembayaran'
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          teacher_id?: string
          class_id?: string
          start_date?: string
          due_date?: string
          status?: 'lunas' | 'menunggu_pembayaran'
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          teacher_id: string
          class_id: string
          participant_id: string
          date: string
          status: 'hadir' | 'izin' | 'berhalangan'
          reason: 'sakit' | 'acara' | 'keperluan_mendesak' | 'peserta_libur' | null
          created_by_admin: string
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          class_id: string
          participant_id: string
          date: string
          status: 'hadir' | 'izin' | 'berhalangan'
          reason?: 'sakit' | 'acara' | 'keperluan_mendesak' | 'peserta_libur' | null
          created_by_admin: string
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          class_id?: string
          participant_id?: string
          date?: string
          status?: 'hadir' | 'izin' | 'berhalangan'
          reason?: 'sakit' | 'acara' | 'keperluan_mendesak' | 'peserta_libur' | null
          created_by_admin?: string
          created_at?: string
        }
      }
    }
  }
}

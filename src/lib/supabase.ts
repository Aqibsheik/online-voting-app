import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-project-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      voter_profiles: {
        Row: {
          id: string
          full_name: string
          date_of_birth: string
          address: string
          voter_id: string
          id_document_url: string | null
          verification_status: 'pending' | 'verified' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          date_of_birth: string
          address: string
          voter_id: string
          id_document_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
        }
        Update: {
          full_name?: string
          date_of_birth?: string
          address?: string
          voter_id?: string
          id_document_url?: string | null
          verification_status?: 'pending' | 'verified' | 'rejected'
        }
      }
      elections: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          status: 'upcoming' | 'active' | 'completed'
          created_at: string
          updated_at: string
        }
      }
      candidates: {
        Row: {
          id: string
          election_id: string
          name: string
          party: string
          bio: string
          photo_url: string
          position: number
          created_at: string
        }
      }
      votes: {
        Row: {
          id: string
          election_id: string
          voter_id: string
          candidate_id: string
          cast_at: string
          ip_address: string | null
        }
        Insert: {
          election_id: string
          voter_id: string
          candidate_id: string
          ip_address?: string | null
        }
      }
    }
  }
}
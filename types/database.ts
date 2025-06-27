export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          sport_type: string | null
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          birth_date: string | null
          height_cm: number | null
          weight_kg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          sport_type?: string | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          birth_date?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          sport_type?: string | null
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null
          birth_date?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      training_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          session_time: string | null
          type: 'strength' | 'endurance' | 'mixed' | 'recovery' | null
          duration_minutes: number | null
          intensity_level: number | null
          fasted_state: boolean
          pre_workout_meal: string | null
          post_workout_meal: string | null
          muscle_groups: string[] | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date: string
          session_time?: string | null
          type?: 'strength' | 'endurance' | 'mixed' | 'recovery' | null
          duration_minutes?: number | null
          intensity_level?: number | null
          fasted_state?: boolean
          pre_workout_meal?: string | null
          post_workout_meal?: string | null
          muscle_groups?: string[] | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_date?: string
          session_time?: string | null
          type?: 'strength' | 'endurance' | 'mixed' | 'recovery' | null
          duration_minutes?: number | null
          intensity_level?: number | null
          fasted_state?: boolean
          pre_workout_meal?: string | null
          post_workout_meal?: string | null
          muscle_groups?: string[] | null
          notes?: string | null
          created_at?: string
        }
      }
      sleep_records: {
        Row: {
          id: string
          user_id: string
          sleep_date: string
          bedtime: string | null
          wake_time: string | null
          duration_hours: number | null
          quality_score: number | null
          room_temp_celsius: number | null
          co2_level: number | null
          deep_sleep_hours: number | null
          rem_sleep_hours: number | null
          awakenings: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sleep_date: string
          bedtime?: string | null
          wake_time?: string | null
          duration_hours?: number | null
          quality_score?: number | null
          room_temp_celsius?: number | null
          co2_level?: number | null
          deep_sleep_hours?: number | null
          rem_sleep_hours?: number | null
          awakenings?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sleep_date?: string
          bedtime?: string | null
          wake_time?: string | null
          duration_hours?: number | null
          quality_score?: number | null
          room_temp_celsius?: number | null
          co2_level?: number | null
          deep_sleep_hours?: number | null
          rem_sleep_hours?: number | null
          awakenings?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      supplements: {
        Row: {
          id: string
          name: string
          category: 'protein' | 'vitamin' | 'mineral' | 'performance' | 'recovery' | 'other' | null
          description: string | null
          default_dosage: string | null
          timing_recommendations: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: 'protein' | 'vitamin' | 'mineral' | 'performance' | 'recovery' | 'other' | null
          description?: string | null
          default_dosage?: string | null
          timing_recommendations?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: 'protein' | 'vitamin' | 'mineral' | 'performance' | 'recovery' | 'other' | null
          description?: string | null
          default_dosage?: string | null
          timing_recommendations?: string | null
          notes?: string | null
        }
      }
      user_supplements: {
        Row: {
          id: string
          user_id: string
          supplement_id: string
          dosage: string | null
          frequency: string | null
          timing: string | null
          start_date: string | null
          end_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          supplement_id: string
          dosage?: string | null
          frequency?: string | null
          timing?: string | null
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          supplement_id?: string
          dosage?: string | null
          frequency?: string | null
          timing?: string | null
          start_date?: string | null
          end_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
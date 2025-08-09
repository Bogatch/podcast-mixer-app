
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      licenses: {
        Row: {
          id: number
          created_at: string
          license_key: string
          status: string
          product_id: string
          assigned_email: string
        }
        Insert: {
          id?: number
          created_at?: string
          license_key: string
          status: string
          product_id: string
          assigned_email?: string
        }
        Update: {
          id?: number
          created_at?: string
          license_key?: string
          status?: string
          product_id?: string
          assigned_email?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

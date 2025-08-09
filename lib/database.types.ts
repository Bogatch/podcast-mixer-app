
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
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
    Enums: {
      [key: string]: never
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}

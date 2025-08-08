
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
          status: "available" | "used"
          product_id: string
          assigned_email: string
        }
        Insert: {
          id?: number
          created_at?: string
          license_key: string
          status: "available" | "used"
          product_id: string
          assigned_email: string
        }
        Update: {
          id?: number
          created_at?: string
          license_key?: string
          status?: "available" | "used"
          product_id?: string
          assigned_email?: string
        }
        Relationships: []
      }
    }
    Views: {
      [key in never]: never
    }
    Functions: {
      [key in never]: never
    }
    Enums: {
      [key in never]: never
    }
    CompositeTypes: {
      [key in never]: never
    }
  }
}
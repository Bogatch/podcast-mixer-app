
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
      licenses: {
        Row: {
          id: number
          created_at: string
          license_key: string
          status: "available" | "used"
          product_id: string
          assigned_email: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          license_key: string
          status: "available" | "used"
          product_id: string
          assigned_email?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          license_key?: string
          status?: "available" | "used"
          product_id?: string
          assigned_email?: string | null
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
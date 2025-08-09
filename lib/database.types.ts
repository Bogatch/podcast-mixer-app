
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
          assigned_email: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          license_key: string
          status: string
          product_id: string
          assigned_email: string | null
        }
        Update: {
          id?: number
          created_at?: string
          license_key?: string
          status?: string
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

export type Json = any;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          is_pro: boolean;
        };
        Insert: {
          id: string;
          email: string;
          is_pro?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          is_pro?: boolean;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: number;
          user_id: string;
          name: string;
          project_data: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          name: string;
          project_data: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string;
          project_data?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
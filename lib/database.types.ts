
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        Relationships: [
          {
            columns: ["id"];
            foreignKeyName: "profiles_id_fkey";
            isOneToOne: true;
            referencedColumns: ["id"];
            referencedRelation: "users";
          }
        ];
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
        Relationships: [
          {
            columns: ["user_id"];
            foreignKeyName: "projects_user_id_fkey";
            isOneToOne: false;
            referencedColumns: ["id"];
            referencedRelation: "users";
          }
        ];
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

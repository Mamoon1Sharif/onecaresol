export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      care_givers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_check_in: string | null
          name: string
          phone: string | null
          skills: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_check_in?: string | null
          name: string
          phone?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_check_in?: string | null
          name?: string
          phone?: string | null
          skills?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_receivers: {
        Row: {
          address: string | null
          age: number | null
          care_plan: string | null
          care_status: string
          care_type: string
          created_at: string
          dnacpr: boolean
          id: string
          name: string
          next_of_kin: string | null
          next_of_kin_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          care_plan?: string | null
          care_status?: string
          care_type?: string
          created_at?: string
          dnacpr?: boolean
          id?: string
          name: string
          next_of_kin?: string | null
          next_of_kin_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          care_plan?: string | null
          care_status?: string
          care_type?: string
          created_at?: string
          dnacpr?: boolean
          id?: string
          name?: string
          next_of_kin?: string | null
          next_of_kin_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_visits: {
        Row: {
          care_giver_id: string | null
          care_receiver_id: string | null
          created_at: string
          duration: number
          id: string
          start_hour: number
          status: string
          updated_at: string
          visit_date: string
        }
        Insert: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          created_at?: string
          duration?: number
          id?: string
          start_hour?: number
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Update: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          created_at?: string
          duration?: number
          id?: string
          start_hour?: number
          status?: string
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_visits_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_visits_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_visits: {
        Row: {
          assigned_member: string
          care_giver: string
          check_in_status: string
          created_at: string
          id: string
          scheduled_time: string
          visit_date: string
        }
        Insert: {
          assigned_member: string
          care_giver: string
          check_in_status?: string
          created_at?: string
          id?: string
          scheduled_time: string
          visit_date?: string
        }
        Update: {
          assigned_member?: string
          care_giver?: string
          check_in_status?: string
          created_at?: string
          id?: string
          scheduled_time?: string
          visit_date?: string
        }
        Relationships: []
      }
      health_goals: {
        Row: {
          care_receiver_id: string
          created_at: string
          goal: string
          id: string
          notes: string | null
          status: string
          target: string | null
        }
        Insert: {
          care_receiver_id: string
          created_at?: string
          goal: string
          id?: string
          notes?: string | null
          status?: string
          target?: string | null
        }
        Update: {
          care_receiver_id?: string
          created_at?: string
          goal?: string
          id?: string
          notes?: string | null
          status?: string
          target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_goals_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          administered_by: string | null
          care_receiver_id: string
          created_at: string
          date: string
          dosage: string
          id: string
          medication: string
          notes: string | null
        }
        Insert: {
          administered_by?: string | null
          care_receiver_id: string
          created_at?: string
          date: string
          dosage: string
          id?: string
          medication: string
          notes?: string | null
        }
        Update: {
          administered_by?: string | null
          care_receiver_id?: string
          created_at?: string
          date?: string
          dosage?: string
          id?: string
          medication?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          care_receiver_id: string
          category: string
          created_at: string
          description: string
          id: string
          last_reviewed: string | null
          level: string
          mitigations: string | null
        }
        Insert: {
          care_receiver_id: string
          category: string
          created_at?: string
          description?: string
          id?: string
          last_reviewed?: string | null
          level?: string
          mitigations?: string | null
        }
        Update: {
          care_receiver_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          last_reviewed?: string | null
          level?: string
          mitigations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          care_giver_id: string | null
          care_receiver_id: string | null
          created_at: string
          day: number
          end_time: string
          id: string
          notes: string | null
          shift_type: string
          start_time: string
          updated_at: string
        }
        Insert: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          created_at?: string
          day?: number
          end_time?: string
          id?: string
          notes?: string | null
          shift_type?: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          care_giver_id?: string | null
          care_receiver_id?: string | null
          created_at?: string
          day?: number
          end_time?: string
          id?: string
          notes?: string | null
          shift_type?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_care_giver_id_fkey"
            columns: ["care_giver_id"]
            isOneToOne: false
            referencedRelation: "care_givers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_notes: {
        Row: {
          care_receiver_id: string
          caregiver: string
          created_at: string
          date: string
          id: string
          note: string
        }
        Insert: {
          care_receiver_id: string
          caregiver: string
          created_at?: string
          date: string
          id?: string
          note: string
        }
        Update: {
          care_receiver_id?: string
          caregiver?: string
          created_at?: string
          date?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_care_receiver_id_fkey"
            columns: ["care_receiver_id"]
            isOneToOne: false
            referencedRelation: "care_receivers"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

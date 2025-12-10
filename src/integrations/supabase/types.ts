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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          approved_amount: number | null
          claimed_amount: number | null
          created_at: string
          deductible: number | null
          id: string
          invoice_amount: number
          invoice_url: string | null
          medical_insurance_amount: number | null
          medical_record_url: string | null
          payment_ratio: number | null
          project_id: string
          status: string | null
          subject_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_amount?: number | null
          claimed_amount?: number | null
          created_at?: string
          deductible?: number | null
          id?: string
          invoice_amount: number
          invoice_url?: string | null
          medical_insurance_amount?: number | null
          medical_record_url?: string | null
          payment_ratio?: number | null
          project_id: string
          status?: string | null
          subject_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_amount?: number | null
          claimed_amount?: number | null
          created_at?: string
          deductible?: number | null
          id?: string
          invoice_amount?: number
          invoice_url?: string | null
          medical_insurance_amount?: number | null
          medical_record_url?: string | null
          payment_ratio?: number | null
          project_id?: string
          status?: string | null
          subject_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          contact_name: string | null
          created_at: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_risk_score: number | null
          company_name: string | null
          coverage_per_subject: number | null
          created_at: string
          drug_type: string | null
          duration_months: number | null
          final_premium: number | null
          id: string
          indication: string | null
          name: string
          premium_max: number | null
          premium_min: number | null
          project_code: string | null
          protocol_url: string | null
          risk_factors: string[] | null
          site_count: number | null
          status: string | null
          subject_count: number | null
          trial_phase: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_risk_score?: number | null
          company_name?: string | null
          coverage_per_subject?: number | null
          created_at?: string
          drug_type?: string | null
          duration_months?: number | null
          final_premium?: number | null
          id?: string
          indication?: string | null
          name: string
          premium_max?: number | null
          premium_min?: number | null
          project_code?: string | null
          protocol_url?: string | null
          risk_factors?: string[] | null
          site_count?: number | null
          status?: string | null
          subject_count?: number | null
          trial_phase?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_risk_score?: number | null
          company_name?: string | null
          coverage_per_subject?: number | null
          created_at?: string
          drug_type?: string | null
          duration_months?: number | null
          final_premium?: number | null
          id?: string
          indication?: string | null
          name?: string
          premium_max?: number | null
          premium_min?: number | null
          project_code?: string | null
          protocol_url?: string | null
          risk_factors?: string[] | null
          site_count?: number | null
          status?: string | null
          subject_count?: number | null
          trial_phase?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "applicant" | "platform" | "underwriter"
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
    Enums: {
      app_role: ["applicant", "platform", "underwriter"],
    },
  },
} as const

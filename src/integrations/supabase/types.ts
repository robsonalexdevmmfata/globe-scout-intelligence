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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          ai_model: string
          ai_provider: string
          cost_per_record: number
          id: number
          max_records_per_job: number
          notify_email: boolean
          retention_days: number
          score_weights: Json
          updated_at: string
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          cost_per_record?: number
          id?: number
          max_records_per_job?: number
          notify_email?: boolean
          retention_days?: number
          score_weights?: Json
          updated_at?: string
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          cost_per_record?: number
          id?: number
          max_records_per_job?: number
          notify_email?: boolean
          retention_days?: number
          score_weights?: Json
          updated_at?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          created_at: string
          id: string
          message: string | null
          records: number | null
          rule_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          records?: number | null
          rule_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          records?: number | null
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          active: boolean
          cities: string[] | null
          countries: string[] | null
          created_at: string
          created_by: string | null
          detect_new: boolean
          frequency: string
          id: string
          last_run_at: string | null
          max_records: number
          name: string
          next_run_at: string | null
          notify: boolean
          segments: string[] | null
          update_existing: boolean
        }
        Insert: {
          active?: boolean
          cities?: string[] | null
          countries?: string[] | null
          created_at?: string
          created_by?: string | null
          detect_new?: boolean
          frequency?: string
          id?: string
          last_run_at?: string | null
          max_records?: number
          name: string
          next_run_at?: string | null
          notify?: boolean
          segments?: string[] | null
          update_existing?: boolean
        }
        Update: {
          active?: boolean
          cities?: string[] | null
          countries?: string[] | null
          created_at?: string
          created_by?: string | null
          detect_new?: boolean
          frequency?: string
          id?: string
          last_run_at?: string | null
          max_records?: number
          name?: string
          next_run_at?: string | null
          notify?: boolean
          segments?: string[] | null
          update_existing?: boolean
        }
        Relationships: []
      }
      business_owners: {
        Row: {
          br_classification: Database["public"]["Enums"]["br_classification"]
          br_confidence: number
          br_justification: string | null
          br_sources: string[] | null
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          is_demo: boolean
          last_verified_at: string | null
          linkedin: string | null
          role_title: string | null
        }
        Insert: {
          br_classification?: Database["public"]["Enums"]["br_classification"]
          br_confidence?: number
          br_justification?: string | null
          br_sources?: string[] | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_demo?: boolean
          last_verified_at?: string | null
          linkedin?: string | null
          role_title?: string | null
        }
        Update: {
          br_classification?: Database["public"]["Enums"]["br_classification"]
          br_confidence?: number
          br_justification?: string | null
          br_sources?: string[] | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_demo?: boolean
          last_verified_at?: string | null
          linkedin?: string | null
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_owners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          instagram: string | null
          is_demo: boolean
          linkedin: string | null
          name: string
          phone: string | null
          segment: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          is_demo?: boolean
          linkedin?: string | null
          name: string
          phone?: string | null
          segment?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          is_demo?: boolean
          linkedin?: string | null
          name?: string
          phone?: string | null
          segment?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          id: string
          key: string
          name: string
          status: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          id?: string
          key: string
          name: string
          status?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          id?: string
          key?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          breakdown: Json
          created_at: string
          id: string
          lead_id: string
          score: number
        }
        Insert: {
          breakdown?: Json
          created_at?: string
          id?: string
          lead_id: string
          score: number
        }
        Update: {
          breakdown?: Json
          created_at?: string
          id?: string
          lead_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          last_error: string | null
          last_run_at: string | null
          max_retries: number
          name: string
          rate_limit_per_min: number
          records_found: number
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          last_error?: string | null
          last_run_at?: string | null
          max_retries?: number
          name: string
          rate_limit_per_min?: number
          records_found?: number
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          last_error?: string | null
          last_run_at?: string | null
          max_retries?: number
          name?: string
          rate_limit_per_min?: number
          records_found?: number
          status?: string
        }
        Relationships: []
      }
      lead_verifications: {
        Row: {
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          kind: string
          lead_id: string
          result: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          kind: string
          lead_id: string
          result: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          kind?: string
          lead_id?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_verifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          ai_approach: string | null
          ai_opportunities: string | null
          ai_summary: string | null
          br_classification: Database["public"]["Enums"]["br_classification"]
          br_confidence: number
          br_justification: string | null
          br_sources: string[] | null
          city: string | null
          company_id: string | null
          company_name: string
          contact_name: string | null
          contact_role: string | null
          country: string | null
          created_by: string | null
          discovered_at: string
          email: string | null
          email_status: string
          favorite: boolean
          id: string
          instagram: string | null
          is_demo: boolean
          job_id: string | null
          linkedin: string | null
          notes: string | null
          owner_id: string | null
          owner_name: string | null
          phone: string | null
          phone_status: string
          score: number
          segment: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          updated_at: string
          website: string | null
          website_status: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          ai_approach?: string | null
          ai_opportunities?: string | null
          ai_summary?: string | null
          br_classification?: Database["public"]["Enums"]["br_classification"]
          br_confidence?: number
          br_justification?: string | null
          br_sources?: string[] | null
          city?: string | null
          company_id?: string | null
          company_name: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string | null
          created_by?: string | null
          discovered_at?: string
          email?: string | null
          email_status?: string
          favorite?: boolean
          id?: string
          instagram?: string | null
          is_demo?: boolean
          job_id?: string | null
          linkedin?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          phone?: string | null
          phone_status?: string
          score?: number
          segment?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          updated_at?: string
          website?: string | null
          website_status?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          ai_approach?: string | null
          ai_opportunities?: string | null
          ai_summary?: string | null
          br_classification?: Database["public"]["Enums"]["br_classification"]
          br_confidence?: number
          br_justification?: string | null
          br_sources?: string[] | null
          city?: string | null
          company_id?: string | null
          company_name?: string
          contact_name?: string | null
          contact_role?: string | null
          country?: string | null
          created_by?: string | null
          discovered_at?: string
          email?: string | null
          email_status?: string
          favorite?: boolean
          id?: string
          instagram?: string | null
          is_demo?: boolean
          job_id?: string | null
          linkedin?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          phone?: string | null
          phone_status?: string
          score?: number
          segment?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          updated_at?: string
          website?: string | null
          website_status?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospecting_configurations: {
        Row: {
          cities: string[]
          countries: string[]
          created_at: string
          created_by: string | null
          filters: Json
          id: string
          name: string
          quantity: number
          segments: string[]
        }
        Insert: {
          cities?: string[]
          countries?: string[]
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          name: string
          quantity?: number
          segments?: string[]
        }
        Update: {
          cities?: string[]
          countries?: string[]
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          name?: string
          quantity?: number
          segments?: string[]
        }
        Relationships: []
      }
      prospecting_jobs: {
        Row: {
          cities: string[] | null
          configuration_id: string | null
          countries: string[] | null
          created_at: string
          created_by: string | null
          duplicates_removed: number
          enriched: number
          error: string | null
          filters: Json | null
          finished_at: string | null
          found: number
          id: string
          logs: Json
          mode: string
          processed: number
          quantity: number
          segments: string[] | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          validated: number
        }
        Insert: {
          cities?: string[] | null
          configuration_id?: string | null
          countries?: string[] | null
          created_at?: string
          created_by?: string | null
          duplicates_removed?: number
          enriched?: number
          error?: string | null
          filters?: Json | null
          finished_at?: string | null
          found?: number
          id?: string
          logs?: Json
          mode?: string
          processed?: number
          quantity?: number
          segments?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          validated?: number
        }
        Update: {
          cities?: string[] | null
          configuration_id?: string | null
          countries?: string[] | null
          created_at?: string
          created_by?: string | null
          duplicates_removed?: number
          enriched?: number
          error?: string | null
          filters?: Json | null
          finished_at?: string | null
          found?: number
          id?: string
          logs?: Json
          mode?: string
          processed?: number
          quantity?: number
          segments?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          validated?: number
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_jobs_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "prospecting_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppression_list: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          reason: string | null
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          reason?: string | null
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          reason?: string | null
          value?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "operador"
      br_classification: "confirmado" | "provavel" | "nao_identificado"
      job_status: "pendente" | "executando" | "concluido" | "erro" | "cancelado"
      lead_status:
        | "novo"
        | "qualificado"
        | "em_prospeccao"
        | "contatado"
        | "em_negociacao"
        | "convertido"
        | "descartado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "gestor", "operador"],
      br_classification: ["confirmado", "provavel", "nao_identificado"],
      job_status: ["pendente", "executando", "concluido", "erro", "cancelado"],
      lead_status: [
        "novo",
        "qualificado",
        "em_prospeccao",
        "contatado",
        "em_negociacao",
        "convertido",
        "descartado",
      ],
    },
  },
} as const

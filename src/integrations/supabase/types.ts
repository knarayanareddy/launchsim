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
      agents: {
        Row: {
          archetype: string
          emoji: string | null
          id: string
          name: string
          personality_type: string
          reaction_post: string | null
          simulation_id: string
          upvotes: number | null
        }
        Insert: {
          archetype: string
          emoji?: string | null
          id?: string
          name: string
          personality_type: string
          reaction_post?: string | null
          simulation_id: string
          upvotes?: number | null
        }
        Update: {
          archetype?: string
          emoji?: string | null
          id?: string
          name?: string
          personality_type?: string
          reaction_post?: string | null
          simulation_id?: string
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_personas: {
        Row: {
          archetype: string
          cares_about: string[]
          company_size: string | null
          company_type: string | null
          created_at: string
          emoji: string
          id: string
          industry: string | null
          name: string
          personality_type: string
          price_sensitivity: number
          rejection_triggers: string | null
          seniority: string | null
          signature_phrase: string | null
          skepticism_level: number
          tech_savviness: number
          user_id: string
        }
        Insert: {
          archetype: string
          cares_about?: string[]
          company_size?: string | null
          company_type?: string | null
          created_at?: string
          emoji?: string
          id?: string
          industry?: string | null
          name: string
          personality_type: string
          price_sensitivity?: number
          rejection_triggers?: string | null
          seniority?: string | null
          signature_phrase?: string | null
          skepticism_level?: number
          tech_savviness?: number
          user_id: string
        }
        Update: {
          archetype?: string
          cares_about?: string[]
          company_size?: string | null
          company_type?: string | null
          created_at?: string
          emoji?: string
          id?: string
          industry?: string | null
          name?: string
          personality_type?: string
          price_sensitivity?: number
          rejection_triggers?: string | null
          seniority?: string | null
          signature_phrase?: string | null
          skepticism_level?: number
          tech_savviness?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits_remaining: number
          email: string | null
          email_prefs: Json
          full_name: string | null
          id: string
          is_admin: boolean
          is_suspended: boolean
          onboarding_completed: boolean
          plan_tier: string
          referral_code: string
          referred_by: string | null
          simulations_run: number
          total_referrals: number
          updated_at: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits_remaining?: number
          email?: string | null
          email_prefs?: Json
          full_name?: string | null
          id: string
          is_admin?: boolean
          is_suspended?: boolean
          onboarding_completed?: boolean
          plan_tier?: string
          referral_code?: string
          referred_by?: string | null
          simulations_run?: number
          total_referrals?: number
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits_remaining?: number
          email?: string | null
          email_prefs?: Json
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_suspended?: boolean
          onboarding_completed?: boolean
          plan_tier?: string
          referral_code?: string
          referred_by?: string | null
          simulations_run?: number
          total_referrals?: number
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      referral_events: {
        Row: {
          created_at: string
          credit_awarded: boolean
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          credit_awarded?: boolean
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          credit_awarded?: boolean
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      simulation_groups: {
        Row: {
          created_at: string
          id: string
          latest_score: number
          product_name: string
          score_delta: number
          simulation_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latest_score?: number
          product_name: string
          score_delta?: number
          simulation_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latest_score?: number
          product_name?: string
          score_delta?: number
          simulation_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          agent_posts: Json | null
          audience_mix: string[]
          created_at: string
          crowd_size: number
          depth: string
          group_id: string | null
          id: string
          key_quote: string | null
          key_quote_agent: string | null
          overall_score: number
          platform: string
          product_description: string
          sentiment_breakdown: Json | null
          share_token: string | null
          sharpened_pitch: string | null
          simulation_question: string | null
          top_objections: Json | null
          top_strengths: Json | null
          user_id: string | null
        }
        Insert: {
          agent_posts?: Json | null
          audience_mix?: string[]
          created_at?: string
          crowd_size?: number
          depth?: string
          group_id?: string | null
          id?: string
          key_quote?: string | null
          key_quote_agent?: string | null
          overall_score?: number
          platform?: string
          product_description: string
          sentiment_breakdown?: Json | null
          share_token?: string | null
          sharpened_pitch?: string | null
          simulation_question?: string | null
          top_objections?: Json | null
          top_strengths?: Json | null
          user_id?: string | null
        }
        Update: {
          agent_posts?: Json | null
          audience_mix?: string[]
          created_at?: string
          crowd_size?: number
          depth?: string
          group_id?: string | null
          id?: string
          key_quote?: string | null
          key_quote_agent?: string | null
          overall_score?: number
          platform?: string
          product_description?: string
          sentiment_breakdown?: Json | null
          share_token?: string | null
          sharpened_pitch?: string | null
          simulation_question?: string | null
          top_objections?: Json | null
          top_strengths?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "simulation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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

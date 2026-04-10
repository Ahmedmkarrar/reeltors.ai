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
      email_verifications: {
        Row: {
          id: string
          email: string
          code_hash: string
          expires_at: string
          used_at: string | null
          attempts: number
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          code_hash: string
          expires_at: string
          used_at?: string | null
          attempts?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          code_hash?: string
          expires_at?: string
          used_at?: string | null
          attempts?: number
          created_at?: string | null
        }
        Relationships: []
      }
      free_generation_logs: {
        Row: {
          id: string
          user_id: string
          ip_address: string | null
          fingerprint_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          ip_address?: string | null
          fingerprint_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          ip_address?: string | null
          fingerprint_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "free_generation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle_start: string | null
          brand_name: string | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          plan: string | null
          session_fingerprint: string | null
          session_fingerprint_updated_at: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
          videos_limit: number | null
          videos_used_this_month: number | null
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle_start?: string | null
          brand_name?: string | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          phone?: string | null
          plan?: string | null
          session_fingerprint?: string | null
          session_fingerprint_updated_at?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          videos_limit?: number | null
          videos_used_this_month?: number | null
        }
        Update: {
          avatar_url?: string | null
          billing_cycle_start?: string | null
          brand_name?: string | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: string | null
          session_fingerprint?: string | null
          session_fingerprint_updated_at?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          videos_limit?: number | null
          videos_used_this_month?: number | null
        }
        Relationships: []
      }
      tunnel_sessions: {
        Row: {
          id: string
          session_token: string
          email: string | null
          ip_address: string | null
          device_fingerprint: string | null
          template_id: string | null
          source_images: string[] | null
          creatomate_render_id: string | null
          output_url: string | null
          thumbnail_url: string | null
          status: string
          abuse_blocked_reason: string | null
          has_downloaded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_token: string
          email?: string | null
          ip_address?: string | null
          device_fingerprint?: string | null
          template_id?: string | null
          source_images?: string[] | null
          creatomate_render_id?: string | null
          output_url?: string | null
          thumbnail_url?: string | null
          status?: string
          abuse_blocked_reason?: string | null
          has_downloaded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_token?: string
          email?: string | null
          ip_address?: string | null
          device_fingerprint?: string | null
          template_id?: string | null
          source_images?: string[] | null
          creatomate_render_id?: string | null
          output_url?: string | null
          thumbnail_url?: string | null
          status?: string
          abuse_blocked_reason?: string | null
          has_downloaded?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          agent_name: string | null
          created_at: string | null
          creatomate_render_id: string | null
          duration_seconds: number | null
          format: string | null
          id: string
          listing_address: string | null
          listing_price: string | null
          output_url: string | null
          source_images: string[]
          status: string | null
          template_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          created_at?: string | null
          creatomate_render_id?: string | null
          duration_seconds?: number | null
          format?: string | null
          id?: string
          listing_address?: string | null
          listing_price?: string | null
          output_url?: string | null
          source_images: string[]
          status?: string | null
          template_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string | null
          created_at?: string | null
          creatomate_render_id?: string | null
          duration_seconds?: number | null
          format?: string | null
          id?: string
          listing_address?: string | null
          listing_price?: string | null
          output_url?: string | null
          source_images?: string[]
          status?: string | null
          template_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_videos_used: { Args: { p_user_id: string }; Returns: undefined }
      reset_monthly_videos: { Args: never; Returns: undefined }
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

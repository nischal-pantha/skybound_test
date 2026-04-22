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
      aircraft_profiles: {
        Row: {
          aft_cg_limit: number | null
          baggage_arm: number | null
          created_at: string
          cruise_speed: number | null
          empty_weight: number | null
          forward_cg_limit: number | null
          front_seat_arm: number | null
          fuel_arm: number | null
          fuel_burn_rate: number | null
          id: string
          max_fuel: number | null
          max_range: number | null
          max_weight: number | null
          name: string
          performance_data: Json | null
          rear_seat_arm: number | null
          registration: string | null
          service_ceiling: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aft_cg_limit?: number | null
          baggage_arm?: number | null
          created_at?: string
          cruise_speed?: number | null
          empty_weight?: number | null
          forward_cg_limit?: number | null
          front_seat_arm?: number | null
          fuel_arm?: number | null
          fuel_burn_rate?: number | null
          id?: string
          max_fuel?: number | null
          max_range?: number | null
          max_weight?: number | null
          name: string
          performance_data?: Json | null
          rear_seat_arm?: number | null
          registration?: string | null
          service_ceiling?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aft_cg_limit?: number | null
          baggage_arm?: number | null
          created_at?: string
          cruise_speed?: number | null
          empty_weight?: number | null
          forward_cg_limit?: number | null
          front_seat_arm?: number | null
          fuel_arm?: number | null
          fuel_burn_rate?: number | null
          id?: string
          max_fuel?: number | null
          max_range?: number | null
          max_weight?: number | null
          name?: string
          performance_data?: Json | null
          rear_seat_arm?: number | null
          registration?: string | null
          service_ceiling?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flight_logs: {
        Row: {
          aircraft: string
          approaches: number | null
          created_at: string
          cross_country: number | null
          date: string
          departure: string
          destination: string
          dual: boolean | null
          flight_time: number
          holds: number | null
          id: string
          instructor: string | null
          instrument: number | null
          landings: number | null
          night: number | null
          pic: boolean | null
          remarks: string | null
          route: string | null
          solo: boolean | null
          user_id: string
          waypoints: Json | null
        }
        Insert: {
          aircraft: string
          approaches?: number | null
          created_at?: string
          cross_country?: number | null
          date: string
          departure: string
          destination: string
          dual?: boolean | null
          flight_time?: number
          holds?: number | null
          id?: string
          instructor?: string | null
          instrument?: number | null
          landings?: number | null
          night?: number | null
          pic?: boolean | null
          remarks?: string | null
          route?: string | null
          solo?: boolean | null
          user_id: string
          waypoints?: Json | null
        }
        Update: {
          aircraft?: string
          approaches?: number | null
          created_at?: string
          cross_country?: number | null
          date?: string
          departure?: string
          destination?: string
          dual?: boolean | null
          flight_time?: number
          holds?: number | null
          id?: string
          instructor?: string | null
          instrument?: number | null
          landings?: number | null
          night?: number | null
          pic?: boolean | null
          remarks?: string | null
          route?: string | null
          solo?: boolean | null
          user_id?: string
          waypoints?: Json | null
        }
        Relationships: []
      }
      flight_plans: {
        Row: {
          aircraft: string | null
          airspeed: number | null
          alternate: string | null
          altitude: number | null
          created_at: string
          departure: string | null
          destination: string | null
          flight_rules: string | null
          fuel: number | null
          id: string
          name: string
          passengers: number | null
          remarks: string | null
          route_options: Json | null
          route_type: string | null
          status: string | null
          updated_at: string
          user_id: string
          waypoints: Json | null
        }
        Insert: {
          aircraft?: string | null
          airspeed?: number | null
          alternate?: string | null
          altitude?: number | null
          created_at?: string
          departure?: string | null
          destination?: string | null
          flight_rules?: string | null
          fuel?: number | null
          id?: string
          name: string
          passengers?: number | null
          remarks?: string | null
          route_options?: Json | null
          route_type?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          waypoints?: Json | null
        }
        Update: {
          aircraft?: string | null
          airspeed?: number | null
          alternate?: string | null
          altitude?: number | null
          created_at?: string
          departure?: string | null
          destination?: string | null
          flight_rules?: string | null
          fuel?: number | null
          id?: string
          name?: string
          passengers?: number | null
          remarks?: string | null
          route_options?: Json | null
          route_type?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          waypoints?: Json | null
        }
        Relationships: []
      }
      flight_schedules: {
        Row: {
          aircraft: string
          created_at: string
          date: string
          duration: number
          id: string
          instructor: string | null
          notes: string | null
          status: string | null
          time: string
          type: string
          user_id: string
        }
        Insert: {
          aircraft: string
          created_at?: string
          date: string
          duration: number
          id?: string
          instructor?: string | null
          notes?: string | null
          status?: string | null
          time: string
          type: string
          user_id: string
        }
        Update: {
          aircraft?: string
          created_at?: string
          date?: string
          duration?: number
          id?: string
          instructor?: string | null
          notes?: string | null
          status?: string | null
          time?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_own_record: { Args: { record_user_id: string }; Returns: boolean }
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

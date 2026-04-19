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
      categories: {
        Row: {
          created_at: string
          id: string
          image: string | null
          name_en: string
          name_fa: string
          name_ps: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          name_en: string
          name_fa: string
          name_ps: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          name_en?: string
          name_fa?: string
          name_ps?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_label_en: string | null
          cta_label_fa: string | null
          cta_label_ps: string | null
          cta_link: string | null
          id: string
          image: string
          sort_order: number
          subtitle_en: string
          subtitle_fa: string
          subtitle_ps: string
          title_en: string
          title_fa: string
          title_ps: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_label_en?: string | null
          cta_label_fa?: string | null
          cta_label_ps?: string | null
          cta_link?: string | null
          id?: string
          image: string
          sort_order?: number
          subtitle_en?: string
          subtitle_fa?: string
          subtitle_ps?: string
          title_en?: string
          title_fa?: string
          title_ps?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_label_en?: string | null
          cta_label_fa?: string | null
          cta_label_ps?: string | null
          cta_link?: string | null
          id?: string
          image?: string
          sort_order?: number
          subtitle_en?: string
          subtitle_fa?: string
          subtitle_ps?: string
          title_en?: string
          title_fa?: string
          title_ps?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          created_at: string
          customer_name: string
          id: string
          items: Json
          language: string
          notes: string | null
          phone: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_name: string
          id?: string
          items?: Json
          language?: string
          notes?: string | null
          phone: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          items?: Json
          language?: string
          notes?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description_en: string | null
          description_fa: string | null
          description_ps: string | null
          featured: boolean
          gallery: Json
          id: string
          image_url: string | null
          in_stock: boolean
          name_en: string
          name_fa: string
          name_ps: string
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_fa?: string | null
          description_ps?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name_en: string
          name_fa: string
          name_ps: string
          price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_fa?: string | null
          description_ps?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name_en?: string
          name_fa?: string
          name_ps?: string
          price?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          about_en: string | null
          about_fa: string | null
          about_ps: string | null
          address: string | null
          business_hours: string | null
          email: string | null
          facebook_url: string | null
          favicon_url: string | null
          footer_text_en: string | null
          footer_text_fa: string | null
          footer_text_ps: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          meta_description_en: string | null
          meta_description_fa: string | null
          meta_description_ps: string | null
          phone: string | null
          primary_color: string | null
          store_name_en: string
          store_name_fa: string
          store_name_ps: string
          telegram_url: string | null
          twitter_url: string | null
          updated_at: string
          whatsapp_number: string
          whatsapp_number_2: string | null
          youtube_url: string | null
        }
        Insert: {
          about_en?: string | null
          about_fa?: string | null
          about_ps?: string | null
          address?: string | null
          business_hours?: string | null
          email?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          footer_text_en?: string | null
          footer_text_fa?: string | null
          footer_text_ps?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          meta_description_en?: string | null
          meta_description_fa?: string | null
          meta_description_ps?: string | null
          phone?: string | null
          primary_color?: string | null
          store_name_en?: string
          store_name_fa?: string
          store_name_ps?: string
          telegram_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp_number?: string
          whatsapp_number_2?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_en?: string | null
          about_fa?: string | null
          about_ps?: string | null
          address?: string | null
          business_hours?: string | null
          email?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          footer_text_en?: string | null
          footer_text_fa?: string | null
          footer_text_ps?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          meta_description_en?: string | null
          meta_description_fa?: string | null
          meta_description_ps?: string | null
          phone?: string | null
          primary_color?: string | null
          store_name_en?: string
          store_name_fa?: string
          store_name_ps?: string
          telegram_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          whatsapp_number?: string
          whatsapp_number_2?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "admin" | "user"
      order_status: "pending" | "contacted" | "completed" | "cancelled"
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
      app_role: ["admin", "user"],
      order_status: ["pending", "contacted", "completed", "cancelled"],
    },
  },
} as const

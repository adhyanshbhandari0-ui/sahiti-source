export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      business_images: {
        Row: {
          caption: string;
          created_at: string;
          id: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          caption?: string;
          created_at?: string;
          id?: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          caption?: string;
          created_at?: string;
          id?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: string;
          thread_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: string;
          thread_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "chat_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_threads: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          author_id: string;
          author_name: string;
          content: string;
          created_at: string;
          id: string;
          post_id: string;
        };
        Insert: {
          author_id: string;
          author_name: string;
          content: string;
          created_at?: string;
          id?: string;
          post_id: string;
        };
        Update: {
          author_id?: string;
          author_name?: string;
          content?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      loan_accounts: {
        Row: {
          annual_interest_rate: number;
          created_at: string;
          id: string;
          lender_name: string;
          monthly_emi: number;
          next_due_date: string;
          outstanding_principal: number;
          sanctioned_amount: number;
          scheme_name: string;
          start_date: string;
          status: string;
          subsidy_status: string;
          tenure_months: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          annual_interest_rate: number;
          created_at?: string;
          id?: string;
          lender_name: string;
          monthly_emi: number;
          next_due_date: string;
          outstanding_principal: number;
          sanctioned_amount: number;
          scheme_name: string;
          start_date: string;
          status?: string;
          subsidy_status?: string;
          tenure_months: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          annual_interest_rate?: number;
          created_at?: string;
          id?: string;
          lender_name?: string;
          monthly_emi?: number;
          next_due_date?: string;
          outstanding_principal?: number;
          sanctioned_amount?: number;
          scheme_name?: string;
          start_date?: string;
          status?: string;
          subsidy_status?: string;
          tenure_months?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          achieved_on: string;
          created_at: string;
          id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          achieved_on?: string;
          created_at?: string;
          id?: string;
          title: string;
          user_id: string;
        };
        Update: {
          achieved_on?: string;
          created_at?: string;
          id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author_id: string | null;
          author_initials: string;
          author_name: string;
          category: string;
          content: string;
          created_at: string;
          document_url: string | null;
          id: string;
          image_url: string | null;
          is_sample: boolean;
          post_type: string;
          region: string;
          scheme_type: string;
        };
        Insert: {
          author_id?: string | null;
          author_initials?: string;
          author_name: string;
          category: string;
          content: string;
          created_at?: string;
          document_url?: string | null;
          id?: string;
          image_url?: string | null;
          is_sample?: boolean;
          post_type?: string;
          region: string;
          scheme_type: string;
        };
        Update: {
          author_id?: string | null;
          author_initials?: string;
          author_name?: string;
          category?: string;
          content?: string;
          created_at?: string;
          document_url?: string | null;
          id?: string;
          image_url?: string | null;
          is_sample?: boolean;
          post_type?: string;
          region?: string;
          scheme_type?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          block: string;
          business_name: string;
          category: string;
          created_at: string;
          description: string;
          display_name: string;
          district: string;
          email: string | null;
          employees: number;
          id: string;
          is_verified: boolean;
          locale: string;
          monthly_revenue_range: string;
          operational_since: string | null;
          phone: string;
          pincode: string;
          registration_number: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          block?: string;
          business_name?: string;
          category?: string;
          created_at?: string;
          description?: string;
          display_name: string;
          district?: string;
          email?: string | null;
          employees?: number;
          id: string;
          is_verified?: boolean;
          locale?: string;
          monthly_revenue_range?: string;
          operational_since?: string | null;
          phone: string;
          pincode?: string;
          registration_number?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          block?: string;
          business_name?: string;
          category?: string;
          created_at?: string;
          description?: string;
          display_name?: string;
          district?: string;
          email?: string | null;
          employees?: number;
          id?: string;
          is_verified?: boolean;
          locale?: string;
          monthly_revenue_range?: string;
          operational_since?: string | null;
          phone?: string;
          pincode?: string;
          registration_number?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      risk_locations: {
        Row: {
          address: string;
          business_type: string;
          buyer_concentration: number;
          competitor_density: number;
          demand_note: string;
          id: string;
          latitude: number;
          longitude: number;
          market_saturation: number;
          name: string;
          risk_score: number;
          roi_note: string;
          seasonal_demand_risk: number;
          source_label: string;
        };
        Insert: {
          address: string;
          business_type: string;
          buyer_concentration: number;
          competitor_density: number;
          demand_note: string;
          id?: string;
          latitude: number;
          longitude: number;
          market_saturation: number;
          name: string;
          risk_score: number;
          roi_note: string;
          seasonal_demand_risk: number;
          source_label?: string;
        };
        Update: {
          address?: string;
          business_type?: string;
          buyer_concentration?: number;
          competitor_density?: number;
          demand_note?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          market_saturation?: number;
          name?: string;
          risk_score?: number;
          roi_note?: string;
          seasonal_demand_risk?: number;
          source_label?: string;
        };
        Relationships: [];
      };
      roi_entries: {
        Row: {
          created_at: string;
          expenses: number;
          id: string;
          period: string;
          sales: number;
          target: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expenses: number;
          id?: string;
          period: string;
          sales: number;
          target?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expenses?: number;
          id?: string;
          period?: string;
          sales?: number;
          target?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      saved_posts: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      scheme_applications: {
        Row: {
          aadhaar_last_four: string;
          business_type: string;
          eligibility_answers: Json;
          eligibility_result: string;
          id: string;
          loan_amount: number;
          margin_capital: number;
          reference_id: string;
          scheme_name: string;
          status: string;
          submitted_at: string;
          udyam_number: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          aadhaar_last_four: string;
          business_type: string;
          eligibility_answers?: Json;
          eligibility_result: string;
          id?: string;
          loan_amount: number;
          margin_capital: number;
          reference_id: string;
          scheme_name: string;
          status?: string;
          submitted_at?: string;
          udyam_number?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          aadhaar_last_four?: string;
          business_type?: string;
          eligibility_answers?: Json;
          eligibility_result?: string;
          id?: string;
          loan_amount?: number;
          margin_capital?: number;
          reference_id?: string;
          scheme_name?: string;
          status?: string;
          submitted_at?: string;
          udyam_number?: string | null;
          updated_at?: string;
          user_id?: string;
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
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

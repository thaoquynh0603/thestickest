export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      carousel_items: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          message_h1: string
          message_text: string | null
          position: string | null
          product_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          message_h1: string
          message_text?: string | null
          position?: string | null
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          message_h1?: string
          message_text?: string | null
          position?: string | null
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carousel_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          id: string
          name: string
          font_family: string | null
          palette: Json
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          font_family?: string | null
          palette?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          font_family?: string | null
          palette?: Json
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      },
      products: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          title: string
          description: string | null
          slug: string
          is_active: boolean
          product_image_url: string | null
          template_id: string | null
          // Add other product fields as needed
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          title: string
          description?: string | null
          slug: string
          is_active?: boolean
          product_image_url?: string | null
          template_id?: string | null
          // Add other product fields as needed
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          title?: string
          description?: string | null
          slug?: string
          is_active?: boolean
          product_image_url?: string | null
          template_id?: string | null
          // Add other product fields as needed
        }
        Relationships: [
          {
            foreignKeyName: "products_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          }
        ]
      }
      custom_questions: {
        Row: {
          created_at: string
          custom_template_id: number
          id: number
          options: Json | null
          question_text: string
          question_type: string
        }
        Insert: {
          created_at?: string
          custom_template_id: number
          id?: never
          options?: Json | null
          question_text: string
          question_type?: string
        }
        Update: {
          created_at?: string
          custom_template_id?: number
          id?: never
          options?: Json | null
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_questions_custom_template_id_fkey"
            columns: ["custom_template_id"]
            isOneToOne: false
            referencedRelation: "custom_template"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_template: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      design_request_answers_history: {
        Row: {
          answer_file_url: string | null
          answer_options: Json | null
          answer_text: string | null
          created_at: string
          created_by: string | null
          id: string
          is_current: boolean | null
          question_id: string
          request_id: string
          version: number
        }
        Insert: {
          answer_file_url?: string | null
          answer_options?: Json | null
          answer_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_current?: boolean | null
          question_id: string
          request_id: string
          version?: number
        }
        Update: {
          answer_file_url?: string | null
          answer_options?: Json | null
          answer_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_current?: boolean | null
          question_id?: string
          request_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_request_answers_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "request_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_request_answers_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_request_answers_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests_current_state"
            referencedColumns: ["request_id"]
          },
        ]
      }
      design_request_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_data: Json
          event_type: string
          id: string
          metadata: Json | null
          request_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_data?: Json
          event_type: string
          id?: string
          metadata?: Json | null
          request_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          metadata?: Json | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests_current_state"
            referencedColumns: ["request_id"]
          },
        ]
      }
      design_request_states: {
        Row: {
          created_at: string
          current_payment_status: string
          current_status: string
          design_code: string
          email: string | null
          id: string
          last_payment_attempt_at: string | null
          payment_attempts: number | null
          payment_confirmed_at: string | null
          payment_currency: string | null
          payment_failure_code: string | null
          payment_failure_reason: string | null
          payment_fee_amount: number | null
          payment_method: string | null
          payment_net_amount: number | null
          product_id: string
          request_id: string
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_payment_status?: string
          current_status?: string
          design_code: string
          email?: string | null
          id?: string
          last_payment_attempt_at?: string | null
          payment_attempts?: number | null
          payment_confirmed_at?: string | null
          payment_currency?: string | null
          payment_failure_code?: string | null
          payment_failure_reason?: string | null
          payment_fee_amount?: number | null
          payment_method?: string | null
          payment_net_amount?: number | null
          product_id: string
          request_id: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_payment_status?: string
          current_status?: string
          design_code?: string
          email?: string | null
          id?: string
          last_payment_attempt_at?: string | null
          payment_attempts?: number | null
          payment_confirmed_at?: string | null
          payment_currency?: string | null
          payment_failure_code?: string | null
          payment_failure_reason?: string | null
          payment_fee_amount?: number | null
          payment_method?: string | null
          payment_net_amount?: number | null
          product_id?: string
          request_id?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_request_states_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_request_states_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_request_states_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "design_requests_current_state"
            referencedColumns: ["request_id"]
          },
        ]
      }
      design_requests: {
        Row: {
          created_at: string | null
          design_code: string
          email: string | null
          id: string
          product_id: string | null
          selected_style_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          design_code: string
          email?: string | null
          id?: string
          product_id?: string | null
          selected_style_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          design_code?: string
          email?: string | null
          id?: string
          product_id?: string | null
          selected_style_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_requests_selected_style_id_fkey"
            columns: ["selected_style_id"]
            isOneToOne: false
            referencedRelation: "design_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      design_styles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          product_id: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          product_id?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          product_id?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_styles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          email_restrictions: string[] | null
          expiration_date: string | null
          id: string
          is_active: boolean
          max_users: number | null
          min_order_amount: number | null
          usage_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value: number
          email_restrictions?: string[] | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          max_users?: number | null
          min_order_amount?: number | null
          usage_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          email_restrictions?: string[] | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          max_users?: number | null
          min_order_amount?: number | null
          usage_count?: number
        }
        Relationships: []
      }
      faq_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
          status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
          updated_at?: string | null
        }
        Relationships: []
      },
      admin_users: {
        Row: {
          id: string
          email: string
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      option_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          options: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          options: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          options?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      question_demo_items: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          question_slug: string
          is_active: boolean
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          question_slug: string
          is_active?: boolean
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          question_slug?: string
          is_active?: boolean
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount: number | null
          application_id: string
          created_at: string
          currency: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string | null
          id: string
          status: string | null
          stripe_payment_intent_id: string
        }
        Insert: {
          amount?: number | null
          application_id: string
          created_at?: string
          currency?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id: string
        }
        Update: {
          amount?: number | null
          application_id?: string
          created_at?: string
          currency?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          design_time: string | null
          examples: string[] | null
          features: string[] | null
          font_family: string | null
          id: string
          is_active: boolean | null
          materials: string[] | null
          min_quantity: number | null
          palette: Json | null
          product_image_url: string | null
          sizes: string[] | null
          slug: string
          starting_price: number | null
          subtitle: string | null
          template_name: string | null
          title: string | null
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_time?: string | null
          examples?: string[] | null
          features?: string[] | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          materials?: string[] | null
          min_quantity?: number | null
          palette?: Json | null
          product_image_url?: string | null
          sizes?: string[] | null
          slug: string
          starting_price?: number | null
          subtitle?: string | null
          template_name?: string | null
          title?: string | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_time?: string | null
          examples?: string[] | null
          features?: string[] | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          materials?: string[] | null
          min_quantity?: number | null
          palette?: Json | null
          product_image_url?: string | null
          sizes?: string[] | null
          slug?: string
          starting_price?: number | null
          subtitle?: string | null
          template_name?: string | null
          title?: string | null
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Relationships: []
      }
      request_questions: {
        Row: {
          created_at: string
          custom_template_id: number | null
          id: string
          is_active: boolean
          is_customisable: boolean
          is_required: boolean
          option_template_id: string | null
          options: Json | null
          product_id: string
          question_text: string
          question_type: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          custom_template_id?: number | null
          id?: string
          is_active?: boolean
          is_customisable?: boolean
          is_required?: boolean
          option_template_id?: string | null
          options?: Json | null
          product_id: string
          question_text: string
          question_type?: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          custom_template_id?: number | null
          id?: string
          is_active?: boolean
          is_customisable?: boolean
          is_required?: boolean
          option_template_id?: string | null
          options?: Json | null
          product_id?: string
          question_text?: string
          question_type?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_questions_custom_template_id_fkey"
            columns: ["custom_template_id"]
            isOneToOne: false
            referencedRelation: "custom_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_questions_option_template_id_fkey"
            columns: ["option_template_id"]
            isOneToOne: false
            referencedRelation: "option_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      design_requests_current_state: {
        Row: {
          current_payment_status: string | null
          current_status: string | null
          design_code: string | null
          email: string | null
          last_payment_attempt_at: string | null
          payment_attempts: number | null
          payment_confirmed_at: string | null
          payment_currency: string | null
          payment_failure_code: string | null
          payment_failure_reason: string | null
          payment_fee_amount: number | null
          payment_method: string | null
          payment_net_amount: number | null
          product_id: string | null
          request_id: string | null
          stripe_payment_intent_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_request_states_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_design_request_answer_history: {
        Args: {
          p_request_id: string
          p_question_id: string
          p_answer_text?: string
          p_answer_file_url?: string
          p_answer_options?: Json
          p_created_by?: string
        }
        Returns: string
      }
      add_design_request_event: {
        Args: {
          p_request_id: string
          p_event_type: string
          p_event_data?: Json
          p_created_by?: string
          p_metadata?: Json
        }
        Returns: string
      }
      can_access_product_details: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_design_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_payment_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          date: string
          total_applications: number
          successful_payments: number
          failed_payments: number
          total_revenue: number
          total_fees: number
          net_revenue: number
          created_at: string
          updated_at: string
        }[]
      }
      get_product_by_slug: {
        Args: { product_slug: string }
        Returns: {
          id: string
          slug: string
          title: string
          subtitle: string
          product_image_url: string
          description: string
          features: string[]
          use_cases: string[]
          materials: string[]
          sizes: string[]
          starting_price: number
          min_quantity: number
          design_time: string
          examples: string[]
          is_active: boolean
          created_at: string
          updated_at: string
          template_name: string
          font_family: string
          palette: Json
          carousel_items: Json
        }[]
      }
      get_product_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          slug: string
          title: string
          subtitle: string
          product_image_url: string
          description: string
          features: string[]
          use_cases: string[]
          materials: string[]
          sizes: string[]
          starting_price: number
          min_quantity: number
          design_time: string
          examples: string[]
          is_active: boolean
          created_at: string
          updated_at: string
          template_name: string
          font_family: string
          palette: Json
          carousel_items: Json
        }[]
      }
      get_product_with_styles: {
        Args: { p_slug: string }
        Returns: {
          product_id: string
          slug: string
          title: string
          subtitle: string
          product_image_url: string
          description: string
          examples: string[]
          is_active: boolean
          price: number
          template_id: string
          created_at: string
          updated_at: string
          design_styles: Json
        }[]
      }
      increment_discount_code_usage: {
        Args: { p_code: string }
        Returns: boolean
      }
      insert_faq_submission: {
        Args: {
          p_name: string
          p_email: string
          p_subject: string
          p_message: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_payment_event: {
        Args: {
          p_application_id: string
          p_stripe_payment_intent_id: string
          p_event_type: string
          p_event_data: Json
          p_amount: number
          p_currency: string
          p_status: string
          p_error_message: string
        }
        Returns: undefined
      }
      secure_log_payment_event: {
        Args: {
          p_application_id: string
          p_stripe_payment_intent_id: string
          p_event_type: string
          p_event_data: Json
          p_amount: number
          p_currency: string
          p_status: string
          p_error_message: string
        }
        Returns: string
      }
      update_application_payment_canceled: {
        Args: { p_application_id: string }
        Returns: undefined
      }
      update_application_payment_failure: {
        Args: {
          p_application_id: string
          p_failure_reason: string
          p_failure_code: string
        }
        Returns: undefined
      }
      update_application_payment_success: {
        Args: {
          p_application_id: string
          p_payment_method: string
          p_payment_net_amount: number
        }
        Returns: undefined
      }
      validate_discount_code: {
        Args: { p_code: string; p_email?: string; p_order_amount?: number }
        Returns: {
          is_valid: boolean
          discount_amount: number
          discount_type: string
          discount_value: number
          message: string
        }[]
      }
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

// Convenience aliases for app code
export type Product = Tables<'products'> & { price?: number }
export type DesignApplication = Tables<'design_requests'>

export interface CarouselItem {
  id: string;
  image_url: string;
  is_active: boolean | null;
  message_h1: string;
  message_text: string | null;
  position: string | null;
  product_id: string | null;
  sort_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ProductWithCarousel = Product & {
  carousel_items?: CarouselItem[];
  templates?: {
    name: string;
    font_family: string | null;
    palette: {
      overlayBg?: string;
      overlayInk?: string;
      overlayMuted?: string;
      accent?: string;
      pageBg?: string;
      breadcrumbBg?: string;
      ctaSectionBg?: string;
      processBg?: string;
    };
  } | null;
  template_name?: string;
  font_family?: string;
  palette?: {
    overlayBg?: string;
    overlayInk?: string;
    overlayMuted?: string;
    accent?: string;
    pageBg?: string;
    breadcrumbBg?: string;
    ctaSectionBg?: string;
    processBg?: string;
  };
};

export const Constants = {
  public: {
    Enums: {},
  },
} as const

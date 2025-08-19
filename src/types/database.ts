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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      payment_tracking: {
        Row: {
          id: string
          request_id: string
          stripe_payment_intent_id: string
          stripe_customer_id: string | null
          payment_amount: number
          payment_currency: string
          payment_status: string
          payment_method: string | null
          payment_method_details: Json | null
          stripe_charge_id: string | null
          stripe_receipt_url: string | null
          stripe_application_fee_amount: number | null
          stripe_transfer_data: Json | null
          discount_code_applied: string | null
          discount_amount: number
          net_amount: number
          processing_fee_amount: number
          payment_created_at: string
          payment_confirmed_at: string | null
          payment_failed_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          failure_reason: string | null
          failure_code: string | null
        }
        Insert: {
          id?: string
          request_id: string
          stripe_payment_intent_id: string
          stripe_customer_id?: string | null
          payment_amount: number
          payment_currency?: string
          payment_status?: string
          payment_method?: string | null
          payment_method_details?: Json | null
          stripe_charge_id?: string | null
          stripe_receipt_url?: string | null
          stripe_application_fee_amount?: number | null
          stripe_transfer_data?: Json | null
          discount_code_applied?: string | null
          discount_amount?: number
          net_amount?: number
          processing_fee_amount?: number
          payment_created_at?: string
          payment_confirmed_at?: string | null
          payment_failed_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          failure_reason?: string | null
          failure_code?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          stripe_payment_intent_id?: string
          stripe_customer_id?: string | null
          payment_amount?: number
          payment_currency?: string
          payment_status?: string
          payment_method?: string | null
          payment_method_details?: Json | null
          stripe_charge_id?: string | null
          stripe_receipt_url?: string | null
          stripe_application_fee_amount?: number | null
          stripe_transfer_data?: Json | null
          discount_code_applied?: string | null
          discount_amount?: number
          net_amount?: number
          processing_fee_amount?: number
          payment_created_at?: string
          payment_confirmed_at?: string | null
          payment_failed_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          failure_reason?: string | null
          failure_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_tracking_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          }
        ]
      }
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
      custom_questions: {
        Row: {
          created_at: string
          custom_template_id: number
          id: number
          is_required: boolean
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          custom_template_id: number
          id?: never
          is_required?: boolean
          options?: Json | null
          question_text: string
          question_type?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          custom_template_id?: number
          id?: never
          is_required?: boolean
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number
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
      faq_submissions: {
        Row: {
          id: string
          name: string | null
          email: string | null
          subject: string | null
          message: string | null
          status: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          subject?: string | null
          message?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          subject?: string | null
          message?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      design_request_answers_history: {
        Row: {
          ai_generated_id: string | null
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
          ai_generated_id?: string | null
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
          ai_generated_id?: string | null
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
            foreignKeyName: "design_applications_product_id_fkey"
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
      design_requests_backup: {
        Row: {
          created_at: string | null
          design_code: string | null
          email: string | null
          id: string | null
          product_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          design_code?: string | null
          email?: string | null
          id?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          design_code?: string | null
          email?: string | null
          id?: string | null
          product_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_styles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          product_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          product_id?: string | null
          sort_order?: number | null
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
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          restricted_emails: string[] | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          restricted_emails?: string[] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          restricted_emails?: string[] | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      gemini_runs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          prompt: string
          question_id: string | null
          request_id: string | null
          response: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          prompt: string
          question_id?: string | null
          request_id?: string | null
          response: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          prompt?: string
          question_id?: string | null
          request_id?: string | null
          response?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gemini_runs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "request_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemini_runs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gemini_runs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests_current_state"
            referencedColumns: ["request_id"]
          },
        ]
      }
      how_did_you_hear_answers: {
        Row: {
          created_at: string
          id: string
          request_id: string
          selected_options: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          selected_options: string[]
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          selected_options?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "how_did_you_hear_answers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "how_did_you_hear_answers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "design_requests_current_state"
            referencedColumns: ["request_id"]
          },
        ]
      }
      option_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          source_config: Json
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          source_config?: Json
          source_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          source_config?: Json
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          average_payment_time_seconds: number | null
          created_at: string | null
          date: string
          failed_payments: number | null
          id: string
          net_revenue: number | null
          successful_payments: number | null
          total_applications: number | null
          total_fees: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          average_payment_time_seconds?: number | null
          created_at?: string | null
          date: string
          failed_payments?: number | null
          id?: string
          net_revenue?: number | null
          successful_payments?: number | null
          total_applications?: number | null
          total_fees?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          average_payment_time_seconds?: string | null
          created_at?: string | null
          date?: string
          failed_payments?: number | null
          id?: string
          net_revenue?: number | null
          successful_payments?: number | null
          total_applications?: number | null
          total_fees?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          amount: number | null
          application_id: string
          created_at: string | null
          currency: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string
          id: string
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          application_id: string
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          application_id?: string
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "design_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "design_requests_current_state"
            referencedColumns: ["request_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string | null
          price: number
          product_image_url: string | null
          slug: string
          subtitle: string | null
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          price?: number
          product_image_url?: string | null
          slug: string
          subtitle?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          price?: number
          product_image_url?: string | null
          slug?: string
          subtitle?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      question_demo_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          question_slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          question_slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          question_slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      request_questions: {
        Row: {
          ai_generated_prompt: string | null
          ai_prompt_placeholder: Json | null
          ai_structured_output: string | null
          created_at: string | null
          custom_template_id: number | null
          id: string
          is_active: boolean | null
          is_ai_generated: boolean
          is_customisable: boolean
          is_required: boolean | null
          option_template_id: string | null
          product_id: string | null
          question_text: string
          question_type: string
          sort_order: number | null
          subtext: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated_prompt?: string | null
          ai_prompt_placeholder?: Json | null
          ai_structured_output?: string | null
          created_at?: string | null
          custom_template_id?: number | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean
          is_customisable?: boolean
          is_required?: boolean | null
          option_template_id?: string | null
          product_id?: string | null
          question_text: string
          question_type: string
          sort_order?: number | null
          subtext?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated_prompt?: string | null
          ai_prompt_placeholder?: Json | null
          ai_structured_output?: string | null
          created_at?: string | null
          custom_template_id?: number | null
          id?: string
          is_active?: boolean | null
          is_ai_generated?: boolean
          is_customisable?: boolean
          is_required?: boolean | null
          option_template_id?: string | null
          product_id?: string | null
          question_text?: string
          question_type?: string
          sort_order?: number | null
          subtext?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_template"
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
        ]
      }
      templates: {
        Row: {
          created_at: string | null
          font_family: string | null
          id: string
          name: string
          palette: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          font_family?: string | null
          id?: string
          name: string
          palette?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          font_family?: string | null
          id?: string
          name?: string
          palette?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      design_requests_current_state: {
        Row: {
          created_at: string | null
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
          product_slug: string | null
          product_title: string | null
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
          p_answer_file_url?: string
          p_answer_options?: Json
          p_answer_text?: string
          p_created_by?: string
          p_question_id: string
          p_request_id: string
        }
        Returns: string
      }
      add_design_request_event: {
        Args: {
          p_created_by: string
          p_event_data: Json
          p_event_type: string
          p_metadata?: Json
          p_request_id: string
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
          created_at: string
          date: string
          failed_payments: number
          net_revenue: number
          successful_payments: number
          total_applications: number
          total_fees: number
          total_revenue: number
          updated_at: string
        }[]
      }
      get_product_by_slug: {
        Args: { product_slug: string }
        Returns: {
          carousel_items: Json
          created_at: string
          description: string
          font_family: string
          id: string
          is_active: boolean
          palette: Json
          price: number
          product_image_url: string
          slug: string
          subtitle: string
          template_name: string
          title: string
          updated_at: string
        }[]
      }
      get_product_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          carousel_items: Json
          description: string
          font_family: string
          id: string
          is_active: boolean
          palette: Json
          price: number
          product_image_url: string
          slug: string
          subtitle: string
          template_name: string
          title: string
          updated_at: string
        }[]
      }
      get_product_with_styles: {
        Args: { p_slug: string }
        Returns: {
          created_at: string
          description: string
          design_styles: Json
          examples: string[]
          is_active: boolean
          price: number
          product_id: string
          product_image_url: string
          slug: string
          subtitle: string
          template_id: string
          title: string
          updated_at: string
        }[]
      }
      increment_discount_code_usage: {
        Args: { p_code: string }
        Returns: boolean
      }
      insert_faq_submission: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_subject: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_payment_event: {
        Args: {
          p_amount: number
          p_application_id: string
          p_currency: string
          p_error_message: string
          p_event_data: Json
          p_event_type: string
          p_status: string
          p_stripe_payment_intent_id: string
        }
        Returns: undefined
      }
      secure_log_payment_event: {
        Args: {
          p_amount: number
          p_application_id: string
          p_currency: string
          p_error_message: string
          p_event_data: Json
          p_event_type: string
          p_status: string
          p_stripe_payment_intent_id: string
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
          p_failure_code: string
          p_failure_reason: string
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
          discount_amount: number
          discount_type: string
          discount_value: number
          is_valid: boolean
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
  template_name?: string;
  font_family?: string;
};

export const Constants = {
  public: {
    Enums: {},
  },
} as const
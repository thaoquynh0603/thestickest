// Generated Supabase types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          }
        ]
      }
      faq_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
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
          id: string
          is_active: boolean | null
          materials: string[] | null
          min_quantity: number | null
          product_image_url: string | null
          sizes: string[] | null
          slug: string
          starting_price: number | null
          subtitle: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_time?: string | null
          examples?: string[] | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          materials?: string[] | null
          min_quantity?: number | null
          product_image_url?: string | null
          sizes?: string[] | null
          slug: string
          starting_price?: number | null
          subtitle?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_time?: string | null
          examples?: string[] | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          materials?: string[] | null
          min_quantity?: number | null
          product_image_url?: string | null
          sizes?: string[] | null
          slug?: string
          starting_price?: number | null
          subtitle?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          use_cases?: string[] | null
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
      [_ in never]: never
    }
    Functions: {
      can_access_product_details: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

// Legacy interfaces for backward compatibility
export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  product_image_url: string;
  description: string;
  features: string[];
  use_cases: string[];
  materials: string[];
  sizes: string[];
  starting_price: number;
  min_quantity: number;
  design_time: string;
  examples: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  template_name: string;
  font_family: string;
  palette: ProductPalette;
  carousel_items: CarouselItem[];
}

export interface CarouselItem {
  id: string;
  image_url: string;
  message_h1: string;
  message_text: string;
  position: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductPalette {
  overlayBg: string;
  overlayInk: string;
  overlayMuted: string;
  accent: string;
  pageBg: string;
  breadcrumbBg: string;
  ctaSectionBg: string;
  processBg: string;
}

export interface Template {
  id: string;
  name: string;
  font_family: string;
  palette: ProductPalette;
  created_at: string;
  updated_at: string;
}

// FAQ Submission interface
export interface FAQSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

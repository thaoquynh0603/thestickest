export interface ApplicationQuestion {
  id: string;
  question_text: string;
  subtext?: string | null;
  question_type: string;
  options?: string[];
  option_items?: Array<{
    id?: string;
    name: string;
    description?: string | null;
    image_url?: string | null;
  }>;
  is_required: boolean;
  sort_order: number;
  is_customisable: boolean;
  custom_template_id?: string | null;
  // AI-related fields
  is_ai_generated?: boolean;
  ai_generated_prompt?: string | null;
  ai_structured_output?: string | null;
  ai_prompt_placeholder?: any | null;
}

export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

export interface ApplicationData {
  email: string;
  [key: string]: string | File | string[] | undefined;
}

export interface GeminiResponse {
  text: string;
  placeholders: string[];
}

export interface GeminiRun {
  id: string;
  request_id: string;
  question_id: string;
  prompt: string;
  response: GeminiResponse;
  created_at: string;
  created_by?: string;
  metadata?: any;
}


